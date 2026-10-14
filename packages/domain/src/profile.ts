import { z } from "zod";

export const userNameSchema = z.string().trim().min(1, "Ingresá tu nombre").max(120);

export const updateProfileSchema = z.object({ name: userNameSchema });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
