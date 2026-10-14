import { describe, expect, it } from "vitest";

import { escapeHtml, formatEmailDate, invitationEmail } from "./templates";

describe("plantillas de email", () => {
  it("formatea la fecha en hora de Argentina", () => {
    expect(formatEmailDate(new Date("2026-09-22T01:00:00.000Z"))).toBe("21 de septiembre");
  });

  it("escapa el HTML de los valores", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
    );
  });

  it("la invitación a la organización lleva quién invita, el link y el vencimiento", () => {
    const email = invitationEmail({
      organizationName: "Organización & Cía",
      inviterName: "Ana <Demo>",
      url: "https://app.test/invitacion/inv-1",
      expiresAt: new Date("2026-09-22T13:00:00.000Z"),
    });
    expect(email.subject).toBe("Ana <Demo> te invitó a Organización & Cía");
    expect(email.html).toContain("Ana &lt;Demo&gt; te invitó");
    expect(email.html).toContain("Organización &amp; Cía");
    expect(email.html).toContain("El link vence el 22 de septiembre.");
    expect(email.html).toContain('href="https://app.test/invitacion/inv-1"');
    expect(email.html).toContain("Ver la invitación");
  });
});
