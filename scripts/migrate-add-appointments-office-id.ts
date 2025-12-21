import { mysqlPool, testMySQLConnection } from '../server/mysql-db';

async function columnExists(dbName: string, tableName: string, columnName: string) {
  const [rows] = await mysqlPool.query(
    `
    SELECT COUNT(*) as count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [dbName, tableName, columnName],
  );
  return Number((rows as any[])[0]?.count || 0) > 0;
}

async function getCurrentDatabase(): Promise<string> {
  const [rows] = await mysqlPool.query("SELECT DATABASE() as db");
  const db = (rows as any[])[0]?.db as string | undefined;
  if (!db) throw new Error("Unable to determine current database");
  return db;
}

async function main() {
  console.log('Migrating appointments: add office_id column (if missing)...');

  const connected = await testMySQLConnection();
  if (!connected) {
    console.error('❌ Cannot connect to MySQL database. Check your credentials.');
    process.exit(1);
  }

  const dbName = await getCurrentDatabase();

  const exists = await columnExists(dbName, 'appointments', 'office_id');
  if (exists) {
    console.log('✅ appointments.office_id already exists. No changes needed.');
    process.exit(0);
  }

  await mysqlPool.query(`ALTER TABLE appointments ADD COLUMN office_id VARCHAR(36) NULL`);
  console.log('✅ Added appointments.office_id');
}

main()
  .then(async () => {
    await mysqlPool.end();
    console.log('✅ Migration complete');
  })
  .catch(async (err) => {
    console.error('❌ Migration failed:', err);
    try {
      await mysqlPool.end();
    } catch {
      // ignore
    }
    process.exit(1);
  });

