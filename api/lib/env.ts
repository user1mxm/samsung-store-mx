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
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: optional("OWNER_UNION_ID"),

  // Social OAuth – Google
  googleClientId: optional("GOOGLE_CLIENT_ID"),
  googleClientSecret: optional("GOOGLE_CLIENT_SECRET"),

  // Social OAuth – Facebook
  facebookClientId: optional("FACEBOOK_CLIENT_ID"),
  facebookClientSecret: optional("FACEBOOK_CLIENT_SECRET"),

  // Social OAuth – Twitter/X
  twitterClientId: optional("TWITTER_CLIENT_ID"),
  twitterClientSecret: optional("TWITTER_CLIENT_SECRET"),

  // SMTP email
  smtpHost: optional("SMTP_HOST", "smtp.gmail.com"),
  smtpPort: parseInt(optional("SMTP_PORT", "465"), 10),
  smtpSecure: optional("SMTP_SECURE", "true") === "true",
  smtpUser: optional("SMTP_USER"),
  smtpPass: optional("SMTP_PASS"),
  smtpFrom: optional("SMTP_FROM", "noreply@samsungstore.com.mx"),
};
