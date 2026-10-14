import { describe, expect, it } from "vitest";

import { inviteMemberSchema } from "./invitations";

describe("inviteMemberSchema", () => {
  it("normaliza el email a minúsculas sin espacios", () => {
    expect(inviteMemberSchema.parse({ email: "  Ana@Example.com " })).toEqual({
      email: "ana@example.com",
    });
  });

  it("rechaza un email inválido o vacío", () => {
    expect(inviteMemberSchema.safeParse({ email: "ana" }).success).toBe(false);
    expect(inviteMemberSchema.safeParse({ email: "" }).success).toBe(false);
    expect(inviteMemberSchema.safeParse({}).success).toBe(false);
  });
});
