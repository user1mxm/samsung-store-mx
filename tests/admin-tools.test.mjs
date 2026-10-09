import test from 'node:test';
import assert from 'node:assert/strict';
import { planCatalog,safeUrl,catalogRows } from '../api/admin-tools/catalog.mjs';
import { commissionEstimate,rateValue } from '../api/admin-tools/rates.mjs';
import { parseCsv,toApiRows,encodeCsv,decodeRows,photoMatches } from '../src/lib/catalog-batch.mjs';
const product={id:1,model:'QN65S95DAFXZX',name:'TV',category:'oled',price:'1000.00',stock:3,imageUrl:'/uploads/tv.webp'};
test('batch rejects unknown IDs, ambiguous duplicates, invalid categories and mismatched source models',()=>{
  assert.equal(planCatalog([{id:9,data:{price:'12'}}],[product],['oled']).errors.length,1);
  assert.throws(()=>planCatalog([{data:{...product,id:undefined}}],[product],['oled']));
});
test('batch preview preserves omitted fields and fingerprints concurrent inventory changes',()=>{
  const rows=[{id:1,data:{price:'1200'}}],p=planCatalog(rows,[product],['oled']);
  assert.deepEqual(p.plans[0].changes,['price']);assert.equal(p.plans[0].before.stock,3);
  assert.notEqual(p.token,planCatalog(rows,[{...product,stock:2}],['oled']).token);
  assert.equal(planCatalog([{id:1,data:{category:'missing'}}],[product],['oled']).errors.length,1);
  assert.equal(planCatalog([{data:{...product,id:undefined}}].map(({data:{id,...data}})=>({data})),[product],['oled']).errors.length,1);
  assert.equal(planCatalog([rows[0],rows[0]],[product],['oled']).errors.length,1);
  const e={sourceUrl:'https://www.samsung.com/mx/test/',imageSourceUrl:'https://www.samsung.com/mx/test/',sourceModel:'DIFFERENT',status:'reviewed'};
  assert.equal(planCatalog([{id:1,data:{},evidence:e}],[product],['oled']).errors.length,1);
});
test('invalid stock, prices, URLs, excessive batches and unknown columns cannot reach SQL',()=>{
  for(const data of [{stock:-1},{stock:1.5},{price:'1,000'},{price:'-1'},{price:'Infinity'},{imageUrl:'javascript:alert(1)'},{imageUrl:'//evil.example/x'},{imageUrl:'/uploads/../secret'},{rating:'9.9'},{unknown:'x'}])assert.throws(()=>catalogRows.parse([{id:1,data}]));
  assert.throws(()=>catalogRows.parse(Array.from({length:101},()=>({id:1,data:{stock:0}}))));
  assert.equal(safeUrl('https://user:pass@example.com'),false);
});
test('CSV supports BOM, quoted commas and line breaks, rejects malformed input, protects spreadsheets',()=>{
  const row={id:'1',name:'TV, "OLED"\n65 pulgadas',stock:'0',model:'QN65S95DAFXZX'};
  const result=decodeRows(encodeCsv([row]));assert.equal(result[0].name,row.name);assert.equal(toApiRows(result)[0].data.stock,0);
  assert.throws(()=>parseCsv('id,id\n1,2'));assert.throws(()=>parseCsv('id,name\n1,"bad'));assert.throws(()=>parseCsv('id,name\n1,"bad"extra'));
  assert.throws(()=>decodeRows('[{"dangerous":true}]'));
  assert.match(encodeCsv([{name:'=HYPERLINK("evil")'}]),/'=HYPERLINK/);
  assert.deepEqual(toApiRows([{id:'1',price:'',stock:'0'}]),[{id:1,data:{stock:0}}]);
});
test('photos require one exact model and do not guess among duplicate units or regional variants',()=>{
  const f={name:'QN65S95DAFXZX.jpg'},rows=[{model:'QN65S95DAFXZX'}];
  assert.equal(photoMatches([f],rows).matches.length,1);
  assert.equal(photoMatches([f],[...rows,...rows]).errors.length,1);
  assert.equal(photoMatches([{name:'QN65S95DAFXZA.jpg'}],rows).errors.length,1);
});
test('commission percentage range and decimal rounding are explicit; zero is not a default fallback',()=>{
  assert.equal(commissionEstimate('1000',10),'100.00');assert.equal(commissionEstimate('1000',0),'0.00');assert.equal(commissionEstimate('0.10',5),'0.01');
  for(const n of [-1,25.01,Infinity,NaN,8.001])assert.throws(()=>rateValue.parse(n));
});


test('JSON import accepts UTF-8 BOM and enforces the same size limit as CSV',()=>{
  assert.deepEqual(toApiRows(decodeRows('\uFEFF[{"id":1,"stock":0}]')),[{id:1,data:{stock:0}}]);
  assert.throws(()=>decodeRows(JSON.stringify([{description:'x'.repeat(2_000_001)}])),/2 MB/);
});
