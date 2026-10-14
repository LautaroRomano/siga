import { getAuthContext } from "@repo/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

// Layout, metadata y página comparten la lectura de sesión de la misma request.
const readSession = cache(async () => getAuthContext(await headers()));

export const requireSession = async () => {
  const context = await readSession();
  if (!context) redirect("/login");
  return context;
};
