import type { Bot } from 'grammy';
import type { BotContext } from '../bot-context.js';
import { env } from '../config/env.js';
import { statusNotificationText } from '../config/status.js';
import type { OrderRecord, OrderStatus, ServiceDefinition } from '../types/index.js';

let botInstance: Bot<BotContext> | null = null;

export function registerBotForNotifications(bot: Bot<BotContext>): void {
  botInstance = bot;
}

export async function notifyCustomerStatusChange(
  order: OrderRecord,
  status: OrderStatus,
): Promise<void> {
  if (!botInstance) return;
  try {
    await botInstance.api.sendMessage(
      order.telegram_user_id,
      statusNotificationText(order.order_number, status),
    );
  } catch (err) {
    console.error(`Failed to notify customer for order #${order.order_number}:`, err);
  }
}

export async function notifyCustomerMessage(
  telegramUserId: number,
  text: string,
): Promise<boolean> {
  if (!botInstance) return false;
  try {
    await botInstance.api.sendMessage(telegramUserId, text);
    return true;
  } catch (err) {
    console.error(`Failed to send message to customer ${telegramUserId}:`, err);
    return false;
  }
}

export async function notifyAdminsNewOrder(
  ctx: BotContext,
  order: OrderRecord,
  service: ServiceDefinition,
): Promise<void> {
  const customerLabel = order.username
    ? `@${order.username}`
    : order.customer_name || `آيدي: ${order.telegram_user_id}`;

  const text = [
    '🆕 طلب جديد!',
    '',
    `رقم الطلب: #${order.order_number}`,
    `العميل: ${customerLabel}`,
    `الخدمة: ${service.emoji} ${service.name}`,
    order.project_name ? `المشروع: ${order.project_name}` : null,
    '',
    'استخدم /admin لعرض التفاصيل الكاملة وإدارة الطلب.',
  ]
    .filter(Boolean)
    .join('\n');

  for (const adminId of env.adminIds) {
    try {
      await ctx.api.sendMessage(adminId, text);
    } catch (err) {
      console.error(`Failed to notify admin ${adminId}:`, err);
    }
  }
}
