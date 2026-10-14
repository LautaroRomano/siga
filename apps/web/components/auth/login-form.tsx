"use client";

import { authClient, signInWithGoogle } from "@repo/auth/client";
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
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Spinner } from "@repo/ui/components/spinner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { formValue } from "@/lib/form-data";

import { authRouteWithNext, nextRouteOf } from "./auth-routes";
import { GoogleIcon } from "./google-icon";

export function LoginForm() {
  const router = useRouter();
  const next = nextRouteOf(useSearchParams());
  const [pending, setPending] = useState(false);
  const [redirectingToGoogle, setRedirectingToGoogle] = useState(false);
  const busy = pending || redirectingToGoogle;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email: formValue(form, "email"),
      password: formValue(form, "password"),
    });
    if (error) {
      setPending(false);
      toast.error("Email o contraseña incorrectos");
      return;
    }
    router.push(next);
    router.refresh();
  };

  const continueWithGoogle = () => {
    setRedirectingToGoogle(true);
    void signInWithGoogle(next);
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Ingresar</CardTitle>
        <CardDescription>Accedé con tu cuenta de Google o con tu email</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Button variant="outline" type="button" disabled={busy} onClick={continueWithGoogle}>
                {redirectingToGoogle ? <Spinner /> : <GoogleIcon />}
                Continuar con Google
              </Button>
            </Field>
            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              O con tu email
            </FieldSeparator>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field>
              <Button type="submit" disabled={busy}>
                {pending ? <Spinner /> : null}
                Ingresar
              </Button>
              <FieldDescription className="text-center">
                ¿No tenés cuenta?{" "}
                <Link href={authRouteWithNext("/registro", next)}>Registrate</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
