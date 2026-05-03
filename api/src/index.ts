export interface Env {
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ALIEXPRESS_API_KEY: string;
  ALIEXPRESS_API_SECRET: string;
  CJ_DROPSHIPPING_API_KEY: string;
  GLOBAL_DROPSHIPPING_API_KEY: string;
  STRIPE_SECRET_KEY: string;
}

interface Product {
  id: string;
  external_id: string | null;
  supplier_id: string | null;
  name: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  images: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: string;
  name: string;
  slug: string;
  api_key: string | null;
  api_secret: string | null;
  webhook_url: string | null;
  commission_percent: number;
  is_active: boolean;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

async function supabaseFetch(env: Env, endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${error}`);
  }
  
  return response.json();
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    if (path.startsWith('/api/products')) {
      return await handleProducts(request, env, path);
    } else if (path.startsWith('/api/suppliers')) {
      return await handleSuppliers(request, env, path);
    } else if (path.startsWith('/api/dropship/sync')) {
      return await handleDropshipSync(request, env);
    } else if (path.startsWith('/api/dropship/create-order')) {
      return await handleDropshipCreateOrder(request, env);
    } else if (path.startsWith('/api/dropship/webhook')) {
      return await handleDropshipWebhook(request, env);
    } else if (path.startsWith('/api/payment/create-intent')) {
      return await handleCreatePaymentIntent(request, env);
    } else if (path === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: String(error) }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }
}

// ============ PRODUCTS (D1) ============

async function handleProducts(request: Request, env: Env, path: string): Promise<Response> {
  const method = request.method;
  const id = path.split('/').pop();

  if (method === 'GET') {
    if (id && id !== 'products') {
      const result = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>();
      if (!result) {
        return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const limit = url.searchParams.get('limit') || '50';
    const offset = url.searchParams.get('offset') || '0';

    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(result.results), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO products (id, external_id, supplier_id, name, description, price, cost_price, images, category, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.external_id || null,
      body.supplier_id || null,
      body.name,
      body.description || null,
      body.price || 0,
      body.cost_price || null,
      JSON.stringify(body.images || []),
      body.category || null,
      body.is_active !== false ? 1 : 0,
      now,
      now
    ).run();

    const product = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>();
    return new Response(JSON.stringify(product), { status: 201, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  if (method === 'PUT' && id) {
    const body = await request.json();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      UPDATE products SET
        external_id = COALESCE(?, external_id),
        supplier_id = COALESCE(?, supplier_id),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        cost_price = COALESCE(?, cost_price),
        images = COALESCE(?, images),
        category = COALESCE(?, category),
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.external_id,
      body.supplier_id,
      body.name,
      body.description,
      body.price,
      body.cost_price,
      body.images ? JSON.stringify(body.images) : null,
      body.category,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : null,
      now,
      id
    ).run();

    const product = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>();
    return new Response(JSON.stringify(product), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  if (method === 'DELETE' && id) {
    await env.DB.prepare('UPDATE products SET is_active = 0 WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders() });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
}

// ============ SUPPLIERS (Supabase) ============

async function handleSuppliers(request: Request, env: Env, path: string): Promise<Response> {
  const method = request.method;
  const id = path.split('/').pop();

  if (method === 'GET') {
    try {
      if (id && id !== 'suppliers') {
        const result = await supabaseFetch(env, `suppliers?id=eq.${id}&select=*`);
        if (!result || result.length === 0) {
          return new Response(JSON.stringify({ error: 'Supplier not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(result[0]), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
      }

      const result = await supabaseFetch(env, 'suppliers?select=*&is_active=eq.true');
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Supabase suppliers error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch suppliers' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
}

// ============ DROPSHIP SYNC ============

async function handleDropshipSync(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }

  const body = await request.json();
  const { supplier_id } = body;

  if (!supplier_id) {
    return new Response(JSON.stringify({ error: 'supplier_id is required' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  let supplier: Supplier;
  try {
    const result = await supabaseFetch(env, `suppliers?id=eq.${supplier_id}&select=*`);
    if (!result || result.length === 0) {
      return new Response(JSON.stringify({ error: 'Supplier not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    }
    supplier = result[0];
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch supplier from Supabase' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  let products: any[] = [];

  switch (supplier.slug) {
    case 'aliexpress':
      products = await syncAliExpress(env, supplier);
      break;
    case 'cjdropshipping':
      products = await syncCJ(env, supplier);
      break;
    case 'globaldropshipping':
      products = await syncGlobalDropshipping(env, supplier);
      break;
    default:
      return new Response(JSON.stringify({ error: `Unknown supplier: ${supplier.slug}` }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  let newCount = 0;
  let updateCount = 0;

  for (const product of products) {
    const existing = await env.DB.prepare('SELECT id FROM products WHERE external_id = ? AND supplier_id = ?')
      .bind(product.external_id, supplier_id)
      .first<{ id: string }>();

    if (existing) {
      await env.DB.prepare(`
        UPDATE products SET name = ?, description = ?, price = ?, cost_price = ?, images = ?, category = ?, updated_at = ?
        WHERE id = ?
      `).bind(product.name, product.description, product.price, product.cost_price, JSON.stringify(product.images), product.category, new Date().toISOString(), existing.id).run();
      updateCount++;
    } else {
      const id = generateUUID();
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO products (id, external_id, supplier_id, name, description, price, cost_price, images, category, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, product.external_id, supplier_id, product.name, product.description, product.price, product.cost_price, JSON.stringify(product.images), product.category, 1, now, now).run();
      newCount++;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    supplier: supplier.name,
    total_products: products.length,
    new_products: newCount,
    updated_products: updateCount,
  }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
}

async function syncAliExpress(env: Env, supplier: Supplier): Promise<any[]> {
  if (!env.ALIEXPRESS_API_KEY) {
    console.log('AliExpress API key not configured, returning mock data');
    return [
      { external_id: 'aliexpress-001', name: 'Producto AliExpress Ejemplo 1', description: 'Descripción del producto', price: 29.99, cost_price: 15.00, images: ['https://placehold.co/400x400'], category: 'electronics' },
      { external_id: 'aliexpress-002', name: 'Producto AliExpress Ejemplo 2', description: 'Descripción del producto', price: 19.99, cost_price: 10.00, images: ['https://placehold.co/400x400'], category: 'home' },
    ];
  }

  try {
    const response = await fetch('https://api.aliexpress.com/product/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.ALIEXPRESS_API_KEY}` },
      body: JSON.stringify({ method: 'aliexpress.product.list', params: { page_size: 100, page_no: 1 } }),
    });
    const data = await response.json();
    if (data.success && data.products) {
      return data.products.map((p: any) => ({
        external_id: p.product_id,
        name: p.product_title,
        description: p.description,
        price: parseFloat(p.sale_price) || 0,
        cost_price: parseFloat(p.original_price) || 0,
        images: [p.product_main_image_url, ...(p.product_images || [])].slice(0, 5),
        category: p.category_id,
      }));
    }
  } catch (error) {
    console.error('AliExpress sync error:', error);
  }
  return [];
}

async function syncCJ(env: Env, supplier: Supplier): Promise<any[]> {
  if (!env.CJ_DROPSHIPPING_API_KEY) {
    console.log('CJ API key not configured, returning mock data');
    return [
      { external_id: 'cj-001', name: 'Producto CJ Ejemplo 1', description: 'Descripción del producto', price: 35.99, cost_price: 20.00, images: ['https://placehold.co/400x400'], category: 'clothing' },
      { external_id: 'cj-002', name: 'Producto CJ Ejemplo 2', description: 'Descripción del producto', price: 25.99, cost_price: 15.00, images: ['https://placehold.co/400x400'], category: 'accessories' },
    ];
  }

  try {
    const response = await fetch('https://api.cjdropshipping.com/api/product/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': env.CJ_DROPSHIPPING_API_KEY },
      body: JSON.stringify({ pageNum: 1, pageSize: 100 }),
    });
    const data = await response.json();
    if (data.success && data.products) {
      return data.products.map((p: any) => ({
        external_id: p.productId,
        name: p.productName,
        description: p.productDescription,
        price: p.sellPrice || 0,
        cost_price: p.costPrice || 0,
        images: p.productImageList?.slice(0, 5) || [],
        category: p.categoryName,
      }));
    }
  } catch (error) {
    console.error('CJ sync error:', error);
  }
  return [];
}

async function syncGlobalDropshipping(env: Env, supplier: Supplier): Promise<any[]> {
  if (!env.GLOBAL_DROPSHIPPING_API_KEY) {
    console.log('Global API key not configured, returning mock data');
    return [
      { external_id: 'global-001', name: 'Producto Global Ejemplo 1', description: 'Descripción del producto', price: 24.99, cost_price: 12.00, images: ['https://placehold.co/400x400'], category: 'electronics' },
    ];
  }

  try {
    const response = await fetch('https://api.globaldropshipping.com/v1/products?limit=100', {
      headers: { 'Authorization': `Bearer ${env.GLOBAL_DROPSHIPPING_API_KEY}` },
    });
    const data = await response.json();
    if (data.success && data.products) {
      return data.products.map((p: any) => ({
        external_id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        cost_price: p.cost_price,
        images: p.images?.slice(0, 5) || [],
        category: p.category,
      }));
    }
  } catch (error) {
    console.error('Global sync error:', error);
  }
  return [];
}

// ============ CREATE ORDER (Supabase) ============

async function handleDropshipCreateOrder(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }

  const body = await request.json();
  const { order_id } = body;

  if (!order_id) {
    return new Response(JSON.stringify({ error: 'order_id is required' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  let order: any;
  try {
    const result = await supabaseFetch(env, `orders?id=eq.${order_id}&select=*,suppliers(name,slug,api_key)`);
    if (!result || result.length === 0) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    }
    order = result[0];
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch order from Supabase' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  if (order.supplier_order_id) {
    return new Response(JSON.stringify({ error: 'Order already sent to supplier' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  const supplier = order.suppliers;
  const supplierSlug = supplier?.slug || '';
  const supplierApiKey = supplier?.api_key || '';

  let supplierOrderId = '';
  let supplierStatus = 'processing';

  switch (supplierSlug) {
    case 'aliexpress':
      if (!env.ALIEXPRESS_API_KEY && !supplierApiKey) {
        supplierOrderId = `AE-${Date.now()}`;
      }
      break;
    case 'cjdropshipping':
      if (!env.CJ_DROPSHIPPING_API_KEY && !supplierApiKey) {
        supplierOrderId = `CJ-${Date.now()}`;
      }
      break;
    case 'globaldropshipping':
      if (!env.GLOBAL_DROPSHIPPING_API_KEY && !supplierApiKey) {
        supplierOrderId = `GD-${Date.now()}`;
      }
      break;
  }

  try {
    await supabaseFetch(env, `orders?id=eq.${order_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        supplier_order_id: supplierOrderId,
        supplier_status: supplierStatus,
        status: 'processing',
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update order in Supabase' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({
    success: true,
    supplier_order_id: supplierOrderId,
    status: supplierStatus,
  }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
}

// ============ WEBHOOK (Supabase) ============

async function handleDropshipWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }

  const payload = await request.json();
  const { supplier_order_id, status, tracking_number, estimated_delivery } = payload;

  if (!supplier_order_id || !status) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  const statusMap: Record<string, string> = {
    pending: 'pending',
    paid: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
    refunded: 'refunded',
  };

  const mappedStatus = statusMap[status] || 'pending';

  try {
    await supabaseFetch(env, `orders?supplier_order_id=eq.${supplier_order_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        supplier_status: status,
        status: mappedStatus,
        tracking_number: tracking_number || null,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update order in Supabase' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true, message: 'Webhook processed' }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
}

// ============ STRIPE PAYMENT ============

async function handleCreatePaymentIntent(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }

  if (!env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  const body = await request.json();
  const { amount, currency = 'usd', order_id, email } = body;

  if (!amount) {
    return new Response(JSON.stringify({ error: 'amount is required' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }

  try {
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)),
        currency,
        'metadata[order_id]': order_id || '',
        'metadata[email]': email || '',
      }),
    });

    const paymentIntent = await stripeResponse.json();

    if (paymentIntent.error) {
      return new Response(JSON.stringify({ error: paymentIntent.error.message }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Stripe error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create payment intent' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  }
}

export default {
  fetch: handleRequest,
};