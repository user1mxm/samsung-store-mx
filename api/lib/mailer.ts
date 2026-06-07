// Samsung Store MX — Mailer
// Usa nodemailer si está disponible, si no usa fetch a SMTP
import { env } from "./env";

interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

async function sendMail(opts: MailOptions): Promise<void> {
  if (!env.smtpUser || !env.smtpPassword) {
    console.log(`[mailer] SMTP no configurado — email que se habría enviado a ${Array.isArray(opts.to)?opts.to.join(","):opts.to}: ${opts.subject}`);
    return;
  }
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.default.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPassword },
    });
    await transport.sendMail({
      from: env.smtpFrom,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? opts.subject,
    });
    console.log(`[mailer] ✓ enviado a ${Array.isArray(opts.to)?opts.to.join(","):opts.to}`);
  } catch (err: any) {
    console.error("[mailer] Error:", err.message);
  }
}

/* ─── Templates ─────────────────────────────────────────────── */

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;color:#1a1a1a}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1428A0,#0077C8);padding:32px;text-align:center}
  .header img{width:48px;height:48px;margin-bottom:12px}
  .header h1{color:#fff;font-size:22px;font-weight:900;letter-spacing:.5px}
  .header p{color:rgba(255,255,255,.7);font-size:12px;margin-top:4px}
  .body{padding:32px}
  .body h2{font-size:18px;font-weight:800;margin-bottom:8px;color:#1428A0}
  .body p{font-size:14px;line-height:1.6;color:#555;margin-bottom:16px}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
  .badge-blue{background:#E8EEFF;color:#1428A0}
  .badge-green{background:#E6F4EA;color:#1B8A48}
  .badge-orange{background:#FFF3E0;color:#E65100}
  .code{background:#f8f9ff;border:2px solid #E8EEFF;border-radius:12px;padding:16px;text-align:center;margin:20px 0}
  .code span{font-size:28px;font-weight:900;letter-spacing:4px;color:#1428A0}
  .btn{display:inline-block;padding:12px 28px;background:#1428A0;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-top:8px}
  .divider{border:none;border-top:1px solid #f0f0f0;margin:24px 0}
  .footer{background:#f8f9ff;padding:20px 32px;text-align:center;font-size:11px;color:#999}
  .row{display:flex;gap:12px;margin-bottom:12px}
  .cell{flex:1;background:#f8f9ff;border-radius:10px;padding:12px;text-align:center}
  .cell .val{font-size:18px;font-weight:900;color:#1428A0}
  .cell .lbl{font-size:10px;color:#999;margin-top:2px}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div style="width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
      <span style="font-size:24px;font-weight:900;color:#fff">S</span>
    </div>
    <h1>Samsung Store MX</h1>
    <p>Distribuidor Autorizado Samsung en México</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    © 2026 Samsung Store MX · samsungstore.com.mx<br>
    Si no solicitaste esto, ignora este mensaje.
  </div>
</div>
</body>
</html>`;
}

/* Bienvenida a nuevo cliente */
export async function sendWelcomeClient(to: string, name: string): Promise<void> {
  const html = baseTemplate("¡Bienvenido!", `
    <h2>¡Hola, ${name}! 👋</h2>
    <p>Tu cuenta en <strong>Samsung Store MX</strong> ha sido creada exitosamente. Ya puedes explorar nuestro catálogo de televisores Samsung y hacer tu primer pedido.</p>
    <div class="row">
      <div class="cell"><div class="val">8%</div><div class="lbl">Comisión al referir</div></div>
      <div class="cell"><div class="val">4K</div><div class="lbl">Productos premium</div></div>
      <div class="cell"><div class="val">MX</div><div class="lbl">Envío en México</div></div>
    </div>
    <a href="https://samsungstore.com.mx" class="btn">Explorar catálogo →</a>
    <hr class="divider">
    <p style="font-size:12px;color:#999">Si tienes dudas, contáctanos en <strong>admin@samsungstore.com.mx</strong></p>
  `);
  await sendMail({ to, subject: `¡Bienvenido a Samsung Store MX, ${name}!`, html });
}

/* Bienvenida a nuevo agente */
export async function sendWelcomeAgent(to: string, name: string, referralCode: string): Promise<void> {
  const refUrl = `https://samsungstore.com.mx/login?ref=${referralCode}`;
  const html = baseTemplate("¡Bienvenido Agente!", `
    <span class="badge badge-blue">✦ AGENTE DE VENTAS</span>
    <h2 style="margin-top:12px">¡Bienvenido al equipo, ${name}! 🎉</h2>
    <p>Tu registro como <strong>Agente de Ventas Samsung Store MX</strong> fue aprobado. Ahora puedes ganar comisiones por cada venta en tu red.</p>
    <p><strong>Tu código de referido personal:</strong></p>
    <div class="code"><span>${referralCode}</span></div>
    <p style="font-size:12px;color:#999;text-align:center">Comparte tu link personal:</p>
    <p style="font-size:12px;color:#1428A0;text-align:center;word-break:break-all">${refUrl}</p>
    <hr class="divider">
    <div class="row">
      <div class="cell"><div class="val">8%</div><div class="lbl">Comisión N1</div></div>
      <div class="cell"><div class="val">4%</div><div class="lbl">Comisión N2</div></div>
      <div class="cell"><div class="val">40</div><div class="lbl">Sub-agentes máx</div></div>
    </div>
    <a href="https://samsungstore.com.mx/agent" class="btn">Ir a mi portal →</a>
  `);
  await sendMail({ to, subject: `¡Bienvenido Agente Samsung Store MX, ${name}!`, html });
}

/* Notificación al admin de nuevo usuario */
export async function notifyAdminNewUser(params: {
  name: string; email: string; role: string; provider: string;
}): Promise<void> {
  const roleBadge = params.role === "agent"
    ? `<span class="badge badge-blue">AGENTE</span>`
    : `<span class="badge badge-green">CLIENTE</span>`;
  const html = baseTemplate("Nuevo Registro", `
    <h2>Nuevo registro en la plataforma</h2>
    <p>Un nuevo usuario se ha dado de alta en Samsung Store MX:</p>
    <div style="background:#f8f9ff;border-radius:12px;padding:16px;margin:16px 0">
      <p><strong>Nombre:</strong> ${params.name}</p>
      <p><strong>Email:</strong> ${params.email}</p>
      <p><strong>Tipo:</strong> ${roleBadge}</p>
      <p><strong>Método de registro:</strong> ${params.provider}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-MX",{timeZone:"America/Mexico_City"})}</p>
    </div>
    <a href="https://samsungstore.com.mx/admin" class="btn">Ver panel admin →</a>
  `);
  await sendMail({ to: env.adminEmail, subject: `Nuevo ${params.role==="agent"?"agente":"usuario"}: ${params.name}`, html });
}
