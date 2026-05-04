import nodemailer from "nodemailer";
import { env } from "./env";

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
