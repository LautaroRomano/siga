import { z } from "zod";

export const idSchema = z.string().min(1);

export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

export const optionalEmail = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.email("Email inválido").nullable())
  .nullable()
  .optional();

export const isoDate = z.iso.date("Fecha inválida");
export const isoDateTime = z.iso.datetime({ offset: true, message: "Fecha y hora inválidas" });

export const paginationQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
