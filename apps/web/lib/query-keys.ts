export const queryKeys = {
  me: ["me"] as const,
  settings: ["settings"] as const,
  members: ["members"] as const,
  invitations: ["invitations"] as const,
  invitation: (id: string) => ["invitation", id] as const,
};
