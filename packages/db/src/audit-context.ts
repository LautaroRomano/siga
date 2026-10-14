import { AsyncLocalStorage } from "node:async_hooks";

export type AuditActor = {
  userId: string | null;
  organizationId: string;
};

const storage = new AsyncLocalStorage<AuditActor>();

export const runWithAuditActor = <T>(actor: AuditActor, fn: () => Promise<T>) =>
  storage.run(actor, fn);

export const currentAuditActor = () => storage.getStore() ?? null;
