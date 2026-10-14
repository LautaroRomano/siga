import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { updateSettingsSchema } from "@repo/domain";

import type { ApiEnv } from "../context";
import { ownerOnly } from "../middleware";
import { settingsSchema } from "../schemas";
import * as settings from "../services/settings";

import { commonErrors, jsonBody, jsonResponse } from "./shared";

const tags = ["Ajustes"];

export const settingsRoutes = new OpenAPIHono<ApiEnv>()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      tags,
      summary: "Leer los ajustes de la organización",
      responses: { 200: jsonResponse(settingsSchema, "Ajustes"), ...commonErrors },
    }),
    async (c) => c.json(await settings.getSettings(c.get("auth").organizationId), 200),
  )
  .openapi(
    createRoute({
      method: "patch",
      path: "/",
      tags,
      summary: "Actualizar los ajustes de la organización",
      request: { body: jsonBody(updateSettingsSchema) },
      middleware: [ownerOnly] as const,
      responses: { 200: jsonResponse(settingsSchema, "Ajustes actualizados"), ...commonErrors },
    }),
    async (c) =>
      c.json(await settings.updateSettings(c.get("auth").organizationId, c.req.valid("json")), 200),
  );
