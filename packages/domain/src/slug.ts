import { z } from "zod";

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Primer slug libre a partir de una base: `base`, `base-2`, `base-3`…
export const uniqueSlug = (base: string, taken: Iterable<string>) => {
  const used = new Set(taken);
  const root = base || "link";
  if (!used.has(root)) return root;
  let suffix = 2;
  while (used.has(`${root}-${suffix}`)) suffix += 1;
  return `${root}-${suffix}`;
};

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "El slug tiene que tener al menos 2 caracteres")
  .max(60, "El slug puede tener hasta 60 caracteres")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usá solo letras minúsculas, números y guiones");
