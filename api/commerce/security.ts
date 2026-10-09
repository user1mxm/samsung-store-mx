// @ts-nocheck
const attempts=new Map();
export function registerSecurity(app) {
  app.use('*',async(c,next)=>{
    c.header('X-Content-Type-Options','nosniff');c.header('Referrer-Policy','strict-origin-when-cross-origin');c.header('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
    await next();
    if(c.res.headers.get('Content-Type')?.includes('text/html')) {
      c.header('Content-Security-Policy-Report-Only',"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; worker-src 'self' blob:; frame-src https://checkout.stripe.com https://*.mercadopago.com.mx; report-uri /api/security/csp-report");
    }
  });
  app.use('/api/*',async(c,next)=>{
    const route=c.req.path;
    if(!['GET','HEAD','OPTIONS'].includes(c.req.method)&&c.req.header('Origin')){
      const origin=c.req.header('Origin');const allowed=new Set([new URL(c.req.url).origin,process.env.SITE_ORIGIN||process.env.PUBLIC_BASE_URL||'https://samsungstore.com.mx']);
      if(!allowed.has(origin))return c.json({error:'Origen no permitido'},403);
    }
    if(/localAuth\.(login|register|resetPassword)|passkey\.(login|register)|security\/csp-report/.test(route)) {
      // The listening server supplies the peer address; never trust client-supplied forwarding headers.
      const peer=c.env?.incoming?.socket?.remoteAddress||'unknown';const now=Date.now(),key=peer+':'+(route.includes('csp-report')?'report':'auth');
      for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);
      const state=attempts.get(key)||{until:now+60000,count:0};state.count++;attempts.set(key,state);
      if(state.count>30){c.header('Retry-After','60');return c.json({error:'Espera un minuto para intentar de nuevo'},429);}
    }
    await next();
  });
  app.post('/api/security/csp-report',async c=>{
    if(Number(c.req.header('Content-Length')||0)>8192)return c.body(null,413);
    const body=await c.req.text();if(body.length>8192)return c.body(null,413);
    try{const r=JSON.parse(body)['csp-report'];if(r){const directive=String(r['effective-directive']||'').slice(0,60);const blocked=String(r['blocked-uri']||'');let origin='inline';try{origin=new URL(blocked).origin;}catch{}console.warn('[CSP report]',JSON.stringify({directive,origin}));}}catch{}
    return c.body(null,204);
  });
}
