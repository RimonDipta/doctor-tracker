import { z } from "zod";

/** Case-insensitive collation. Indexes on text fields are built with the same one. */
export const CI_COLLATION = { locale: "en", strength: 2 } as const;

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const containsAny = (fields: string[], term: string) => {
  const pattern = new RegExp(escapeRegex(term), "i");
  return { $or: fields.map((field) => ({ [field]: pattern })) };
};

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const paginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** Inclusive date range for `YYYY-MM-DD` filters: `to` covers the whole day. */
export function dateRange(from?: string, to?: string) {
  if (!from && !to) return undefined;
  const range: { $gte?: Date; $lt?: Date } = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) range.$lt = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 86_400_000);
  return range;
}
