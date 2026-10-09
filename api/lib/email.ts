import nodemailer from "nodemailer";
import { env } from "./env";

function smtpConfigured() {
  return !!(env.smtpHost && env.smtpUser && env.smtpPass);
}

function createTransport() {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

const SHELL = (inner: string) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #eef0f4;">
    <div style="background: linear-gradient(135deg, #1428A0 0%, #0077C8 100%); padding: 28px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px; letter-spacing: 2px; font-weight: 800;">SAMSUNG STORE MX</h1>
      <p style="color: rgba(255,255,255,.75); margin: 4px 0 0; font-size: 11px; letter-spacing: 3px;">PREMIUM STORE</p>
    </div>
    <div style="padding: 32px;">${inner}</div>
    <div style="padding: 18px 32px; background: #f8f9fb; color: #9aa0ab; font-size: 11px; border-top: 1px solid #eef0f4;">
      Samsung Store MX · Este es un mensaje automático, no respondas a este correo.
    </div>
  </div>`;

export async function sendTempPasswordEmail(to: string, name: string, tempPassword: string) {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Samsung Store MX" <${env.smtpFrom}>`,
    to,
    subject: "Tu contraseña temporal - Samsung Store MX",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1428A0; margin: 0; font-size: 24px;">SAMSUNG STORE MX</h1>
        </div>
        <h2 style="color: #212529; font-size: 18px;">Hola, ${name}!</h2>
        <p style="color: #495057; line-height: 1.6;">Tu cuenta ha sido creada exitosamente. Usa la siguiente contraseña temporal para iniciar sesión:</p>
        <div style="background: #1428A0; color: #fff; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 20px; border-radius: 8px; margin: 24px 0;">
          ${tempPassword}
        </div>
        <p style="color: #495057; line-height: 1.6;">Por seguridad, deberás cambiar esta contraseña la primera vez que inicies sesión.</p>
        <p style="color: #6c757d; font-size: 12px; margin-top: 32px; border-top: 1px solid #dee2e6; padding-top: 16px;">
          Si no creaste esta cuenta, ignora este mensaje.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string, baseUrl: string) {
  const transporter = createTransport();
  const resetUrl = `${baseUrl}/change-password?token=${resetToken}`;
  await transporter.sendMail({
    from: `"Samsung Store MX" <${env.smtpFrom}>`,
    to,
    subject: "Restablecer contraseña - Samsung Store MX",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1428A0; margin: 0; font-size: 24px;">SAMSUNG STORE MX</h1>
        </div>
        <h2 style="color: #212529; font-size: 18px;">Hola, ${name}!</h2>
        <p style="color: #495057; line-height: 1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background: #1428A0; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color: #6c757d; font-size: 13px;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
      </div>
    `,
  });
}

/** Welcome email sent to the user right after they register. */
export async function sendWelcomeEmail(to: string, name: string) {
  if (!smtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping welcome email");
    return;
  }
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Samsung Store MX" <${env.smtpFrom}>`,
    to,
    subject: "¡Bienvenido a Samsung Store MX! 🎉",
    html: SHELL(`
      <h2 style="color:#1a1f2e;font-size:20px;margin:0 0 12px;">¡Hola, ${name}!</h2>
      <p style="color:#525866;line-height:1.6;margin:0 0 16px;">
        Tu cuenta ha sido creada con éxito. Ya puedes explorar el catálogo de los TVs Samsung más recientes,
        seguir tus pedidos y acceder a beneficios exclusivos.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${env.publicBaseUrl}" style="background:#1428A0;color:#fff;text-decoration:none;padding:14px 34px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
          Explorar la tienda
        </a>
      </div>
      <p style="color:#9aa0ab;font-size:12px;margin:0;">Si tú no creaste esta cuenta, ignora este mensaje.</p>
    `),
  });
}

/** Notify the administrator that a brand-new user just registered. */
export async function sendAdminNewUserEmail(user: {
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  provider: string;
}) {
  if (!smtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping admin notification");
    return;
  }
  const transporter = createTransport();
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;color:#9aa0ab;font-size:12px;width:120px;">${label}</td>
      <td style="padding:8px 0;color:#1a1f2e;font-size:13px;font-weight:600;">${value}</td>
    </tr>`;
  await transporter.sendMail({
    from: `"Samsung Store MX" <${env.smtpFrom}>`,
    to: env.adminNotifyEmail,
    subject: `🔔 Nuevo usuario registrado: ${user.name}`,
    html: SHELL(`
      <h2 style="color:#1a1f2e;font-size:18px;margin:0 0 8px;">Nuevo registro en la plataforma</h2>
      <p style="color:#525866;line-height:1.6;margin:0 0 18px;">Se ha registrado un nuevo usuario con los siguientes datos:</p>
      <table style="width:100%;border-collapse:collapse;background:#f8f9fb;border-radius:10px;padding:8px 16px;">
        ${row("Nombre", user.name)}
        ${row("Correo", user.email || "—")}
        ${row("Teléfono", user.phone || "—")}
        ${row("Rol", user.role)}
        ${row("Método", user.provider)}
        ${row("Fecha", new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" }))}
      </table>
      <div style="text-align:center;margin:24px 0 4px;">
        <a href="${env.publicBaseUrl}/admin" style="background:#1428A0;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:13px;display:inline-block;">
          Ver en el panel
        </a>
      </div>
    `),
  });
}

/** Fire-and-forget helper: never throws, just logs on failure. */
export async function notifyAdminNewUser(user: {
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  provider: string;
}) {
  try {
    await sendAdminNewUserEmail(user);
  } catch (err) {
    console.error("[email] Failed to send admin new-user notification:", err);
  }
}

/** OTP code delivered by email as a fallback when SMS is not configured. */
export async function sendOtpEmail(to: string, code: string) {
  if (!smtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping OTP email");
    return;
  }
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Samsung Store MX" <${env.smtpFrom}>`,
    to,
    subject: `${code} es tu código de verificación`,
    html: SHELL(`
      <h2 style="color:#1a1f2e;font-size:18px;margin:0 0 12px;">Tu código de verificación</h2>
      <div style="background:#1428A0;color:#fff;font-size:30px;font-weight:800;letter-spacing:10px;text-align:center;padding:20px;border-radius:12px;margin:18px 0;">${code}</div>
      <p style="color:#9aa0ab;font-size:12px;margin:0;">Expira en 10 minutos. No lo compartas con nadie.</p>
    `),
  });
}
