import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@repo/db";
import { slugify } from "@repo/domain";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { bearer, organization } from "better-auth/plugins";

import { authEnv } from "./env";

const invitationExpiresInSeconds = 7 * 24 * 60 * 60;

const createOwnedOrganization = (user: { id: string; name: string }) =>
  prisma.organization.create({
    data: {
      id: crypto.randomUUID(),
      name: `Organización de ${user.name}`,
      slug: `${slugify(user.name) || "organizacion"}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
      members: {
        create: { id: crypto.randomUUID(), userId: user.id, role: "owner", createdAt: new Date() },
      },
    },
  });

// Toda cuenta tiene una organización propia (donde es owner) que arranca activa en cada
// sesión nueva; se crea acá, en la primera sesión, y no al crear el usuario.
const resolveOwnedOrganizationId = async (userId: string) => {
  const membership = await prisma.member.findFirst({
    where: { userId, role: "owner" },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  if (membership) return membership.organizationId;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return (await createOwnedOrganization(user)).id;
};

export const auth = betterAuth({
  baseURL: authEnv.baseUrl,
  secret: authEnv.secret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  // La sesión viaja firmada en una cookie 5 minutos: la mayoría de las requests no tocan la
  // base para autenticar; una sesión revocada deja de servir al vencer la caché.
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  rateLimit: { enabled: authEnv.rateLimitEnabled },
  socialProviders: {
    google: {
      clientId: authEnv.googleClientId,
      clientSecret: authEnv.googleClientSecret,
      prompt: "select_account",
    },
  },
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => ({
          data: {
            ...session,
            activeOrganizationId: await resolveOwnedOrganizationId(session.userId),
          },
        }),
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: false,
      invitationExpiresIn: invitationExpiresInSeconds,
      // Las cuentas por email no verifican el email; el vínculo lo garantiza la sesión.
      requireEmailVerificationOnInvitation: false,
    }),
    bearer(),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
