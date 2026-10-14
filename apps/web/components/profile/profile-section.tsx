"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { MeDto } from "@repo/api/client";
import { updateProfileSchema, type UpdateProfileInput } from "@repo/domain";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Spinner } from "@repo/ui/components/spinner";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useMe, useUpdateProfile } from "@/hooks/use-me";
import { showRequestError } from "@/lib/form-errors";

export function ProfileSection({ initialMe }: { initialMe: MeDto }) {
  const { data: me = initialMe } = useMe(initialMe);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Cómo te ven en todas tus organizaciones.</CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm key={me.userName} name={me.userName} email={me.userEmail} />
      </CardContent>
    </Card>
  );
}

function ProfileForm({ name, email }: { name: string; email: string }) {
  const updateProfile = useUpdateProfile();
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    try {
      await updateProfile.mutateAsync(values);
      form.reset(values);
      toast.success("Perfil actualizado");
    } catch (error) {
      showRequestError(error, form.setError);
    }
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor="profile-name">Nombre</FieldLabel>
          <Input id="profile-name" autoComplete="name" {...form.register("name")} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <Input id="profile-email" type="email" value={email} disabled readOnly />
          <FieldDescription>Es el email de tu cuenta y no se puede cambiar acá.</FieldDescription>
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        disabled={updateProfile.isPending || !form.formState.isDirty}
        className="w-fit self-end"
      >
        {updateProfile.isPending ? <Spinner /> : null}
        Guardar
      </Button>
    </form>
  );
}
