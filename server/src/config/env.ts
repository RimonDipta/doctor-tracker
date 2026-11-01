import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/doctor-tracker"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", z.treeifyError(parsed.error));
  process.exit(1);
}

const { CLIENT_ORIGIN, COOKIE_SECURE, ...rest } = parsed.data;

export const env = {
  ...rest,
  CLIENT_ORIGINS: CLIENT_ORIGIN.split(",").map((origin) => origin.trim().replace(/\/$/, "")),
  COOKIE_SECURE: COOKIE_SECURE ? COOKIE_SECURE === "true" : rest.NODE_ENV === "production",
};
