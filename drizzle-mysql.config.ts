import { defineConfig } from "drizzle-kit";

const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  throw new Error(`Missing MySQL environment variables: ${missingVars.join(', ')}`);
}

export default defineConfig({
  out: "./migrations-mysql",
  schema: "./shared/mysql-schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.MYSQL_HOST!,
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
  },
});
