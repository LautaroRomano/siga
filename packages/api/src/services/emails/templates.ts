import { apiEnv } from "../../env";

// Plantillas puras: reciben el contexto ya resuelto y devuelven asunto y HTML. Sin librería de
// templates; el layout es una tabla de una columna que todos los clientes de email renderizan.
export type EmailContent = { subject: string; html: string };

export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type SummaryRow = [label: string, value: string];

const summaryTable = (rows: SummaryRow[]) =>
  rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${escapeHtml(label)}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

export const emailLayout = (
  title: string,
  paragraphs: string[],
  rows: SummaryRow[],
  cta: { label: string; url: string },
) => `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td>
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
${paragraphs.map((text) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${text}</p>`).join("")}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">${summaryTable(rows)}</table>
<p style="margin:24px 0 0"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(cta.label)}</a></p>
<p style="margin:16px 0 0;font-size:12px;color:#6b7280">Si el botón no funciona, copiá este link: ${escapeHtml(cta.url)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

export type InvitationEmailContext = {
  organizationName: string;
  inviterName: string;
  url: string;
  expiresAt: Date;
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: apiEnv.timeZone,
  day: "numeric",
  month: "long",
});

export const formatEmailDate = (date: Date) => dateFormatter.format(date);

export const invitationEmail = (context: InvitationEmailContext): EmailContent => ({
  subject: `${context.inviterName} te invitó a ${context.organizationName}`,
  html: emailLayout(
    `Invitación a ${context.organizationName}`,
    [
      "Hola,",
      `${escapeHtml(context.inviterName)} te invitó a unirte a la organización ${escapeHtml(context.organizationName)}. Iniciá sesión o registrate con este mismo email y aceptá la invitación.`,
      `El link vence el ${escapeHtml(formatEmailDate(context.expiresAt))}.`,
    ],
    [
      ["Organización", context.organizationName],
      ["Te invita", context.inviterName],
    ],
    { label: "Ver la invitación", url: context.url },
  ),
});
