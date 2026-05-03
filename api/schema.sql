-- Schema for Cloudflare D1 Database
-- Ecommerce Dropshipping

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    commission_percent REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

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
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    addresses TEXT DEFAULT '[]',
    auth_id TEXT,
    provider TEXT DEFAULT 'email',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    client_id TEXT,
    supplier_id TEXT,
    status TEXT DEFAULT 'pending',
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping_cost REAL DEFAULT 0,
    total REAL NOT NULL,
    shipping_address TEXT,
    billing_address TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    tracking_number TEXT,
    supplier_order_id TEXT,
    supplier_status TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_order_id ON orders(supplier_order_id);

-- Insert default suppliers
INSERT OR IGNORE INTO suppliers (id, name, slug, commission_percent, is_active) VALUES
    ('supplier-001', 'AliExpress', 'aliexpress', 10, 1),
    ('supplier-002', 'CJDropshipping', 'cjdropshipping', 15, 1),
    ('supplier-003', 'GlobalDropshipping', 'globaldropshipping', 12, 1);

-- Insert sample products
INSERT OR IGNORE INTO products (id, external_id, supplier_id, name, description, price, cost_price, images, category, is_active) VALUES
    ('prod-001', 'aliexpress-001', 'supplier-001', 'Producto de Ejemplo 1', 'Descripción del producto de ejemplo', 29.99, 15.00, '["https://placehold.co/400x400"]', 'electronics', 1),
    ('prod-002', 'aliexpress-002', 'supplier-001', 'Producto de Ejemplo 2', 'Descripción del producto de ejemplo', 19.99, 10.00, '["https://placehold.co/400x400"]', 'home', 1),
    ('prod-003', 'cj-001', 'supplier-002', 'Producto CJ Ejemplo 1', 'Descripción del producto CJ', 35.99, 20.00, '["https://placehold.co/400x400"]', 'clothing', 1),
    ('prod-004', 'cj-002', 'supplier-002', 'Producto CJ Ejemplo 2', 'Descripción del producto CJ', 25.99, 15.00, '["https://placehold.co/400x400"]', 'accessories', 1),
    ('prod-005', 'global-001', 'supplier-003', 'Producto Global Ejemplo 1', 'Descripción del producto Global', 24.99, 12.00, '["https://placehold.co/400x400"]', 'electronics', 1);