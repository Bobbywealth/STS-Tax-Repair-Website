import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

// Field mapping from Elementor form to CRM
const FIELD_MAP: Record<string, string> = {
  'name': 'firstName',
  'field_0d82336': 'lastName',
  'email': 'email',
  'field_fa1586e': 'phone',
  'field_8b9c348': 'address',
  'field_c0dda29': 'city',
  'field_515e12c': 'state',
  'field_de998e6': 'zipCode',
  'field_d9b2bb8': 'country',
  'field_aa07ae1': 'clientType',
  'message': 'notes',
};

interface SubmissionData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  clientType?: string;
  notes?: string;
}

async function migrateClients() {
  console.log('🚀 Starting client migration from Elementor submissions...\n');
  
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  
  const conn = await pool.getConnection();
  
  try {
    // Get all submissions
    const [submissions] = await conn.query(
      'SELECT id, form_name, user_ip, created_at FROM wp_644e_submissions ORDER BY created_at ASC'
    ) as any[];
    
    console.log(`📊 Found ${submissions.length} submissions to migrate\n`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const sub of submissions) {
      try {
        // Get all field values for this submission
        const [values] = await conn.query(
          'SELECT `key`, value FROM wp_644e_submissions_values WHERE submission_id = ?',
          [sub.id]
        ) as any[];
        
        // Map fields to our schema
        const data: SubmissionData = {};
        for (const val of values) {
          const mappedField = FIELD_MAP[val.key];
          if (mappedField && val.value) {
            (data as any)[mappedField] = val.value;
          }
        }
        
        // Skip if no email (can't create user without identifier)
        if (!data.email) {
          skipped++;
          continue;
        }
        
        // Check if user with this email already exists
        const [existing] = await conn.query(
          'SELECT id FROM users WHERE email = ? OR original_submission_id = ?',
          [data.email, sub.id]
        ) as any[];
        
        if (existing.length > 0) {
          skipped++;
          continue;
        }
        
        // Insert new user
        const userId = randomUUID();
        await conn.query(
          `INSERT INTO users (
            id, email, first_name, last_name, phone, address, city, state, 
            zip_code, country, client_type, notes, original_submission_id, 
            referral_source, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            data.email,
            data.firstName || null,
            data.lastName || null,
            data.phone || null,
            data.address || null,
            data.city || null,
            data.state || null,
            data.zipCode || null,
            data.country || null,
            data.clientType || null,
            data.notes || null,
            sub.id,
            sub.form_name || null,
            sub.created_at || new Date(),
            new Date()
          ]
        );
        
        migrated++;
        
        // Progress update every 50 clients
        if (migrated % 50 === 0) {
          console.log(`  ✅ Migrated ${migrated} clients...`);
        }
        
      } catch (err: any) {
        errors++;
        if (errors <= 5) {
          console.log(`  ❌ Error on submission ${sub.id}:`, err.message);
        }
      }
    }
    
    console.log('\n📈 Migration Complete!');
    console.log(`  ✅ Migrated: ${migrated} clients`);
    console.log(`  ⏭️  Skipped: ${skipped} (no email or already exists)`);
    console.log(`  ❌ Errors: ${errors}`);
    
    // Show final count
    const [[countResult]] = await conn.query('SELECT COUNT(*) as count FROM users') as any[];
    console.log(`\n📊 Total users in CRM: ${countResult.count}`);
    
  } finally {
    conn.release();
    await pool.end();
  }
}

// Run migration
migrateClients().catch(console.error);
