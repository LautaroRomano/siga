import { describe, expect, it, vi } from "vitest";

import {
  lostOrganizationDismissedStorageKey,
  lostOrganizationRedirectedStorageKey,
  readDismissedLostOrganizationId,
  readRedirectedLostOrganizationId,
  writeDismissedLostOrganizationId,
  writeRedirectedLostOrganizationId,
} from "@/lib/lost-organization";

describe("lost-organization", () => {
  it("lee la organización descartada y la ya redirigida, y tolera almacenamiento vacío o que falla", () => {
    expect(readDismissedLostOrganizationId({ getItem: () => "org-1" })).toBe("org-1");
    expect(readDismissedLostOrganizationId({ getItem: () => null })).toBeUndefined();
    expect(
      readDismissedLostOrganizationId({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBeUndefined();

    expect(readRedirectedLostOrganizationId({ getItem: () => "org-2" })).toBe("org-2");
    expect(readRedirectedLostOrganizationId({ getItem: () => null })).toBeUndefined();
  });

  it("guarda cada una en su propia clave y tolera errores al escribir", () => {
    const setItem = vi.fn();
    writeDismissedLostOrganizationId({ setItem }, "org-1");
    expect(setItem).toHaveBeenCalledWith(lostOrganizationDismissedStorageKey, "org-1");

    writeRedirectedLostOrganizationId({ setItem }, "org-1");
    expect(setItem).toHaveBeenCalledWith(lostOrganizationRedirectedStorageKey, "org-1");

    expect(() =>
      writeDismissedLostOrganizationId(
        {
          setItem: () => {
            throw new Error("blocked");
          },
        },
        "org-1",
      ),
    ).not.toThrow();
  });
});
