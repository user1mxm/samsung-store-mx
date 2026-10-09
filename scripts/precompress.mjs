import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory()){if(entry.name!=='.vite')await walk(path);continue;}
  if(!/\.(js|css|html|svg)$/.test(path))continue;
  const source=await readFile(path);
  await writeFile(path+'.br',brotliCompressSync(source,{params:{[constants.BROTLI_PARAM_QUALITY]:9}}));
  await writeFile(path+'.gz',gzipSync(source,{level:9}));
}}
await walk('dist/public');
console.log('Static Brotli and gzip variants prepared');
