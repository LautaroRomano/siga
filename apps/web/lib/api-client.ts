import { createApiClient } from "@repo/api/client";

const baseUrl = typeof window === "undefined" ? (process.env.NEXT_PUBLIC_APP_URL ?? "") : "";

export const api = createApiClient(baseUrl, { credentials: "include" }).api.v1;

type ErrorBody = {
  error?: { code?: string; message?: string; issues?: { path: string; message: string }[] };
};

export class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "RequestError";
  }
}

export const unwrap = async <T>(request: Promise<Response>): Promise<T> => {
  const response = await request;
  if (response.ok) return (await response.json()) as T;
  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  throw new RequestError(
    response.status,
    body.error?.code ?? "UNKNOWN",
    body.error?.message ?? "Ocurrió un error inesperado",
    body.error?.issues ?? [],
  );
};
