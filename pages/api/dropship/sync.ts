import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface Supplier {
  id: string;
  name: string;
  slug: string;
  api_key?: string;
  api_secret?: string;
  webhook_url?: string;
}

interface Product {
  id: string;
  external_id?: string;
  supplier_id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  images: string[];
  category?: string;
  is_active: boolean;
}

async function syncAliExpressProducts(supplier: Supplier): Promise<Product[]> {
  if (!supplier.api_key || !supplier.api_secret) {
    throw new Error('API credentials not configured for AliExpress');
  }

  const response = await fetch('https://api.aliexpress.com/product/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supplier.api_key}`,
    },
    body: JSON.stringify({
      method: 'aliexpress.product.list',
      params: {
        page_size: 100,
        page_no: 1,
      },
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch AliExpress products');
  }

  return data.products.map((p: any) => ({
    external_id: p.product_id,
    supplier_id: supplier.id,
    name: p.product_title,
    description: p.description,
    price: parseFloat(p.sale_price) || 0,
    cost_price: parseFloat(p.original_price) || 0,
    images: [p.product_main_image_url, ...(p.product_images || [])].slice(0, 5),
    category: p.category_id,
    is_active: true,
  }));
}

async function syncCJProducts(supplier: Supplier): Promise<Product[]> {
  if (!supplier.api_key) {
    throw new Error('API key not configured for CJ Dropshipping');
  }

  const response = await fetch('https://api.cjdropshipping.com/api/product/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': supplier.api_key,
    },
    body: JSON.stringify({
      pageNum: 1,
      pageSize: 100,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch CJ products');
  }

  return data.products.map((p: any) => ({
    external_id: p.productId,
    supplier_id: supplier.id,
    name: p.productName,
    description: p.productDescription,
    price: p.sellPrice || 0,
    cost_price: p.costPrice || 0,
    images: p.productImageList?.slice(0, 5) || [],
    category: p.categoryName,
    is_active: true,
  }));
}

async function syncGlobalDropshippingProducts(supplier: Supplier): Promise<Product[]> {
  if (!supplier.api_key) {
    throw new Error('API key not configured for Global Dropshipping');
  }

  const response = await fetch(`https://api.globaldropshipping.com/v1/products?limit=100`, {
    headers: {
      'Authorization': `Bearer ${supplier.api_key}`,
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch Global products');
  }

  return data.products.map((p: any) => ({
    external_id: p.id,
    supplier_id: supplier.id,
    name: p.name,
    description: p.description,
    price: p.price,
    cost_price: p.cost_price,
    images: p.images?.slice(0, 5) || [],
    category: p.category,
    is_active: true,
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supplier_id } = req.body;

  if (!supplier_id) {
    return res.status(400).json({ error: 'supplier_id is required' });
  }

  try {
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', supplier_id)
      .single();

    if (supplierError || !supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (!supplier.is_active) {
      return res.status(400).json({ error: 'Supplier is not active' });
    }

    let products: Product[] = [];

    switch (supplier.slug) {
      case 'aliexpress':
        products = await syncAliExpressProducts(supplier);
        break;
      case 'cjdropshipping':
        products = await syncCJProducts(supplier);
        break;
      case 'globaldropshipping':
        products = await syncGlobalDropshippingProducts(supplier);
        break;
      default:
        return res.status(400).json({ error: `Unknown supplier: ${supplier.slug}` });
    }

    const { data: existingProducts } = await supabaseAdmin
      .from('products')
      .select('external_id, id')
      .eq('supplier_id', supplier_id);

    const existingMap = new Map(
      (existingProducts || []).map(p => [p.external_id, p.id])
    );

    const productsToInsert = products.filter(p => !existingMap.has(p.external_id));
    const productsToUpdate = products.filter(p => existingMap.has(p.external_id));

    if (productsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('products')
        .insert(productsToInsert);

      if (insertError) {
        console.error('Error inserting products:', insertError);
      }
    }

    for (const product of productsToUpdate) {
      const existingId = existingMap.get(product.external_id);
      if (existingId) {
        await supabaseAdmin
          .from('products')
          .update({
            name: product.name,
            description: product.description,
            price: product.price,
            cost_price: product.cost_price,
            images: product.images,
            category: product.category,
          })
          .eq('id', existingId);
      }
    }

    return res.status(200).json({
      success: true,
      supplier: supplier.name,
      total_products: products.length,
      new_products: productsToInsert.length,
      updated_products: productsToUpdate.length,
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}