-- Schema for Cloudflare D1 Database
-- Ecommerce Dropshipping
-- Solo tabla de productos aquí - el resto está en Supabase

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    external_id TEXT,
    supplier_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    cost_price REAL,
    images TEXT DEFAULT '[]',
    category TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id);

-- Insert sample products
INSERT OR IGNORE INTO products (id, external_id, supplier_id, name, description, price, cost_price, images, category, is_active) VALUES
    ('prod-001', 'aliexpress-001', 'supplier-001', 'Producto de Ejemplo 1', 'Descripción del producto de ejemplo', 29.99, 15.00, '["https://placehold.co/400x400"]', 'electronics', 1),
    ('prod-002', 'aliexpress-002', 'supplier-001', 'Producto de Ejemplo 2', 'Descripción del producto de ejemplo', 19.99, 10.00, '["https://placehold.co/400x400"]', 'home', 1),
    ('prod-003', 'cj-001', 'supplier-002', 'Producto CJ Ejemplo 1', 'Descripción del producto CJ', 35.99, 20.00, '["https://placehold.co/400x400"]', 'clothing', 1),
    ('prod-004', 'cj-002', 'supplier-002', 'Producto CJ Ejemplo 2', 'Descripción del producto CJ', 25.99, 15.00, '["https://placehold.co/400x400"]', 'accessories', 1),
    ('prod-005', 'global-001', 'supplier-003', 'Producto Global Ejemplo 1', 'Descripción del producto Global', 24.99, 12.00, '["https://placehold.co/400x400"]', 'electronics', 1);