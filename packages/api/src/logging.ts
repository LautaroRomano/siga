// Un JSON por línea, legible en `vercel logs`. Los tests no lo necesitan.
export const logEvent = (event: string, data: Record<string, unknown>) => {
  if (process.env.NODE_ENV === "test") return;
  console.log(JSON.stringify({ event, ...data }));
};
