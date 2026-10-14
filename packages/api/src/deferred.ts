import { AsyncLocalStorage } from "node:async_hooks";

import { currentAuditActor, runWithAuditActor } from "@repo/db";

import { runMeasured } from "./timing";

export type DeferredTask = () => Promise<void>;

// Quien monta la API decide cómo correr lo que puede esperar a después de responder (emails,
// integraciones). Next lo inyecta con `after`; sin adaptador la tarea corre en línea.
export type DeferAdapter = (task: DeferredTask) => void;

const storage = new AsyncLocalStorage<DeferAdapter>();

export const runWithDefer = <T>(adapter: DeferAdapter | undefined, fn: () => Promise<T>) =>
  adapter ? storage.run(adapter, fn) : fn();

export type DeferredOutcome<T> = { ran: true; result: T } | { ran: false };

// En línea devuelve el resultado de la tarea; diferida vuelve al instante sin resultado. La
// tarea conserva el actor de auditoría de la request que la originó.
export const runDeferred = async <T>(
  name: string,
  task: () => Promise<T>,
): Promise<DeferredOutcome<T>> => {
  const adapter = storage.getStore();
  const actor = currentAuditActor();
  const run = () => (actor ? runWithAuditActor(actor, task) : task());
  if (!adapter) return { ran: true, result: await run() };
  adapter(() => runMeasured(name, run));
  return { ran: false };
};

// Para los tests: junta las tareas y las corre cuando el test lo pide.
export const collectDeferred = () => {
  const tasks: DeferredTask[] = [];
  const defer: DeferAdapter = (task) => {
    tasks.push(task);
  };
  const flush = async () => {
    while (tasks.length > 0) await tasks.shift()?.();
  };
  return { defer, flush, pending: () => tasks.length };
};
