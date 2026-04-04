import pkg from 'pg';
import { hashPassword } from './utils/password.js';

const { Pool } = pkg;

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cafe_menu',
  password: process.env.DB_PASSWORD || 'admin',
  port: Number(process.env.DB_PORT || 5432),
};

const pool = new Pool(dbConfig);

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log('Successfully connected to PostgreSQL database');
  } finally {
    client.release();
  }
}

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cafes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      plan TEXT DEFAULT 'free',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS cafe_id INTEGER,
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other',
      ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS cafe_id INTEGER,
      ADD COLUMN IF NOT EXISTS table_id INTEGER,
      ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
  `);

  await pool.query(`
    ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS price INTEGER;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tables (
      id SERIAL PRIMARY KEY,
      cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      number INTEGER NOT NULL,
      label TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS themes (
      id SERIAL PRIMARY KEY,
      cafe_id INTEGER NOT NULL UNIQUE REFERENCES cafes(id) ON DELETE CASCADE,
      brand_color TEXT DEFAULT '#c8773a',
      bg_color TEXT DEFAULT '#f7f4f0',
      surface_color TEXT DEFAULT '#ffffff',
      text_color TEXT DEFAULT '#1a1714',
      font_family TEXT DEFAULT 'DM Sans',
      logo_url TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_cafe ON menu_items(cafe_id);
    CREATE INDEX IF NOT EXISTS idx_orders_cafe ON orders(cafe_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_tables_cafe ON tables(cafe_id);
  `);
}

async function ensureDefaultCafe() {
  const existing = await pool.query('SELECT id, name, email FROM cafes ORDER BY id LIMIT 1');
  if (existing.rows.length > 0) return existing.rows[0];

  const passwordHash = await hashPassword(process.env.DEFAULT_CAFE_PASSWORD || 'admin123');
  const result = await pool.query(
    `INSERT INTO cafes (name, email, password_hash, plan)
     VALUES ($1, $2, $3, 'starter')
     RETURNING id, name, email`,
    [
      process.env.DEFAULT_CAFE_NAME || 'My Cafe',
      process.env.DEFAULT_CAFE_EMAIL || 'owner@mycafe.local',
      passwordHash,
    ]
  );
  return result.rows[0];
}

async function migrateLegacyData(defaultCafeId) {
  await pool.query('UPDATE menu_items SET cafe_id = $1 WHERE cafe_id IS NULL', [defaultCafeId]);
  await pool.query('UPDATE orders SET cafe_id = $1 WHERE cafe_id IS NULL', [defaultCafeId]);
  await pool.query(`
    UPDATE order_items oi
    SET price = mi.price
    FROM menu_items mi
    WHERE oi.menu_item_id = mi.id AND oi.price IS NULL;
  `);
}

async function syncLegacyTheme(defaultCafeId) {
  const result = await pool.query('SELECT 1 FROM themes WHERE cafe_id = $1', [defaultCafeId]);
  if (result.rows.length > 0) return;

  await pool.query(
    `INSERT INTO themes (cafe_id)
     VALUES ($1)
     ON CONFLICT (cafe_id) DO NOTHING`,
    [defaultCafeId]
  );
}

async function ensureCafeTables(defaultCafeId) {
  const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM tables WHERE cafe_id = $1', [defaultCafeId]);
  if (countResult.rows[0].count === 0) {
    for (let tableNumber = 1; tableNumber <= 5; tableNumber += 1) {
      await pool.query(
        'INSERT INTO tables (cafe_id, number, label) VALUES ($1, $2, $3)',
        [defaultCafeId, tableNumber, `Table ${tableNumber}`]
      );
    }
  }

  await pool.query(`
    UPDATE orders o
    SET table_id = t.id
    FROM tables t
    WHERE o.table_id IS NULL
      AND o.cafe_id = t.cafe_id
      AND o.table_number = t.number;
  `);
}

async function initializeDatabase() {
  try {
    await testConnection();
    await runMigrations();
    const defaultCafe = await ensureDefaultCafe();
    await migrateLegacyData(defaultCafe.id);
    await syncLegacyTheme(defaultCafe.id);
    await ensureCafeTables(defaultCafe.id);
    pool.defaultCafeId = defaultCafe.id;
    pool.defaultCafeName = defaultCafe.name;
    pool.defaultCafeEmail = defaultCafe.email;
    console.log(`Default cafe ready: ${defaultCafe.name} (${defaultCafe.email})`);
    return pool;
  } catch (error) {
    console.error('Failed to initialize PostgreSQL:', error.message);
    console.log('Please check:');
    console.log('1. PostgreSQL is running');
    console.log(`2. Database "${dbConfig.database}" exists`);
    console.log(`3. Password "${dbConfig.password}" is correct for user "${dbConfig.user}"`);
    throw error;
  }
}

const dbPool = await initializeDatabase().catch((err) => {
  console.error('Fatal: Could not connect to database. Shutting down.', err.message);
  process.exit(1);
});

export default dbPool;
