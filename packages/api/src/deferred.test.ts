import { currentAuditActor, runWithAuditActor } from "@repo/db";
import { describe, expect, it, vi } from "vitest";

import { collectDeferred, runDeferred, runWithDefer } from "./deferred";

const actor = { userId: "user-1", organizationId: "org-1" };

describe("tareas diferidas", () => {
  it("sin adaptador corre en línea y devuelve el resultado", async () => {
    const task = vi.fn().mockResolvedValue("hecho");
    expect(await runDeferred("storage", task)).toEqual({ ran: true, result: "hecho" });
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("con adaptador vuelve al instante y la tarea corre al vaciar la cola", async () => {
    const collector = collectDeferred();
    const task = vi.fn().mockResolvedValue("hecho");
    const outcome = await runWithDefer(collector.defer, () => runDeferred("storage", task));
    expect(outcome).toEqual({ ran: false });
    expect(task).not.toHaveBeenCalled();
    expect(collector.pending()).toBe(1);
    await collector.flush();
    expect(task).toHaveBeenCalledTimes(1);
    expect(collector.pending()).toBe(0);
  });

  it("la tarea diferida conserva el actor de auditoría de la request", async () => {
    const collector = collectDeferred();
    const seen: unknown[] = [];
    await runWithAuditActor(actor, () =>
      runWithDefer(collector.defer, () =>
        runDeferred("email", () => {
          seen.push(currentAuditActor());
          return Promise.resolve();
        }),
      ),
    );
    expect(currentAuditActor()).toBeNull();
    await collector.flush();
    expect(seen).toEqual([actor]);
  });

  it("una tarea diferida que falla no rompe la cola ni a quien la encoló", async () => {
    const collector = collectDeferred();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const after = vi.fn().mockResolvedValue(undefined);
    await runWithDefer(collector.defer, async () => {
      await runDeferred("storage", () => Promise.reject(new Error("Proveedor caído")));
      await runDeferred("email", after);
    });
    await expect(collector.flush()).resolves.toBeUndefined();
    expect(after).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
