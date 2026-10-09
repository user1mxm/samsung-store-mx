import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root=resolve('public'),output=resolve(root,'media'),manifest={};
await mkdir(output,{recursive:true});
async function walk(dir) {
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    if(entry.isSymbolicLink())continue;
    const file=resolve(dir,entry.name);
    if(entry.isDirectory()){if(!['media','viewer','.git'].includes(entry.name))await walk(file);continue;}
    if(!/\.(jpe?g|png|webp)$/i.test(extname(file))||/logo|icon|favicon/i.test(entry.name))continue;
    const bytes=await readFile(file);
    if(bytes.length<48000)continue;
    try {
      const image=sharp(bytes,{limitInputPixels:25000000,animated:false}).rotate();
      const info=await image.metadata();
      if(!info.width||!info.height)continue;
      const hash=createHash('sha256').update(bytes).digest('hex').slice(0,16),variants=[];
      for(const width of [480,960]) {
        const encoded=await image.clone().resize({width,withoutEnlargement:true}).webp({quality:80,effort:4}).toBuffer({resolveWithObject:true});
        const name=`${hash}-${width}.webp`;
        await writeFile(resolve(output,name),encoded.data);
        variants.push({src:`/media/${name}`,width:encoded.info.width});
      }
      manifest['/'+relative(root,file).split('\\').join('/')]=variants;
    } catch { /* Unsupported images keep their original source. */ }
  }
}
await walk(root);
await mkdir('src/generated',{recursive:true});
await writeFile('src/generated/image-manifest.json',JSON.stringify(manifest));
console.log(`Responsive WebP variants prepared for ${Object.keys(manifest).length} public images`);
