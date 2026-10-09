// @ts-nocheck
import { randomUUID,timingSafeEqual } from 'node:crypto';
import { mkdir,writeFile,readFile,unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getRequestUser } from '../upload';
import { getOrderPool } from '../queries/connection';
import { transaction,digest,json } from './core.mjs';
import { insertReservedOrder,validateItems } from '../orders-service.mjs';
const privateDir=()=>process.env.SUPPORT_PRIVATE_DIR || path.resolve(process.cwd(),'../samsung-private-support');
export function registerCommerceHttp(app) {
  app.post('/api/support/file',async c=>{
    const user=await getRequestUser(c.req.raw.headers);if(!user)return c.json({error:'Inicia sesión'},401);
    const form=await c.req.formData(); const file=form.get('file');
    if(!file || typeof file.arrayBuffer!=='function' || file.size>5*1024*1024)return c.json({error:'Imagen hasta 5 MB'},400);
    let data;try{const buffer=Buffer.from(await file.arrayBuffer());const meta=await sharp(buffer,{limitInputPixels:16000000}).metadata();if(!['jpeg','png','webp'].includes(meta.format))throw new Error();data=await sharp(buffer,{limitInputPixels:16000000}).resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).webp().toBuffer();}catch{return c.json({error:'Imagen inválida'},400);}
    const id=randomUUID();await mkdir(privateDir(),{recursive:true,mode:0o700});const target=path.join(privateDir(),id+'.webp');await writeFile(target,data,{mode:0o600,flag:'wx'});
    try{await getOrderPool().execute('INSERT INTO supportFiles (id,userId,extension) VALUES (?,?,?)',[id,user.id,'webp']);}catch(e){await unlink(target);throw e;}
    return c.json({id});
  });
  app.get('/api/support/file/:id',async c=>{
    const user=await getRequestUser(c.req.raw.headers);if(!user)return c.json({error:'Inicia sesión'},401);const id=c.req.param('id');if(!/^[a-f0-9-]{36}$/.test(id))return c.notFound();
    const [rows]=await getOrderPool().execute('SELECT f.*,s.userId AS caseOwner FROM supportFiles f LEFT JOIN supportCases s ON s.id=f.caseId WHERE f.id=?',[id]);const f=rows[0];if(!f || (user.role!=='admin'&&Number(f.userId)!==user.id&&Number(f.caseOwner)!==user.id))return c.notFound();
    c.header('Cache-Control','private, no-store');c.header('Content-Type','image/webp');c.header('X-Content-Type-Options','nosniff');return c.body(await readFile(path.join(privateDir(),id+'.webp')));
  });
  async function channel(c){const token=c.req.header('Authorization')?.replace(/^Bearer /,'')||'';if(!/^[a-f0-9]{64}$/.test(token))return null;const [rows]=await getOrderPool().execute('SELECT id,secretHash,userId FROM inventoryChannels WHERE id=? AND enabled=1',[c.req.param('id')]);const row=rows[0];return row&&timingSafeEqual(Buffer.from(row.secretHash,'hex'),Buffer.from(digest(token),'hex'))?row:null;}
  app.get('/api/inventory/:id',async c=>{if(!await channel(c))return c.json({error:'Unauthorized'},401);const [products]=await getOrderPool().execute('SELECT id,model,stock,price FROM products ORDER BY id');c.header('Cache-Control','no-store');return c.json({products,asOf:new Date().toISOString()});});
  app.post('/api/inventory/:id/sale',async c=>{
    const ch=await channel(c);if(!ch)return c.json({error:'Unauthorized'},401);const input=await c.req.json();
    if(!/^[a-zA-Z0-9_.:-]{1,100}$/.test(input.eventId||''))return c.json({error:'Invalid event'},400);
    let items;try{items=validateItems(input.items);}catch{return c.json({error:'Invalid items'},400);}
    const hash=digest(JSON.stringify(items));
    try{const result=await transaction(getOrderPool(),async conn=>{
      // Lock channel before event/stock to serialize retries and account disablement.
      const [channels]=await conn.execute('SELECT enabled FROM inventoryChannels WHERE id=? FOR UPDATE',[ch.id]);if(!channels[0]?.enabled)throw new Error('Canal desactivado');
      const [events]=await conn.execute('SELECT * FROM inventoryEvents WHERE channelId=? AND eventId=?',[ch.id,input.eventId]);if(events[0]){if(events[0].inputHash!==hash)throw new Error('Evento modificado');return {orderId:Number(events[0].orderId),duplicate:true};}
      // External channels reserve stock; they do not assert web payment or mint rewards.
      const order=await insertReservedOrder(conn,Number(ch.userId),{items,shippingAddress:{channel:ch.id,externalReference:input.eventId}});
      await conn.execute('INSERT INTO inventoryEvents (channelId,eventId,inputHash,orderId) VALUES (?,?,?,?)',[ch.id,input.eventId,hash,order.orderId]);return {orderId:order.orderId,duplicate:false};
    });return c.json(result);}catch{return c.json({error:'No se reservó la venta; revisa existencias o evento'},409);}
  });
}
