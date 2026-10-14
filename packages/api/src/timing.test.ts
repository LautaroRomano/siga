import { measure, prisma, runWithTimings, type Timings } from "@repo/db";
import { describe, expect, it } from "vitest";

import { serverTimingHeader, timingsToRecord } from "./timing";

describe("medición por request", () => {
  it("acumula por métrica solo dentro de un contexto y no molesta fuera de él", async () => {
    const timings: Timings = new Map();
    await runWithTimings(timings, async () => {
      await measure("email", () => new Promise((resolve) => setTimeout(resolve, 5)));
      await measure("email", () => Promise.resolve("ok"));
      expect(await measure("storage", () => Promise.resolve(42))).toBe(42);
    });
    expect(timings.get("email")).toBeGreaterThanOrEqual(4);
    expect(await measure("outside", () => Promise.resolve("libre"))).toBe("libre");
    expect(timings.has("outside")).toBe(false);
  });

  it("las consultas a la base suman a la métrica db", async () => {
    const timings: Timings = new Map();
    await runWithTimings(timings, async () => {
      await prisma.user.count();
    });
    expect(timings.get("db")).toBeGreaterThan(0);
  });

  it("arma el header Server-Timing con una décima de milisegundo", () => {
    const timings: Timings = new Map([
      ["session", 12.345],
      ["db", 3.26],
    ]);
    expect(serverTimingHeader(20.04, timings)).toBe("total;dur=20, session;dur=12.3, db;dur=3.3");
    expect(timingsToRecord(timings)).toEqual({ session: 12.3, db: 3.3 });
  });
});
