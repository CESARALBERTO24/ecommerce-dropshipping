import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Supplier {
  id: string;
  name: string;
  slug: string;
  api_key?: string;
  api_secret?: string;
  webhook_url?: string;
  commission_percent: number;
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  addresses: any[];
  auth_id?: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  supplier_id: string;
  status: string;
  items: any[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address?: any;
  billing_address?: any;
  payment_status: string;
  payment_method?: string;
  tracking_number?: string;
  supplier_order_id?: string;
  supplier_status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  suppliers?: { name: string } | any;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  supplier_id: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}