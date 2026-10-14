import { AsyncLocalStorage } from "node:async_hooks";

// Tiempos acumulados por métrica (ms) de la request o tarea en curso: base, Google, email,
// sesión. Sin contexto activo, medir no cuesta nada.
export type Timings = Map<string, number>;

const storage = new AsyncLocalStorage<Timings>();

export const runWithTimings = <T>(timings: Timings, fn: () => Promise<T>) =>
  storage.run(timings, fn);

export const currentTimings = () => storage.getStore();

export const addTiming = (metric: string, milliseconds: number) => {
  const timings = storage.getStore();
  if (timings) timings.set(metric, (timings.get(metric) ?? 0) + milliseconds);
};

export const measure = async <T>(metric: string, fn: () => Promise<T>) => {
  const startedAt = performance.now();
  try {
    return await fn();
  } finally {
    addTiming(metric, performance.now() - startedAt);
  }
};
