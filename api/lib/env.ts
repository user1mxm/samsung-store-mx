import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  appId:       required("APP_ID"),
  appSecret:   required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: optional("KIMI_AUTH_URL"),
  kimiOpenUrl: optional("KIMI_OPEN_URL"),
  ownerUnionId: optional("OWNER_UNION_ID"),

  // OAuth social
  googleClientId:       optional("GOOGLE_CLIENT_ID"),
  googleClientSecret:   optional("GOOGLE_CLIENT_SECRET"),
  facebookClientId:     optional("FACEBOOK_CLIENT_ID"),
  facebookClientSecret: optional("FACEBOOK_CLIENT_SECRET"),
  twitterClientId:      optional("TWITTER_CLIENT_ID"),
  twitterClientSecret:  optional("TWITTER_CLIENT_SECRET"),

  // SMTP para notificaciones
  smtpHost:     optional("SMTP_HOST", "smtp.gmail.com"),
  smtpPort:     parseInt(optional("SMTP_PORT", "587")),
  smtpUser:     optional("SMTP_USER"),
  smtpPassword: optional("SMTP_PASSWORD"),
  smtpFrom:     optional("SMTP_FROM", "Samsung Store MX <no-reply@samsungstore.com.mx>"),
  adminEmail:   optional("ADMIN_EMAIL", "admin@samsungstore.com.mx"),
};
