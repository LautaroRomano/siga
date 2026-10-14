import { prisma } from "@repo/db";
import { beforeEach, describe, expect, it } from "vitest";

import { resetDatabase } from "../test/db";

import { consumeRateLimit, purgeRateLimitBuckets } from "./rate-limit";

const at = (iso: string) => new Date(iso);

beforeEach(async () => {
  await resetDatabase();
});

describe("rate limit", () => {
  it("deja pasar hasta el límite dentro de la ventana y rechaza el siguiente", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await consumeRateLimit("ip:1|bookings", 3, 60, at("2026-09-14T12:00:10.000Z"));
    }
    await expect(
      consumeRateLimit("ip:1|bookings", 3, 60, at("2026-09-14T12:00:50.000Z")),
    ).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
    await expect(
      consumeRateLimit("ip:2|bookings", 3, 60, at("2026-09-14T12:00:50.000Z")),
    ).resolves.toBeUndefined();
  });

  it("al cambiar la ventana vuelve a contar desde cero", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await consumeRateLimit("ip:1|bookings", 3, 60, at("2026-09-14T12:00:10.000Z"));
    }
    await expect(
      consumeRateLimit("ip:1|bookings", 3, 60, at("2026-09-14T12:01:00.000Z")),
    ).resolves.toBeUndefined();
  });

  it("pedidos concurrentes se cuentan todos", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        consumeRateLimit("ip:1|bookings", 5, 60, at("2026-09-14T12:00:10.000Z")),
      ),
    );
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("la purga borra las ventanas viejas y conserva las recientes", async () => {
    await consumeRateLimit("ip:1|reads", 10, 60, at("2026-09-10T12:00:00.000Z"));
    await consumeRateLimit("ip:1|reads", 10, 60, at("2026-09-14T12:00:00.000Z"));
    expect(await purgeRateLimitBuckets(at("2026-09-14T13:00:00.000Z"))).toBe(1);
    expect(await prisma.rateLimitBucket.count()).toBe(1);
  });
});
