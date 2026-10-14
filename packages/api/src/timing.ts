import { measure, runWithTimings, type Timings } from "@repo/db";
import { createMiddleware } from "hono/factory";

import type { ApiEnv } from "./context";
import { logEvent } from "./logging";

const round = (milliseconds: number) => Math.round(milliseconds * 10) / 10;

export const timingsToRecord = (timings: Timings) =>
  Object.fromEntries([...timings].map(([metric, value]) => [metric, round(value)]));

// `Server-Timing: total;dur=…, db;dur=…` se lee en el panel Network del navegador.
export const serverTimingHeader = (total: number, timings: Timings) =>
  [`total;dur=${round(total)}`, ...[...timings].map(([m, v]) => `${m};dur=${round(v)}`)].join(", ");

export const measureRequest = createMiddleware<ApiEnv>(async (c, next) => {
  const timings: Timings = new Map();
  const startedAt = performance.now();
  try {
    await runWithTimings(timings, next);
  } finally {
    const total = performance.now() - startedAt;
    c.header("Server-Timing", serverTimingHeader(total, timings));
    logEvent("api.request", {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      total: round(total),
      ...timingsToRecord(timings),
    });
  }
});

// Una tarea diferida mide y loguea por su cuenta: ya no pertenece a ninguna request.
export const runMeasured = async (name: string, task: () => Promise<unknown>) => {
  const timings: Timings = new Map();
  const startedAt = performance.now();
  try {
    await runWithTimings(timings, task);
    logEvent("api.deferred", {
      task: name,
      total: round(performance.now() - startedAt),
      ...timingsToRecord(timings),
    });
  } catch (error) {
    console.error(error);
    logEvent("api.deferred", {
      task: name,
      failed: true,
      total: round(performance.now() - startedAt),
    });
  }
};

export { measure };
