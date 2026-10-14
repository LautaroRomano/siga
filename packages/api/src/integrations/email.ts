import { Resend } from "resend";

import { apiEnv, isEmailConfigured } from "../env";

export type EmailMessage = { to: string; subject: string; html: string };

let client: Resend | undefined;

const getClient = () => {
  if (!isEmailConfigured()) throw new Error("El envío de emails no está configurado");
  client ??= new Resend(apiEnv.email.resendApiKey);
  return client;
};

export const sendEmail = async (message: EmailMessage) => {
  const { data, error } = await getClient().emails.send({
    from: apiEnv.email.from,
    to: message.to,
    subject: message.subject,
    html: message.html,
  });
  if (error) throw new Error(error.message);
  return data?.id ?? null;
};
