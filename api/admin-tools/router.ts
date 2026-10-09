// @ts-nocheck
import { z } from 'zod';
import { createRouter,adminQuery,authedQuery } from '../middleware';
import { getOrderPool } from '../queries/connection';
import { catalogRows,catalogState,previewCatalog,applyCatalog } from './catalog.mjs';
import { rateChange,listRates,saveRate } from './rates.mjs';
const pool=()=>getOrderPool();
export const adminToolsRouter=createRouter({
  myAgentRate:authedQuery.query(async({ctx})=>{const [rows]=await pool().execute('SELECT body FROM storeSettings WHERE name=?',[`agentRate:${ctx.user.id}`]);const saved=rows[0]?(typeof rows[0].body==='string'?JSON.parse(rows[0].body):rows[0].body):null;return {rate:saved?.rate??null,automaticSettlement:false};}),
  catalog:adminQuery.query(()=>catalogState(pool())),
  preview:adminQuery.input(z.object({rows:catalogRows})).mutation(({input})=>previewCatalog(pool(),input.rows)),
  applyBatch:adminQuery.input(z.object({rows:catalogRows,token:z.string().regex(/^[a-f0-9]{64}$/),requestId:z.string().uuid()})).mutation(({ctx,input})=>applyCatalog(pool(),ctx.user.id,input.rows,input.token,input.requestId)),
  rates:adminQuery.query(()=>listRates(pool())),
  saveRate:adminQuery.input(rateChange).mutation(({ctx,input})=>saveRate(pool(),ctx.user.id,input)),
});
