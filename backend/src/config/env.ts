import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT ?? 5000),
  apiUrl: process.env.API_URL ?? "http://localhost:5000",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",

  mongodbUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/productivity_tracker"),

  jwtSecret: required("JWT_SECRET", "dev_only_insecure_secret_change_me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", "dev_only_insecure_refresh_secret_change_me"),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",

  cookieSecure: process.env.COOKIE_SECURE === "true",

  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),

  aiProvider: process.env.AI_PROVIDER ?? "none",
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? "",

  notificationProvider: process.env.NOTIFICATION_PROVIDER ?? "in_app",
  pushProviderKey: process.env.PUSH_PROVIDER_KEY ?? "",
  emailProviderKey: process.env.EMAIL_PROVIDER_KEY ?? "",

  logLevel: process.env.LOG_LEVEL ?? "info",
};
