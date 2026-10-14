import { createApi } from "@repo/api";
import { handle } from "hono/vercel";
import { after } from "next/server";

// Los emails corren después de responder; la función sigue viva hasta que terminan
// (`maxDuration`).
export const maxDuration = 60;

const handler = handle(createApi({ defer: (task) => after(task) }));

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
