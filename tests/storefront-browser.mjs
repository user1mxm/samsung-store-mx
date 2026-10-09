// Real compiled frontend/renderer; catalogue/auth replies are isolated fixtures.
// No production accounts, inventory, uploads or payment providers are contacted.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');
const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
const origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['dist/boot.js'],{env:{...process.env,NODE_ENV:'production',BIND_HOST:'127.0.0.1',PORT:String(port),APP_ID:'browser-fixture',APP_SECRET:'fixture-only',KIMI_AUTH_URL:'https://example.invalid',KIMI_OPEN_URL:'https://example.invalid',DATABASE_URL:'mysql://test:test@127.0.0.1:1/test',PAYMENTS_ENABLED:'0'},stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
let browser;
const products=[
  {id:1,name:'Samsung Crystal UHD DU8000 75" 2024',model:'UN75DU8000',category:'crystal',price:'13400.00',stock:1,rating:'4.6',featured:'no',imageUrl:'/tv-s95d-real.jpg',description:'Pieza de exhibición.',specs:'{"Panel":"Crystal UHD","Tamaño":"75 pulgadas"}'},
  {id:2,name:'Samsung S90D OLED 77" 2024',model:'QN77S90D',category:'oled',price:'29000.00',stock:1,rating:'4.8',featured:'yes',imageUrl:'/tv-frame-real.jpg',description:'Pantalla OLED.',specs:'{}'},
];
try {
  for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(output);try{if((await fetch(origin)).ok)break}catch{}await delay(100)}
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath(),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740}]){
    const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await context.newPage();const errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>requests.push(r.url()));
    await page.route('**/api/trpc/**',route=>{
      const url=new URL(route.request().url());
      const names=decodeURIComponent(url.pathname.split('/api/trpc/')[1]).split(',');
      const responses=names.map(name=>({result:{data:{json:name==='localAuth.me'?null:name==='product.list'?products:name==='product.categories'?[{id:1,slug:'crystal',name:'Crystal UHD'},{id:2,slug:'oled',name:'OLED'}]:[]}}}));
      return route.fulfill({contentType:'application/json',body:JSON.stringify(url.searchParams.has('batch')?responses:responses[0])});
    });
    await page.goto(origin);await page.getByRole('heading',{name:/El detalle/}).waitFor();
    await page.getByRole('heading',{name:products[0].name,exact:true}).first().waitFor();
    await page.getByRole('combobox',{name:'Seleccionar modelo'}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${viewport.width}`);
    assert.equal(await page.locator('#hero-title').evaluate(el=>el.scrollWidth>el.clientWidth),false,'Hero text is clipped');
    assert.ok(!requests.some(u=>/TVScene-|AdminDashboard-|AreaChart-/.test(u)),'Heavy viewer/admin chunks were downloaded before use');
    await page.getByRole('button',{name:'Explorar en 360°',exact:true}).click();
    await page.locator('.tv-stage canvas').waitFor();
    await page.locator('.tv-scene-fallback').waitFor({state:'detached',timeout:20000});
    const canvas=await page.locator('.tv-stage canvas').boundingBox();
    assert.ok(canvas.width<=viewport.width&&canvas.height>=250,`Responsive canvas dimensions invalid at ${viewport.width}: ${JSON.stringify(canvas)}`);
    await page.getByRole('button',{name:'Trasero',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Trasero',exact:true}).getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:'Acercar',exact:true}).click();
    await page.getByRole('button',{name:'Noche',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Noche',exact:true}).getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:'Perla',exact:true}).click();
    await page.getByRole('button',{name:'3/4',exact:true}).click();
    if(process.env.STOREFRONT_SCREENSHOTS){
      await mkdir(process.env.STOREFRONT_SCREENSHOTS,{recursive:true});
      await page.getByRole('button',{name:'Acercar',exact:true}).press('Control+Home');
      await page.locator('.model-swipe').screenshot({path:`${process.env.STOREFRONT_SCREENSHOTS}/catalog-swipe-${viewport.width}.png`});
      await page.getByRole('button',{name:'Acercar',exact:true}).press('Control+Home');
      await page.screenshot({path:`${process.env.STOREFRONT_SCREENSHOTS}/samsung-premium-${viewport.width}.png`,fullPage:viewport.width<640});
    }
    await page.getByRole('button',{name:'Modelo siguiente',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('select[aria-label="Seleccionar modelo"]').value==='2');
    await page.getByRole('combobox',{name:'Seleccionar modelo'}).selectOption('1');
    await page.getByRole('button',{name:'Detalles',exact:true}).click();
    await page.locator('.model-description').getByText('Pieza de exhibición.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Imagen',exact:true}).click();
    await page.locator('.model-swipe-track').evaluate(el=>el.scrollTo({left:el.clientWidth,behavior:'instant'}));
    await page.waitForFunction(()=>document.querySelector('select[aria-label="Seleccionar modelo"]').value==='2');
    await page.getByRole('textbox',{name:'Buscar productos',exact:true}).fill('UN75DU8000');
    await page.getByRole('button',{name:'Agregar al Carrito',exact:true}).click();
    await page.getByRole('button',{name:'Agregar al Carrito',exact:true}).click();
    await page.getByRole('button',{name:'Carrito: 1 unidades',exact:true}).click();
    await page.getByRole('dialog',{name:'Tu Carrito'}).waitFor();
    assert.ok((await page.getByRole('dialog').innerText()).includes('$13,400 MXN'));
    await page.getByRole('button',{name:'Ver resumen',exact:true}).click();
    await page.getByText('El pago en línea todavía no está disponible.',{exact:false}).waitFor();
    await page.keyboard.press('Escape');
    await page.goto(origin);
    await page.getByRole('button',{name:'Panel Admin',exact:true}).click();
    await page.waitForURL('**/login/admin');
    await page.getByRole('button',{name:'Ingresar al panel'}).waitFor();
    assert.equal(errors.length,0,errors.join('\n'));
    console.log(`Compiled storefront passed at ${viewport.width}px: layout, deferred 3D, WebGL, camera, lights, model search, stock cap, subtotal, disabled checkout`);
    await context.close();
  }
  // A device without WebGL still has a usable, honest product preview.
  const fallbackContext=await browser.newContext({viewport:{width:390,height:844}});
  const fallback=await fallbackContext.newPage();
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args)}});
  await fallback.goto(origin);
  await fallback.getByRole('button',{name:'Explorar en 360°',exact:true}).click();
  await fallback.getByRole('button',{name:'Reintentar 3D',exact:true}).waitFor();
  console.log('WebGL unavailable fallback passed');await fallbackContext.close();
} finally {
  await browser?.close();
  if(server.exitCode===null){const exited=once(server,'exit');server.kill('SIGTERM');await exited;}
}
