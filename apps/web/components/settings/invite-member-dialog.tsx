"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, type InviteMemberInput } from "@repo/domain";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Spinner } from "@repo/ui/components/spinner";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormDialogContent } from "@/components/form-dialog-content";
import { useInviteMember } from "@/hooks/use-invitation";
import { showRequestError } from "@/lib/form-errors";

export function InviteMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const invite = useInviteMember();
  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "" },
  });

  const close = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: InviteMemberInput) => {
    try {
      await invite.mutateAsync(values);
      toast.success("Invitación enviada");
      close();
    } catch (error) {
      showRequestError(error, form.setError);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !invite.isPending && close()}>
      <FormDialogContent>
        <DialogHeader>
          <DialogTitle>Invitar miembro</DialogTitle>
          <DialogDescription>
            Le llega un email con un link para unirse con su propia cuenta. Vence a los 7 días.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.email)}>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                autoComplete="off"
                autoFocus
                {...form.register("email")}
              />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={invite.isPending} onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? <Spinner /> : null}
              Invitar
            </Button>
          </DialogFooter>
        </form>
      </FormDialogContent>
    </Dialog>
  );
}
