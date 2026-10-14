"use client";

import type {
  InvitationDto,
  InvitationResolutionDto,
  PendingInvitationDto,
} from "@repo/api/client";
import type { InviteMemberInput } from "@repo/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const useInvitation = (id: string) =>
  useQuery({
    queryKey: queryKeys.invitation(id),
    queryFn: () => unwrap<InvitationDto>(api.invitations[":id"].$get({ param: { id } })),
    retry: false,
  });

export const useAcceptInvitation = () =>
  useMutation({
    mutationFn: (id: string) =>
      unwrap<InvitationResolutionDto>(api.invitations[":id"].accept.$post({ param: { id } })),
  });

export const useRejectInvitation = () =>
  useMutation({
    mutationFn: (id: string) =>
      unwrap<InvitationResolutionDto>(api.invitations[":id"].reject.$post({ param: { id } })),
  });

export const useInvitations = () =>
  useQuery({
    queryKey: queryKeys.invitations,
    queryFn: () => unwrap<PendingInvitationDto[]>(api.invitations.$get()),
  });

const useInvalidateInvitations = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations });
};

export const useInviteMember = () => {
  const invalidate = useInvalidateInvitations();
  return useMutation({
    mutationFn: (input: InviteMemberInput) =>
      unwrap<PendingInvitationDto>(api.invitations.$post({ json: input })),
    onSuccess: invalidate,
  });
};

export const useResendInvitation = () =>
  useMutation({
    mutationFn: (id: string) =>
      unwrap<PendingInvitationDto>(api.invitations[":id"].resend.$post({ param: { id } })),
  });

export const useCancelInvitation = () => {
  const invalidate = useInvalidateInvitations();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap<{ ok: true }>(api.invitations[":id"].cancel.$post({ param: { id } })),
    onSuccess: invalidate,
  });
};
