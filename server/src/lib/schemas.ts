import { Types } from "mongoose";
import { z } from "zod";

export const objectId = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value), "Invalid id");

export const idParams = z.object({ id: objectId });

/** Single-line text: trimmed, whitespace collapsed, no markup or control characters. */
export const plainText = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required` })
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
        .max(max, `${label} must be at most ${max} characters`)
        // eslint-disable-next-line no-control-regex
        .regex(/^[^<>\u0000-\u001f]*$/, `${label} contains invalid characters`),
    );

export const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254));

export const phone = z
  .string({ error: "Phone is required" })
  .trim()
  .regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number");

export const isoDate = z.iso.date("Use the YYYY-MM-DD format");
