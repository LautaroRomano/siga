import type { AuthContext } from "@repo/auth";

export type ApiEnv = {
  Variables: {
    auth: AuthContext;
  };
};
