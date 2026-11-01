import { z } from "zod";
import { email, plainText } from "../../lib/schemas.js";

// bcrypt only reads the first 72 bytes, so longer passwords are refused rather than truncated.
const newPassword = z
  .string()
  .min(10, "Use at least 10 characters")
  .refine((value) => Buffer.byteLength(value) <= 72, "Use at most 72 bytes");

export const loginBody = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, "Password is required").max(200),
});

export const updateProfileBody = z.object({
  name: plainText("Name", 2, 80),
  email,
});

export const changePasswordBody = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(200),
  newPassword,
});
