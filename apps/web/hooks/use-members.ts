"use client";

import type { MemberDto } from "@repo/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const useMembers = () =>
  useQuery({
    queryKey: queryKeys.members,
    queryFn: () => unwrap<MemberDto[]>(api.members.$get()),
  });

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      unwrap<{ ok: true }>(api.members[":userId"].$delete({ param: { userId } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members }),
  });
};
