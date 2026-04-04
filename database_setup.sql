-- QR Cafe SaaS schema with compatibility for migrated single-cafe data.
-- Existing projects can keep using database name cafe_menu.

CREATE TABLE IF NOT EXISTS cafes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  label TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  cafe_id INTEGER,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'Other',
  available BOOLEAN DEFAULT TRUE,
  is_trending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  cafe_id INTEGER,
  table_id INTEGER,
  table_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  whatsapp_number TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_menu_items_cafe ON menu_items(cafe_id);
CREATE INDEX IF NOT EXISTS idx_orders_cafe ON orders(cafe_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tables_cafe ON tables(cafe_id);
