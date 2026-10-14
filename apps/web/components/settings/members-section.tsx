"use client";

import type { MemberDto, PendingInvitationDto } from "@repo/api/client";
import { memberRoleLabels } from "@repo/domain";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@repo/ui/components/item";
import { Skeleton } from "@repo/ui/components/skeleton";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCancelInvitation, useInvitations, useResendInvitation } from "@/hooks/use-invitation";
import { useMembers, useRemoveMember } from "@/hooks/use-members";
import { formatDate } from "@/lib/dates";
import { showRequestError } from "@/lib/form-errors";

import { ConfirmDialog } from "./confirm-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";

function MemberItem({
  member,
  isCurrentUser,
  onRemove,
}: {
  member: MemberDto;
  isCurrentUser: boolean;
  onRemove: () => void;
}) {
  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>
          {member.name}
          <Badge variant={member.role === "owner" ? "default" : "secondary"}>
            {memberRoleLabels[member.role]}
          </Badge>
          {isCurrentUser ? <span className="text-muted-foreground text-xs">(vos)</span> : null}
        </ItemTitle>
        <ItemDescription>{member.email}</ItemDescription>
      </ItemContent>
      {member.role === "member" ? (
        <ItemActions>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={`Acciones de ${member.name}`} />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem variant="destructive" onClick={onRemove}>
                Quitar de la organización
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ItemActions>
      ) : null}
    </Item>
  );
}

function InvitationItem({
  invitation,
  onCancel,
}: {
  invitation: PendingInvitationDto;
  onCancel: () => void;
}) {
  const resend = useResendInvitation();

  const resendInvitation = async () => {
    try {
      await resend.mutateAsync(invitation.id);
      toast.success("Invitación reenviada");
    } catch (error) {
      showRequestError(error);
    }
  };

  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>
          {invitation.email}
          <Badge variant="outline">Invitación enviada</Badge>
        </ItemTitle>
        <ItemDescription>Vence el {formatDate(invitation.expiresAt)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Acciones de la invitación a ${invitation.email}`}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled={resend.isPending} onClick={resendInvitation}>
              Reenviar invitación
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onCancel}>
              Cancelar invitación
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  );
}

export function MembersSection({ currentUserId }: { currentUserId: string }) {
  const members = useMembers();
  const invitations = useInvitations();
  const removeMember = useRemoveMember();
  const cancelInvitation = useCancelInvitation();
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<MemberDto | null>(null);
  const [canceling, setCanceling] = useState<PendingInvitationDto | null>(null);

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await removeMember.mutateAsync(removing.userId);
      toast.success("Miembro quitado");
      setRemoving(null);
    } catch (error) {
      showRequestError(error);
    }
  };

  const confirmCancel = async () => {
    if (!canceling) return;
    try {
      await cancelInvitation.mutateAsync(canceling.id);
      toast.success("Invitación cancelada");
      setCanceling(null);
    } catch (error) {
      showRequestError(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Miembros</CardTitle>
        <CardDescription>
          Quiénes pueden entrar a esta organización. Invitá por email a alguien con cuenta o sin
          ella.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setInviting(true)}>
            <PlusIcon />
            Invitar
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {members.isPending || invitations.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <ItemGroup className="gap-2">
            {members.data?.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                isCurrentUser={member.userId === currentUserId}
                onRemove={() => setRemoving(member)}
              />
            ))}
            {invitations.data?.map((invitation) => (
              <InvitationItem
                key={invitation.id}
                invitation={invitation}
                onCancel={() => setCanceling(invitation)}
              />
            ))}
          </ItemGroup>
        )}
      </CardContent>

      <InviteMemberDialog open={inviting} onOpenChange={setInviting} />
      {removing ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setRemoving(null)}
          title={`¿Quitar a ${removing.name}?`}
          description="Deja de ver esta organización. Su cuenta y su organización propia siguen igual; podés invitarlo de nuevo cuando quieras."
          confirmLabel="Quitar"
          pending={removeMember.isPending}
          onConfirm={confirmRemove}
        />
      ) : null}
      {canceling ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setCanceling(null)}
          title={`¿Cancelar la invitación a ${canceling.email}?`}
          description="El link que le llegó por email deja de servir. Podés invitarlo de nuevo cuando quieras."
          confirmLabel="Cancelar invitación"
          pending={cancelInvitation.isPending}
          onConfirm={confirmCancel}
        />
      ) : null}
    </Card>
  );
}
