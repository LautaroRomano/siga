import { prisma } from "@repo/db";
import type { MemberRole } from "@repo/domain";

import { auth } from "./server";

export class UnauthorizedError extends Error {
  constructor() {
    super("No autorizado");
    this.name = "UnauthorizedError";
  }
}

export type { MemberRole };

export type LostOrganization = { id: string; name: string };

export type AuthContext = {
  userId: string;
  organizationId: string;
  role: MemberRole;
  userName: string;
  userEmail: string;
  lostOrganization: LostOrganization | null;
};

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

type Membership = { organizationId: string; role: string };

// Better Auth guarda el rol como texto ("owner" o una lista separada por comas con otros
// roles); única fuente de verdad para leerlo, reexportada para el resto de la API.
export const roleOf = (role: string): MemberRole =>
  role.split(",").includes("owner") ? "owner" : "member";

// La organización activa de la cookie puede haber dejado de tener membresía (el Administrador
// quitó al miembro): la organización en sí sigue existiendo, así que se nombra para el aviso
// antes de caer a la propia.
const resolveLostOrganization = async (
  organizationId: string | null,
): Promise<LostOrganization | null> => {
  if (!organizationId) return null;
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true },
  });
};

// La cookie cachea la sesión y no se invalida al quitar al miembro: la membresía se lee en
// cada request y, si la organización activa ya no tiene una, se vuelve a la propia informando
// de qué organización se dejó (`removeMembership` deja la referencia vieja en la sesión a
// propósito, para poder nombrarla).
const resolveActiveMembership = async (
  userId: string,
  activeOrganizationId: string | null,
): Promise<{ membership: Membership; lostOrganization: LostOrganization | null } | null> => {
  const memberships = await prisma.member.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true, role: true },
  });
  const active = memberships.find(
    (membership) => membership.organizationId === activeOrganizationId,
  );
  if (active) return { membership: active, lostOrganization: null };
  const owned = memberships.find((membership) => roleOf(membership.role) === "owner");
  if (!owned) return null;
  return {
    membership: owned,
    lostOrganization: await resolveLostOrganization(activeOrganizationId),
  };
};

const toAuthContext = async (session: SessionResult): Promise<AuthContext | null> => {
  if (!session) return null;
  const resolution = await resolveActiveMembership(
    session.user.id,
    session.session.activeOrganizationId ?? null,
  );
  if (!resolution) return null;
  const { membership, lostOrganization } = resolution;
  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: roleOf(membership.role),
    userName: session.user.name,
    userEmail: session.user.email,
    lostOrganization,
  };
};

export const getAuthContext = async (headers: Headers): Promise<AuthContext | null> =>
  toAuthContext(await auth.api.getSession({ headers }));

// Para quien puede responder cookies (la API): además del contexto, las cookies con las que
// Better Auth renueva la caché de sesión.
export const readAuthContext = async (
  headers: Headers,
): Promise<{ auth: AuthContext | null; setCookies: string[] }> => {
  const { headers: responseHeaders, response } = await auth.api.getSession({
    headers,
    returnHeaders: true,
  });
  return { auth: await toAuthContext(response), setCookies: responseHeaders.getSetCookie() };
};

export const requireAuthContext = async (headers: Headers): Promise<AuthContext> => {
  const context = await getAuthContext(headers);
  if (!context) throw new UnauthorizedError();
  return context;
};
