const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
};

export const authEnv = {
  secret: required("BETTER_AUTH_SECRET"),
  baseUrl: required("BETTER_AUTH_URL"),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Better Auth limita a 3 registros e inicios de sesión cada 10 segundos en producción;
  // los e2e registran un usuario por test contra un build de producción y lo apagan.
  rateLimitEnabled: process.env.AUTH_RATE_LIMIT !== "off",
};
