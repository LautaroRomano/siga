import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
