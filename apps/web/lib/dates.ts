import { format } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (value: Date | string, pattern = "d MMM yyyy") =>
  format(new Date(value), pattern, { locale: es });

export const formatDateTime = (value: Date | string) => formatDate(value, "d MMM yyyy, HH:mm");
