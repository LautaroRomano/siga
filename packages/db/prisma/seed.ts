import { createLocalAccountIssuer } from "@better-auth/core/db";
import { hashPassword } from "better-auth/crypto";

import { prisma } from "../src/client";

// Usuario de QA: el mismo que el flujo de tickets usa en staging.
const demoUser = {
  id: "demo-user",
  name: "Usuario Demo",
  email: "demo@example.com",
  password: "demo1234",
};

const demoOrganization = { id: "demo-org", name: "Organización demo", slug: "demo" };

const upsertUser = async (user: typeof demoUser) =>
  prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: true,
      accounts: {
        create: {
          id: `${user.id}-account`,
          accountId: user.id,
          providerId: "credential",
          issuer: createLocalAccountIssuer("credential"),
          password: await hashPassword(user.password),
        },
      },
    },
  });

const upsertOwnedOrganization = (organization: typeof demoOrganization, ownerId: string) =>
  prisma.organization.upsert({
    where: { id: organization.id },
    update: {},
    create: {
      ...organization,
      createdAt: new Date(),
      members: {
        create: {
          id: `${organization.id}-owner`,
          userId: ownerId,
          role: "owner",
          createdAt: new Date(),
        },
      },
    },
  });

const seed = async () => {
  await upsertUser(demoUser);
  await upsertOwnedOrganization(demoOrganization, demoUser.id);
  console.log(`Seed listo. Usuario: ${demoUser.email} / ${demoUser.password}`);
};

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
