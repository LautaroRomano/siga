import { describe, expect, it } from "vitest";

import { RequestError, unwrap } from "../api-client";

const response = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
  );

describe("unwrap", () => {
  it("devuelve el JSON cuando la respuesta es exitosa", async () => {
    await expect(unwrap(response(200, { ok: true }))).resolves.toEqual({ ok: true });
  });

  it("convierte errores de la API en RequestError con issues", async () => {
    const error = await unwrap(
      response(422, {
        error: {
          code: "VALIDATION",
          message: "Revisá",
          issues: [{ path: "dni", message: "Inválido" }],
        },
      }),
    ).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(RequestError);
    expect((error as RequestError).status).toBe(422);
    expect((error as RequestError).issues).toEqual([{ path: "dni", message: "Inválido" }]);
  });

  it("tolera cuerpos que no son JSON", async () => {
    const error = await unwrap(Promise.resolve(new Response("boom", { status: 500 }))).catch(
      (caught: unknown) => caught,
    );
    expect((error as RequestError).code).toBe("UNKNOWN");
  });
});
