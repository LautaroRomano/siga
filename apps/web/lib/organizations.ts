import type { MyOrganizationDto } from "@repo/api/client";

// La propia primera, las ajenas después por nombre: el orden del selector de organización.
export const sortOrganizations = (organizations: MyOrganizationDto[]) =>
  [...organizations].sort((a, b) => {
    if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
    return a.name.localeCompare(b.name, "es");
  });
