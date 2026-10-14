import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import type { ApiEnv } from "../context";
import { ownerOnly } from "../middleware";
import { memberSchema, okSchema, userIdParamSchema } from "../schemas";
import { listMembers, removeMembership } from "../services/memberships";

import { commonErrors, jsonResponse } from "./shared";

const tags = ["Miembros"];

export const memberRoutes = new OpenAPIHono<ApiEnv>()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      tags,
      summary: "Listar los miembros de la organización activa",
      description: "El Administrador primero, el resto por orden de ingreso.",
      responses: { 200: jsonResponse(z.array(memberSchema), "Miembros"), ...commonErrors },
    }),
    async (c) => c.json(await listMembers(c.get("auth").organizationId), 200),
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{userId}",
      tags,
      summary: "Quitar un miembro de la organización",
      description:
        "La cuenta sigue existiendo con su organización propia; si tenía esta organización activa, su sesión vuelve a la propia en el próximo request. El Administrador no se puede quitar (400).",
      request: { params: userIdParamSchema },
      middleware: [ownerOnly] as const,
      responses: { 200: jsonResponse(okSchema, "Miembro quitado"), ...commonErrors },
    }),
    async (c) => {
      await removeMembership(c.get("auth").organizationId, c.req.valid("param").userId);
      return c.json({ ok: true as const }, 200);
    },
  );
