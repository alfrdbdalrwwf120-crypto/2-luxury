import type { Bot } from 'grammy';
import type { BotContext } from '../bot-context.js';
import { getActiveServices } from '../db/services-repo.js';
import { servicesListKeyboard, backToMainKeyboard } from '../keyboards/services-menu.js';
import { formatServicePrice } from '../config/services.js';

export function buildPricesText(services: Awaited<ReturnType<typeof getActiveServices>>): string {
  const lines = ['💰 الخدمات والأسعار', ''];
  for (const s of services) {
    lines.push(`${s.emoji} ${s.name}`);
    lines.push(formatServicePrice(s));
    lines.push('');
  }
  lines.push('💡 السعر النهائي يُحدد بعد مراجعة تفاصيل مشروعك.');
  return lines.join('\n');
}

export function registerServicesHandlers(bot: Bot<BotContext>): void {
  bot.command('services', async (ctx) => {
    const services = await getActiveServices();
    await ctx.reply('🎨 اختر الخدمة التي تريد طلبها:', {
      reply_markup: servicesListKeyboard(services),
    });
  });

  bot.command('prices', async (ctx) => {
    const services = await getActiveServices();
    await ctx.reply(buildPricesText(services), { reply_markup: backToMainKeyboard() });
  });
}
