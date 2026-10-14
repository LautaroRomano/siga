import { Google_Sans } from "next/font/google";

// next/font/google compila esta llamada en build time: sus valores deben ser
// literales, así que la variable no puede reutilizarse acá (sí más abajo).
// Google Sans no tiene métricas de adjustFontFallback en next/font todavía,
// así que el fallback de sistema es explícito para que el primer render no
// dependa de que el navegador elija uno por su cuenta.
export const googleSans = Google_Sans({
  weight: "variable",
  style: "normal",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  variable: "--font-google-sans",
});

export const GOOGLE_SANS_VARIABLE = "--font-google-sans";
