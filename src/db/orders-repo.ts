import { supabase } from './client.js';
import type { OrderDraft, OrderRecord, OrderStatus } from '../types/index.js';

export interface CreateOrderInput {
  telegram_user_id: number;
  customer_name: string | null;
  username: string | null;
  service_key: string;
  draft: OrderDraft;
  price_min: number;
  price_max: number;
  final_price: number | null;
}

export async function getNextOrderNumber(): Promise<number> {
  const { data, error } = await supabase.rpc('next_order_number');
  if (error || typeof data !== 'number') {
    throw new Error(`Failed to allocate order number: ${error?.message}`);
  }
  return data;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  const orderNumber = await getNextOrderNumber();
  const d = input.draft;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      telegram_user_id: input.telegram_user_id,
      customer_name: input.customer_name,
      username: input.username,
      service_key: input.service_key,
      project_name: d.project_name ?? null,
      project_field: d.project_field ?? null,
      idea_description: d.idea_description ?? null,
      wants_colors: d.wants_colors ?? null,
      colors_text: d.colors_text ?? null,
      has_references: d.has_references ?? null,
      usage_notes: d.usage_notes ?? null,
      size_choice: d.size_choice ?? null,
      custom_size: d.custom_size ?? null,
      price_min: input.price_min,
      price_max: input.price_max,
      final_price: input.final_price,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create order: ${error?.message}`);
  }
  return data as OrderRecord;
}

export async function getOrdersByUser(telegramUserId: number): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as OrderRecord[];
}

export async function getOrderByNumber(orderNumber: number): Promise<OrderRecord | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();

  if (error || !data) return null;
  return data as OrderRecord;
}

export async function getOrdersByCustomerName(nameQuery: string): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .ilike('customer_name', `%${nameQuery}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data as OrderRecord[];
}

export async function getAllOrders(limit = 20): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as OrderRecord[];
}

export async function getNewOrders(): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as OrderRecord[];
}

export async function updateOrderStatus(
  orderNumber: number,
  status: OrderStatus,
): Promise<OrderRecord | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('order_number', orderNumber)
    .select('*')
    .single();

  if (error || !data) return null;
  return data as OrderRecord;
}

export async function updateOrderPrice(
  orderNumber: number,
  finalPrice: number,
): Promise<OrderRecord | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ final_price: finalPrice, updated_at: new Date().toISOString() })
    .eq('order_number', orderNumber)
    .select('*')
    .single();

  if (error || !data) return null;
  return data as OrderRecord;
}

export async function updateOrderAdminNotes(
  orderNumber: number,
  note: string,
): Promise<OrderRecord | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ admin_notes: note, updated_at: new Date().toISOString() })
    .eq('order_number', orderNumber)
    .select('*')
    .single();

  if (error || !data) return null;
  return data as OrderRecord;
}
