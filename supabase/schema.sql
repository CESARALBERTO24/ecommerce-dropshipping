-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Products table (if not exists)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2),
    images JSONB DEFAULT '[]',
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Product policies
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "products_supplier_manage" ON products FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM suppliers WHERE id = products.supplier_id AND auth.uid()::text = id::text)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert sample products for testing
INSERT INTO products (name, description, price, supplier_id, category, images, is_active)
SELECT 
    p.name,
    p.description,
    p.price,
    s.id,
    p.category,
    p.images::jsonb,
    true
FROM (
    VALUES
    ('Producto de Ejemplo 1', 'Descripción del producto 1', 29.99, 'electronics', '["https://placehold.co/400x400"]'),
    ('Producto de Ejemplo 2', 'Descripción del producto 2', 49.99, 'clothing', '["https://placehold.co/400x400"]'),
    ('Producto de Ejemplo 3', 'Descripción del producto 3', 19.99, 'home', '["https://placehold.co/400x400"]')
) AS p(name, description, price, category, images)
CROSS JOIN (SELECT id FROM suppliers WHERE slug = 'aliexpress' LIMIT 1) AS s
ON CONFLICT DO NOTHING;