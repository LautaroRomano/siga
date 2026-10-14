import { z } from "@hono/zod-openapi";
import { invitationStatusSchema, memberRoleSchema } from "@repo/domain";

export const errorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    }),
  })
  .openapi("ApiError");

export const idParamSchema = z.object({
  id: z.string().openapi({ param: { name: "id", in: "path" } }),
});

export const userIdParamSchema = z.object({
  userId: z.string().openapi({ param: { name: "userId", in: "path" } }),
});

export const okSchema = z.object({ ok: z.literal(true) }).openapi("Ok");

export const myOrganizationSchema = z
  .object({ id: z.string(), name: z.string(), slug: z.string(), role: memberRoleSchema })
  .openapi("MyOrganization");
export type MyOrganizationDto = z.infer<typeof myOrganizationSchema>;

export const lostOrganizationSchema = z
  .object({ id: z.string(), name: z.string() })
  .openapi("LostOrganization");

export const meSchema = z
  .object({
    userId: z.string(),
    userName: z.string(),
    userEmail: z.string(),
    organizationId: z.string(),
    role: memberRoleSchema,
    organizations: z.array(myOrganizationSchema).openapi({
      description: "Todas las organizaciones de la cuenta: la propia y las que la invitaron",
    }),
    lostOrganization: lostOrganizationSchema.nullable().openapi({
      description:
        "La organización activa dejó de tener membresía y la sesión volvió a la propia; `null` en el resto de los casos.",
    }),
  })
  .openapi("Me");
export type MeDto = z.infer<typeof meSchema>;

export const settingsSchema = z.object({ name: z.string() }).openapi("Settings");
export type SettingsDto = z.infer<typeof settingsSchema>;

export const memberSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    email: z.string(),
    role: memberRoleSchema,
    createdAt: z.string(),
  })
  .openapi("Member");
export type MemberDto = z.infer<typeof memberSchema>;

export const pendingInvitationSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    expiresAt: z.string(),
    createdAt: z.string(),
  })
  .openapi("PendingInvitation");
export type PendingInvitationDto = z.infer<typeof pendingInvitationSchema>;

export const invitationSchema = z
  .object({
    id: z.string(),
    organizationName: z.string(),
    status: invitationStatusSchema,
    expiresAt: z.string(),
    forCurrentUser: z
      .boolean()
      .openapi({ description: "La invitación es para el email de la sesión" }),
  })
  .openapi("Invitation");
export type InvitationDto = z.infer<typeof invitationSchema>;

export const invitationResolutionSchema = z
  .object({ organizationName: z.string() })
  .openapi("InvitationResolution");
export type InvitationResolutionDto = z.infer<typeof invitationResolutionSchema>;

export const cronResultSchema = z
  .object({ processed: z.number(), failed: z.number() })
  .openapi("CronResult");

export const dailyCronResultSchema = z
  .object({ emails: cronResultSchema, purgedRateLimitBuckets: z.number() })
  .openapi("DailyCronResult");
export type DailyCronResultDto = z.infer<typeof dailyCronResultSchema>;
