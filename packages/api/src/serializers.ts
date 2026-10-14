export const toIso = (date: Date) => date.toISOString();
export const toIsoOrNull = (date: Date | null) => (date ? date.toISOString() : null);
