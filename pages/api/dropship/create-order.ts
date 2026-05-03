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
  commission_percent: number;
}

interface OrderItem {
  product_id: string;
  external_product_id?: string;
  name: string;
  price: number;
  quantity: number;
  variant_id?: string;
  image?: string;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

async function createAliExpressOrder(
  supplier: Supplier,
  items: OrderItem[],
  shippingAddress: ShippingAddress,
  orderId: string
): Promise<{ supplier_order_id: string; status: string }> {
  if (!supplier.api_key) {
    throw new Error('API key not configured');
  }

  const lineItems = items.map(item => ({
    product_id: item.external_product_id || item.product_id,
    quantity: item.quantity,
    sku_id: item.variant_id,
  }));

  const response = await fetch('https://api.aliexpress.com/order/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supplier.api_key}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      items: lineItems,
      shipping_address: {
        recipient_name: shippingAddress.name,
        address_line1: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
      },
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to create AliExpress order');
  }

  return {
    supplier_order_id: data.order_id,
    status: 'processing',
  };
}

async function createCJOrder(
  supplier: Supplier,
  items: OrderItem[],
  shippingAddress: ShippingAddress,
  orderId: string
): Promise<{ supplier_order_id: string; status: string }> {
  if (!supplier.api_key) {
    throw new Error('API key not configured');
  }

  const orderItems = items.map(item => ({
    pid: item.external_product_id || item.product_id,
    quantity: item.quantity,
    sid: item.variant_id,
  }));

  const response = await fetch('https://api.cjdropshipping.com/api/order/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': supplier.api_key,
    },
    body: JSON.stringify({
      ordersn: orderId,
      items: orderItems,
      address: {
        name: shippingAddress.name,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
      },
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to create CJ order');
  }

  return {
    supplier_order_id: data.orderNumber,
    status: 'processing',
  };
}

async function createGlobalDropshippingOrder(
  supplier: Supplier,
  items: OrderItem[],
  shippingAddress: ShippingAddress,
  orderId: string
): Promise<{ supplier_order_id: string; status: string }> {
  if (!supplier.api_key) {
    throw new Error('API key not configured');
  }

  const response = await fetch('https://api.globaldropshipping.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supplier.api_key}`,
    },
    body: JSON.stringify({
      reference_id: orderId,
      items: items.map(item => ({
        product_id: item.external_product_id || item.product_id,
        quantity: item.quantity,
        variant_id: item.variant_id,
      })),
      shipping_address: shippingAddress,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to create Global Dropshipping order');
  }

  return {
    supplier_order_id: data.order_id,
    status: data.status,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, suppliers(*)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.supplier_order_id) {
      return res.status(400).json({ error: 'Order already sent to supplier' });
    }

    const supplier = order.suppliers as Supplier;
    const items = order.items as OrderItem[];
    const shippingAddress = order.shipping_address as ShippingAddress;

    let result: { supplier_order_id: string; status: string };

    switch (supplier.slug) {
      case 'aliexpress':
        result = await createAliExpressOrder(supplier, items, shippingAddress, order.order_number);
        break;
      case 'cjdropshipping':
        result = await createCJOrder(supplier, items, shippingAddress, order.order_number);
        break;
      case 'globaldropshipping':
        result = await createGlobalDropshippingOrder(supplier, items, shippingAddress, order.order_number);
        break;
      default:
        return res.status(400).json({ error: `Unknown supplier: ${supplier.slug}` });
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        supplier_order_id: result.supplier_order_id,
        supplier_status: result.status,
        status: 'processing',
      })
      .eq('id', order_id);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      supplier_order_id: result.supplier_order_id,
      status: result.status,
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}