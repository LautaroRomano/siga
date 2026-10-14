import { describe, expect, it } from "vitest";

import { isListLoading } from "@/lib/query-state";

describe("isListLoading", () => {
  it("carga mientras la consulta está pendiente", () => {
    expect(isListLoading({ isPending: true, isFetching: true, data: undefined })).toBe(true);
  });

  it("carga mientras refetchea sin datos que mostrar", () => {
    expect(isListLoading({ isPending: false, isFetching: true, data: [] })).toBe(true);
  });

  it("no carga si refetchea con datos ya visibles", () => {
    expect(isListLoading({ isPending: false, isFetching: true, data: [1] })).toBe(false);
  });

  it("no carga con la consulta resuelta y quieta, aun vacía", () => {
    expect(isListLoading({ isPending: false, isFetching: false, data: [] })).toBe(false);
  });
});
