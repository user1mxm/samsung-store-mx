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
  smtpPassword: optional("SMTP_PASSWORD", optional("SMTP_PASS")),
  smtpFrom:     optional("SMTP_FROM", "Samsung Store MX <no-reply@samsungstore.com.mx>"),
  uploadDir: optional("UPLOAD_DIR", "/opt/samsung-store-mx/uploads"),
  uploadPublicPath: "/uploads",
  maxUploadBytes: 10 * 1024 * 1024,
  s3Bucket: optional("S3_BUCKET"), s3Region: optional("S3_REGION", "us-east-1"),
  s3Endpoint: optional("S3_ENDPOINT"), s3PublicUrl: optional("S3_PUBLIC_URL"),
  s3AccessKeyId: optional("S3_ACCESS_KEY_ID"), s3SecretAccessKey: optional("S3_SECRET_ACCESS_KEY"),
  adminEmail:   optional("ADMIN_EMAIL", "admin@samsungstore.com.mx"),
  publicBaseUrl: optional("SITE_ORIGIN", optional("PUBLIC_BASE_URL", "https://samsungstore.com.mx")),
  adminNotifyEmail: optional("ADMIN_NOTIFY_EMAIL", optional("ADMIN_EMAIL", "admin@samsungstore.com.mx")),
};
