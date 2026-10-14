import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { inviteMemberSchema } from "@repo/domain";
import type { Context } from "hono";

import type { ApiEnv } from "../context";
import { ownerOnly } from "../middleware";
import {
  idParamSchema,
  invitationResolutionSchema,
  invitationSchema,
  okSchema,
  pendingInvitationSchema,
} from "../schemas";
import * as invitations from "../services/invitations";

import { commonErrors, jsonBody, jsonResponse } from "./shared";

const tags = ["Invitaciones"];

const actorOf = (c: Context<ApiEnv>): invitations.Actor => ({
  auth: c.get("auth"),
  headers: c.req.raw.headers,
});

export const invitationRoutes = new OpenAPIHono<ApiEnv>()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      tags,
      summary: "Listar las invitaciones vigentes de la organización activa",
      middleware: [ownerOnly] as const,
      responses: {
        200: jsonResponse(z.array(pendingInvitationSchema), "Invitaciones vigentes"),
        ...commonErrors,
      },
    }),
    async (c) =>
      c.json(await invitations.listPendingInvitations(c.get("auth").organizationId), 200),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/",
      tags,
      summary: "Invitar a alguien por email a la organización activa",
      description:
        "Crea una invitación de miembro que vence a los 7 días y encola el email con el link. 409 si ya es miembro o ya tiene una invitación vigente.",
      request: { body: jsonBody(inviteMemberSchema) },
      middleware: [ownerOnly] as const,
      responses: {
        201: jsonResponse(pendingInvitationSchema, "Invitación creada"),
        ...commonErrors,
      },
    }),
    async (c) => c.json(await invitations.inviteMember(actorOf(c), c.req.valid("json")), 201),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/{id}/resend",
      tags,
      summary: "Reenviar el email de una invitación vigente",
      description: "Mismo link y mismo vencimiento; el primero sigue sirviendo.",
      request: { params: idParamSchema },
      middleware: [ownerOnly] as const,
      responses: {
        200: jsonResponse(pendingInvitationSchema, "Invitación reenviada"),
        ...commonErrors,
      },
    }),
    async (c) =>
      c.json(await invitations.resendInvitation(actorOf(c), c.req.valid("param").id), 200),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/{id}/cancel",
      tags,
      summary: "Cancelar una invitación vigente",
      request: { params: idParamSchema },
      middleware: [ownerOnly] as const,
      responses: { 200: jsonResponse(okSchema, "Invitación cancelada"), ...commonErrors },
    }),
    async (c) => {
      await invitations.cancelInvitation(actorOf(c), c.req.valid("param").id);
      return c.json({ ok: true as const }, 200);
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{id}",
      tags,
      summary: "Leer una invitación recibida",
      description:
        "La organización que invita y el estado: `PENDING` (se puede aceptar o rechazar), `EXPIRED`, `CANCELED`, `ACCEPTED` o `REJECTED`. `forCurrentUser` dice si es para el email de la sesión.",
      request: { params: idParamSchema },
      responses: { 200: jsonResponse(invitationSchema, "Invitación"), ...commonErrors },
    }),
    async (c) =>
      c.json(await invitations.getInvitation(c.get("auth"), c.req.valid("param").id), 200),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/{id}/accept",
      tags,
      summary: "Aceptar la invitación",
      description:
        "Solo con el email invitado y mientras esté vigente (si no, 400 o 403). Hace miembro a la cuenta y deja activa la organización propia.",
      request: { params: idParamSchema },
      responses: {
        200: jsonResponse(invitationResolutionSchema, "Invitación aceptada"),
        ...commonErrors,
      },
    }),
    async (c) =>
      c.json(await invitations.acceptInvitation(actorOf(c), c.req.valid("param").id), 200),
  )
  .openapi(
    createRoute({
      method: "post",
      path: "/{id}/reject",
      tags,
      summary: "Rechazar la invitación",
      description: "Solo con el email invitado y mientras esté vigente (si no, 400 o 403).",
      request: { params: idParamSchema },
      responses: {
        200: jsonResponse(invitationResolutionSchema, "Invitación rechazada"),
        ...commonErrors,
      },
    }),
    async (c) =>
      c.json(await invitations.rejectInvitation(actorOf(c), c.req.valid("param").id), 200),
  );
