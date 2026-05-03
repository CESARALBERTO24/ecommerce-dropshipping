-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Supabase Auth: Los usuarios se gestionan automáticamente en auth.users

-- Clients table ( customers para pedidos )
-- Los clientes se crean automáticamente en el callback de OAuth
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    addresses JSONB DEFAULT '[]',
    auth_id TEXT UNIQUE,
    provider TEXT DEFAULT 'email',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Client policies
CREATE POLICY "clients_own_read" ON clients FOR SELECT USING (
    auth.uid()::text = auth_id OR auth.role() = 'authenticated'
);

CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (
    auth.uid()::text = auth_id OR auth.role() = 'authenticated'
);

CREATE POLICY "clients_update" ON clients FOR UPDATE USING (
    auth.uid()::text = auth_id OR auth.role() = 'authenticated'
);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for clients
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXecute FUNCTION update_updated_at();

-- Tabla de pedidos (se guarda en Supabase)
-- Los pedidos se crean en el checkout y se guardan en Supabase
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    supplier_id TEXT REFERENCES suppliers(id),
    status TEXT DEFAULT 'pending',
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping_cost NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    tracking_number TEXT,
    supplier_order_id TEXT,
    supplier_status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Order policies
CREATE POLICY "orders_own_read" ON orders FOR SELECT USING (
    auth.uid()::text = client_id::text OR auth.role() = 'authenticated'
);

CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_update" ON orders FOR UPDATE USING (
    auth.uid()::text = client_id::text OR auth.role() = 'authenticated'
);

-- Trigger for orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabla de proveedores (solo para referencia, los productos están en Cloudflare D1)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    commission_percent NUMERIC(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Supplier policies
CREATE POLICY "suppliers_public_read" ON suppliers FOR SELECT USING (is_active = true);

-- Insert default suppliers (coincide con Cloudflare D1)
INSERT INTO suppliers (id, name, slug, commission_percent, is_active) VALUES
    ('supplier-001', 'AliExpress', 'aliexpress', 10, true),
    ('supplier-002', 'CJDropshipping', 'cjdropshipping', 15, true),
    ('supplier-003', 'GlobalDropshipping', 'globaldropshipping', 12, true)
ON CONFLICT (id) DO NOTHING;

-- Función para generar número de pedido
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE order_count INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO order_count FROM orders;
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar order_number
CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();