export const REQUIRED_MYSQL_ENV_VARS = [
  "MYSQL_HOST",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
] as const;

export function isMySQLConfigured(): boolean {
  return REQUIRED_MYSQL_ENV_VARS.every((k) => {
    const v = process.env[k];
    return typeof v === "string" && v.trim().length > 0;
  });
}

