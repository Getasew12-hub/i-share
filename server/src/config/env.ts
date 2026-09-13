import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  PORT: z.coerce.number().int().positive().default(4000),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS: z.coerce
    .number()
    .int()
    .positive()
    .default(24),
});

const parsedEnv = envSchema.parse(process.env);

function requireSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET") {
  const value = parsedEnv[name];

  if (value) {
    return value;
  }

  if (parsedEnv.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production.`);
  }

  return `development-only-${name.toLowerCase()}-replace-before-production`;
}

export const env = {
  ...parsedEnv,
  JWT_ACCESS_SECRET: requireSecret("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: requireSecret("JWT_REFRESH_SECRET"),
};
