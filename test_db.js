import pkg from 'pg';
const { Pool } = pkg;

console.log('🔍 Testing PostgreSQL Connection...\n');

// Test 1: Connect without specifying database
console.log('Test 1: Connecting to PostgreSQL server...');
const testPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  password: 'postgres',
  port: 5432,
});

testPool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ FAILED:', err.message);
    console.log('\n💡 Possible solutions:');
    console.log('   1. Check if PostgreSQL service is running');
    console.log('   2. Verify password in pgAdmin');
    console.log('   3. Check pg_hba.conf authentication settings');
    console.log('   4. Try resetting postgres password');
  } else {
    console.log('✅ SUCCESS: Connected to PostgreSQL!');
    
    // List databases
    try {
      const result = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
      console.log('\n📁 Available databases:');
      result.rows.forEach(row => {
        console.log(`   - ${row.datname}`);
      });
      
      if (!result.rows.some(row => row.datname === 'cafe_menu')) {
        console.log('\n⚠️  Database "cafe_menu" not found!');
        console.log('Run this in pgAdmin: CREATE DATABASE cafe_menu;');
      } else {
        console.log('\n✅ Database "cafe_menu" exists!');
      }
    } catch (dbErr) {
      console.error('Database error:', dbErr.message);
    }
    
    release();
  }
  
  testPool.end();
});
