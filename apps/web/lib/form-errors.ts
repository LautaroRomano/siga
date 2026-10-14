import type { FieldValues, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { RequestError } from "./api-client";

export const showRequestError = <T extends FieldValues>(
  error: unknown,
  setError?: UseFormSetError<T>,
) => {
  if (error instanceof RequestError) {
    error.issues.forEach((issue) => {
      if (setError && issue.path) {
        setError(issue.path as Parameters<UseFormSetError<T>>[0], { message: issue.message });
      }
    });
    toast.error(error.message);
    return;
  }
  toast.error("Ocurrió un error inesperado");
};
