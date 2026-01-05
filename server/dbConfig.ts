export const REQUIRED_MYSQL_ENV_VARS = [
  "MYSQL_HOST",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
] as const;

export type MySQLConnectionConfig = {
  host: string;
  database: string;
  user: string;
  password: string;
  port: number;
};

function parseMySQLUrl(urlString: string): MySQLConnectionConfig | null {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "mysql:") return null;

    const database = url.pathname?.replace(/^\//, "") || "";
    if (!database) return null;

    const port = url.port ? Number.parseInt(url.port, 10) : 3306;
    if (!Number.isFinite(port) || port <= 0) return null;

    return {
      host: url.hostname,
      database,
      user: decodeURIComponent(url.username || ""),
      password: decodeURIComponent(url.password || ""),
      port,
    };
  } catch {
    return null;
  }
}

export function getMySQLConfigFromEnv(): MySQLConnectionConfig | null {
  // Prefer explicit MYSQL_* variables if present.
  if (REQUIRED_MYSQL_ENV_VARS.every((k) => (process.env[k] || "").trim().length > 0)) {
    return {
      host: process.env.MYSQL_HOST!.trim(),
      database: process.env.MYSQL_DATABASE!.trim(),
      user: process.env.MYSQL_USER!.trim(),
      password: process.env.MYSQL_PASSWORD!.trim(),
      port: Number.parseInt(process.env.MYSQL_PORT || "3306", 10),
    };
  }

  // Fallback to DATABASE_URL (mysql://user:pass@host:port/dbname)
  const databaseUrl = (process.env.DATABASE_URL || "").trim();
  if (databaseUrl) return parseMySQLUrl(databaseUrl);

  return null;
}

export function isMySQLConfigured(): boolean {
  return getMySQLConfigFromEnv() !== null;
}

