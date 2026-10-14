import { hc } from "hono/client";

import type { ApiType } from "./app";

export type ApiClient = ReturnType<typeof hc<ApiType>>;

export const createApiClient = (baseUrl: string, init?: RequestInit): ApiClient =>
  hc<ApiType>(baseUrl, { init });

export type { ApiType } from "./app";
export type * from "./schemas";
