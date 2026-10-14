import { z } from "zod";

export const emailStatusSchema = z.enum(["PENDING", "SENT", "FAILED"]);
export type EmailStatus = z.infer<typeof emailStatusSchema>;

export const invitationStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "CANCELED",
  "EXPIRED",
]);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

export const memberRoleSchema = z.enum(["owner", "member"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const memberRoleLabels: Record<MemberRole, string> = {
  owner: "Administrador",
  member: "Miembro",
};
