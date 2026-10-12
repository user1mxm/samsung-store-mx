import { z } from 'zod';
import { createHash } from 'node:crypto';
import { transaction, audit, json } from '../commerce/core.mjs';
import { toCents, fromCents } from '../payments/money.mjs';

const text = max => z.string().trim().min(1).max(max);
const money = z.union([z.string(), z.number()]).transform(value => {
  try { return fromCents(toCents(value)); } catch { throw new Error('Precio inválido: usa MXN sin $ ni separadores, con hasta dos decimales'); }
});
export function safeUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
export const imageUrl = text(2000).refine(value => /^\/(?!\/)[a-zA-Z0-9/_.-]+$/.test(value) && !value.split('/').includes('..') || safeUrl(value), 'Usa una imagen HTTPS o una imagen local de la tienda');
export const evidenceSchema = z.object({
  sourceUrl: z.string().max(2000).refine(safeUrl, 'Fuente HTTPS requerida'),
  sourceModel: text(100),
  imageSourceUrl: z.string().max(2000).refine(safeUrl, 'Fuente de imagen HTTPS requerida'),
  status: z.enum(['pending', 'reviewed']),
  notes: z.string().trim().max(1000).default(''),
}).strict();
export const productFields = z.object({
  name: text(255), model: text(100), category: text(100), price: money,
  stock: z.number().int().min(0).max(2147483647), imageUrl,
  description: z.string().max(16000),
  features: z.array(text(300)).max(30), specs: z.record(text(100), z.string().max(500)),
  rating: z.string().regex(/^[0-4](\.\d)?$|^5(\.0)?$/), featured: z.enum(['yes', 'no']),
}).partial().strict();
export const catalogRows = z.array(z.object({
  id: z.number().int().positive().optional(),
  data: productFields,
  evidence: evidenceSchema.optional(),
}).strict()).min(1).max(100);
const fields = ['name','model','category','price','stock','imageUrl','description','features','specs','rating','featured'];
const normalizeModel = value => String(value || '').trim().toUpperCase();
const snapshot = p => Object.fromEntries(['id',...fields].map(k=>[k,p[k] ?? null]));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function planCatalog(rawRows, products, categories, evidence = {}) {
  const rows = catalogRows.parse(rawRows), seen = new Set(), plans = [];
  const errors = [];
  rows.forEach((row,index) => {
    try {
      const before = row.id ? products.find(p=>Number(p.id)===row.id) : null;
      if (row.id && !before) throw Error('ID inexistente; exporta nuevamente el catálogo');
      if (!Object.keys(row.data).length && !row.evidence) throw Error('Fila sin cambios');
      const next = {...before,...row.data};
      for (const key of ['name','model','category','price','stock','imageUrl']) if (next[key] === undefined || next[key] === null || next[key] === '') throw Error(`Falta ${key}`);
      if (!categories.includes(next.category)) throw Error('Categoría desconocida; usa una del catálogo');
      const key = row.id ? `id:${row.id}` : `model:${normalizeModel(next.model)}`;
      if (seen.has(key)) throw Error('Producto repetido en el lote');
      seen.add(key);
      // Existing units may share a model. An update must target an explicit ID.
      if (!row.id && products.some(p=>normalizeModel(p.model)===normalizeModel(next.model))) throw Error('El modelo ya existe: usa su ID para actualizar, no crees un duplicado');
      if (row.evidence && normalizeModel(row.evidence.sourceModel) !== normalizeModel(next.model)) throw Error('El modelo de la fuente no coincide exactamente con el producto');
      const changes = Object.keys(row.data).filter(k=>JSON.stringify(before?.[k] ?? null)!==JSON.stringify(row.data[k]));
      plans.push({row:index+1, action:row.id?'update':'create', id:row.id || null, model:next.model, name:next.name, changes, data:row.data, evidence:row.evidence, before:before?snapshot(before):null, previousEvidence:evidence[row.id] ?? null});
    } catch (e) { errors.push({row:index+1,message:e.message}); }
  });
  return {plans,errors,token:hash(plans),creates:plans.filter(p=>p.action==='create').length,updates:plans.filter(p=>p.action==='update').length};
}

export async function catalogState(c,lock=false) {
  const [products] = await c.query(`SELECT ${['id',...fields].join(',')} FROM products ORDER BY id${lock?' FOR UPDATE':''}`);
  const [categories] = await c.query('SELECT slug FROM categories');
  const [sources] = await c.query("SELECT name,body FROM storeSettings WHERE name LIKE 'productSource:%'");
  return {products,categories:categories.map(c=>c.slug),evidence:Object.fromEntries(sources.map(s=>[s.name.slice(14),json(s.body)]))};
}
export async function previewCatalog(pool,rows) {
  const state=await catalogState(pool);
  return planCatalog(rows,state.products,state.categories,state.evidence);
}

export async function applyCatalog(pool,actorId,rows,token,requestId) {
  const inputHash=hash({rows,token});
  return transaction(pool,async c=>{
    // Shared lock also serializes legacy single-product mutations.
    await c.execute("INSERT IGNORE INTO storeSettings (name,body) VALUES ('catalogWriteLock','{}')");
    await c.execute("SELECT name FROM storeSettings WHERE name='catalogWriteLock' FOR UPDATE");
    const receiptKey=`catalogBatch:${requestId}`;
    const [receipts]=await c.execute('SELECT body FROM storeSettings WHERE name=?',[receiptKey]);
    if(receipts.length) { const saved=json(receipts[0].body); if(saved.actorId!==actorId || saved.inputHash!==inputHash) throw Error('Identificador de lote reutilizado con otros datos'); return saved.result; }
    const state=await catalogState(c,true), plan=planCatalog(rows,state.products,state.categories,state.evidence);
    if(plan.errors.length) throw Error(plan.errors.map(e=>`Fila ${e.row}: ${e.message}`).join('; '));
    if(plan.token!==token) throw Error('El catálogo cambió desde la vista previa. Revisa el lote nuevamente.');
    const ids=[];
    for(const item of plan.plans) {
      let id=item.id;
      const data={...item.data};
      for(const key of ['features','specs']) if(data[key]!==undefined) data[key]=JSON.stringify(data[key]);
      if(id) {
        const keys=Object.keys(data);
        if(keys.length) await c.execute(`UPDATE products SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=?`,[...keys.map(k=>data[k]),id]);
      } else {
        const values={description:'',features:'[]',specs:'{}',rating:'0.0',featured:'no',...data},keys=Object.keys(values);
        const [result]=await c.execute(`INSERT INTO products (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,keys.map(k=>values[k])); id=Number(result.insertId);
      }
      const contentChanged=['model','imageUrl','description','features','specs','name'].some(k=>item.changes.includes(k));
      const source=item.evidence ? {...item.evidence,reviewedBy:item.evidence.status==='reviewed'?actorId:null,reviewedAt:item.evidence.status==='reviewed'?new Date().toISOString():null,model:item.model,imageUrl:data.imageUrl??item.before?.imageUrl} : item.previousEvidence && contentChanged ? {...item.previousEvidence,status:'pending',reviewedBy:null,reviewedAt:null} : null;
      if(source) await c.execute('INSERT INTO storeSettings (name,body) VALUES (?,?) ON DUPLICATE KEY UPDATE body=VALUES(body)',[`productSource:${id}`,JSON.stringify(source)]);
      if(data.stock!==undefined) await c.execute('INSERT INTO inventoryOutbox (productId,stock) VALUES (?,?)',[id,data.stock]);
      await audit(c,actorId,'catalog.batch.'+item.action,id,{requestId,before:item.before,after:data,evidence:source});ids.push(id);
    }
    const result={success:true,ids,created:plan.creates,updated:plan.updates};
    await c.execute('INSERT INTO storeSettings (name,body) VALUES (?,?)',[receiptKey,JSON.stringify({actorId,inputHash,result})]);
    return result;
  });
}
