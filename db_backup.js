import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL database configuration using environment variable
// This can help with authentication issues
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cafe_menu',
  password: process.env.PGPASSWORD || 'postgres',
  port: 5432,
  // Add SSL options if needed
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
    console.log('💡 Make sure:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. Database "cafe_menu" exists');
    console.log('   3. Password is correct (default: postgres)');
    console.log('   4. Check pg_hba.conf authentication settings');
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

export default pool;
