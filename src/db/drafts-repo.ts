import { supabase } from './client.js';
import type { OrderDraft } from '../types/index.js';

export async function saveDraft(telegramUserId: number, draft: OrderDraft): Promise<void> {
  const { error } = await supabase
    .from('order_drafts')
    .upsert(
      { telegram_user_id: telegramUserId, draft, updated_at: new Date().toISOString() },
      { onConflict: 'telegram_user_id' },
    );

  if (error) {
    console.error('Failed to save draft:', error.message);
  }
}

export async function loadDraft(telegramUserId: number): Promise<OrderDraft | null> {
  const { data, error } = await supabase
    .from('order_drafts')
    .select('draft')
    .eq('telegram_user_id', telegramUserId)
    .single();

  if (error || !data) return null;
  return data.draft as OrderDraft;
}

export async function clearDraft(telegramUserId: number): Promise<void> {
  const { error } = await supabase
    .from('order_drafts')
    .delete()
    .eq('telegram_user_id', telegramUserId);

  if (error) {
    console.error('Failed to clear draft:', error.message);
  }
}
