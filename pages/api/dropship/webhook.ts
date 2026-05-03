import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface WebhookPayload {
  supplier_order_id: string;
  status: string;
  tracking_number?: string;
  tracking_url?: string;
  estimated_delivery?: string;
}

function mapSupplierStatus(supplier: string, status: string): string {
  const statusMap: Record<string, Record<string, string>> = {
    aliexpress: {
      'pending': 'pending',
      'paid': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
    },
    cjdropshipping: {
      'unpaid': 'pending',
      'paid': 'processing',
      'warehouse_received': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
    },
    globaldropshipping: {
      'pending': 'pending',
      'processing': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
    },
  };

  return statusMap[supplier]?.[status] || 'pending';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-webhook-signature'] as string;

  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  try {
    const payload = req.body as WebhookPayload;

    const { supplier_order_id, status, tracking_number, tracking_url, estimated_delivery } = payload;

    if (!supplier_order_id || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, suppliers(slug)')
      .eq('supplier_order_id', supplier_order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const supplierSlug = (order.suppliers as any)?.slug || '';

    const mappedStatus = mapSupplierStatus(supplierSlug, status);

    const updateData: any = {
      supplier_status: status,
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    };

    if (tracking_number) {
      updateData.tracking_number = tracking_number;
    }

    if (estimated_delivery) {
      updateData.notes = `Estimated delivery: ${estimated_delivery}`;
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}