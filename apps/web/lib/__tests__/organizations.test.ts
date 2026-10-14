import type { MyOrganizationDto } from "@repo/api/client";
import { describe, expect, it } from "vitest";

import { sortOrganizations } from "@/lib/organizations";

const org = (id: string, name: string, role: MyOrganizationDto["role"]): MyOrganizationDto => ({
  id,
  name,
  slug: id,
  role,
});

describe("organizations", () => {
  it("ordena la propia primero y las ajenas después por nombre", () => {
    const organizations = [
      org("b", "Organización Sur", "member"),
      org("a", "Organización Norte", "member"),
      org("c", "Organización Propia", "owner"),
    ];
    expect(sortOrganizations(organizations).map((organization) => organization.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
});
