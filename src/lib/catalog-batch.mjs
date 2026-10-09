export const COLUMNS=['id','model','name','category','price','stock','imageUrl','description','features','specs','featured','sourceUrl','sourceModel','imageSourceUrl','sourceStatus','sourceNotes'];

export function parseCsv(text) {
  text=text.replace(/^\uFEFF/,'');
  if(text.length>2_000_000) throw Error('El archivo supera 2 MB');
  const rows=[];let row=[],field='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++) {
    const char=text[i];
    if(quoted) {if(char==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=char;continue;}
    if(char==='"'){if(field||closed)throw Error('Comillas CSV inválidas');quoted=true;continue;}
    if(char===','||char==='\n'||char==='\r') {
      row.push(field);field='';closed=false;
      if(char!==','){if(row.some(x=>x!==''))rows.push(row);row=[];if(char==='\r'&&text[i+1]==='\n')i++;}
    } else {if(closed)throw Error('Texto fuera de comillas CSV');field+=char;}
  }
  if(quoted)throw Error('Faltan comillas de cierre');
  row.push(field);if(row.some(x=>x!==''))rows.push(row);
  const header=rows.shift()?.map(v=>v.trim());
  if(!header?.length||new Set(header).size!==header.length||header.some(h=>!COLUMNS.includes(h)))throw Error('Encabezados inválidos. Usa la plantilla descargable.');
  if(rows.length>100)throw Error('Máximo 100 productos por lote');
  return rows.map((cells,i)=>{if(cells.length!==header.length)throw Error(`Fila ${i+2}: número de columnas incorrecto`);return Object.fromEntries(header.map((h,j)=>[h,cells[j]]));});
}
export function decodeRows(text) {
  text=text.replace(/^\uFEFF/,'');
  if(text.length>2_000_000) throw Error('El archivo supera 2 MB');
  const data=text.trim().startsWith('[')?JSON.parse(text):parseCsv(text);
  if(!Array.isArray(data)||!data.length||data.length>100)throw Error('El lote debe tener entre 1 y 100 filas');
  return data.map((row,i)=>{
    if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(k=>!COLUMNS.includes(k)))throw Error(`Fila ${i+1}: campos desconocidos`);
    return Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):String(v??'')]));
  });
}
export function toApiRows(rows) {
  return rows.map((row,index)=>{
    const output={data:{}};
    if(row.id?.trim()){output.id=Number(row.id);if(!Number.isSafeInteger(output.id)||output.id<1)throw Error(`Fila ${index+1}: ID inválido`);}
    for(const [key,value] of Object.entries(row)) {
      if(['id','sourceUrl','sourceModel','imageSourceUrl','sourceStatus','sourceNotes'].includes(key)||String(value).trim()==='')continue;
      if(!COLUMNS.includes(key))throw Error(`Campo desconocido: ${key}`);
      output.data[key]=key==='stock'?Number(value):['features','specs'].includes(key)?JSON.parse(value):value;
    }
    if(row.sourceUrl||row.sourceModel||row.imageSourceUrl||row.sourceStatus){output.evidence={sourceUrl:row.sourceUrl||'',sourceModel:row.sourceModel||'',imageSourceUrl:row.imageSourceUrl||'',status:row.sourceStatus||'pending',notes:row.sourceNotes||''};}
    return output;
  });
}
export function encodeCsv(rows) {
  const escape=value=>{
    let s=String(value??'');
    // Spreadsheet formula protection. Removing the apostrophe requires explicit editing.
    if(/^[\s]*[=+@-]/.test(s))s="'"+s;
    return '"'+s.replaceAll('"','""')+'"';
  };
  return '\uFEFF'+[COLUMNS.join(','),...rows.map(r=>COLUMNS.map(k=>escape(r[k])).join(','))].join('\r\n');
}
export function exportRows(products,evidence={}) {
  return products.map(p=>{const e=evidence[p.id];return Object.fromEntries(COLUMNS.map(k=>[k,k==='sourceUrl'?e?.sourceUrl??'':k==='sourceModel'?e?.sourceModel??'':k==='imageSourceUrl'?e?.imageSourceUrl??'':k==='sourceStatus'?e?.status??'':k==='sourceNotes'?e?.notes??'':p[k]==null?'':typeof p[k]==='object'?JSON.stringify(p[k]):String(p[k])]));});
}
export function photoMatches(files,rows) {
  const matches=[],errors=[],seen=new Set();
  for(const file of files){const model=file.name.replace(/\.[^.]+$/,'').toUpperCase();const candidates=rows.map((r,i)=>({r,i})).filter(({r})=>r.model?.trim().toUpperCase()===model);
    if(candidates.length!==1||seen.has(model)){errors.push(`${file.name}: se requiere un único modelo exacto en el lote y una sola foto por modelo`);continue;}
    seen.add(model);matches.push({file,index:candidates[0].i});
  }
  return {matches,errors};
}
