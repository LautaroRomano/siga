import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});

export const signInWithGoogle = (callbackURL = "/") =>
  authClient.signIn.social({ provider: "google", callbackURL });

export type AuthClient = typeof authClient;
