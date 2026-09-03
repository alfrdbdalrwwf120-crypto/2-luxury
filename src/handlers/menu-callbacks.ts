import type { Bot } from 'grammy';
import type { BotContext } from '../bot-context.js';
import { mainMenuKeyboard } from '../keyboards/main-menu.js';
import { servicesListKeyboard, backToMainKeyboard } from '../keyboards/services-menu.js';
import { getActiveServices } from '../db/services-repo.js';
import { getOrdersByUser } from '../db/orders-repo.js';
import { formatOrderCard } from '../services/order-format.js';
import { buildPricesText } from './services.js';
import { CONTACT_TEXT, HELP_TEXT } from './customer-commands.js';

const welcomeText = `👋 أهلاً بك في خدمات التصميم
نساعدك في تحويل فكرتك إلى تصميم احترافي يناسب مشروعك وعلامتك التجارية.

اختر ما تريد من القائمة بالأسفل:`;

export function registerMenuCallbacks(bot: Bot<BotContext>): void {
  bot.command('order', async (ctx) => {
    const services = await getActiveServices();
    await ctx.reply('🎨 اختر الخدمة التي تريد طلبها:', {
      reply_markup: servicesListKeyboard(services),
    });
  });

  bot.callbackQuery('menu:main', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(welcomeText, { reply_markup: mainMenuKeyboard() });
  });

  bot.callbackQuery('menu:order', async (ctx) => {
    await ctx.answerCallbackQuery();
    const services = await getActiveServices();
    await ctx.editMessageText('🎨 اختر الخدمة التي تريد طلبها:', {
      reply_markup: servicesListKeyboard(services),
    });
  });

  bot.callbackQuery('menu:prices', async (ctx) => {
    await ctx.answerCallbackQuery();
    const services = await getActiveServices();
    await ctx.editMessageText(buildPricesText(services), { reply_markup: backToMainKeyboard() });
  });

  bot.callbackQuery('menu:myorders', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;

    const orders = await getOrdersByUser(userId);
    if (orders.length === 0) {
      await ctx.editMessageText('📦 لا توجد لديك أي طلبات بعد.\n\nيمكنك بدء طلب جديد من القائمة الرئيسية.', {
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }

    const cards = await Promise.all(orders.map((o) => formatOrderCard(o)));
    await ctx.editMessageText(`📦 طلباتك (${orders.length}):\n\n${cards.join('\n\n---\n\n')}`, {
      reply_markup: backToMainKeyboard(),
    });
  });

  bot.callbackQuery('menu:contact', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(CONTACT_TEXT, { reply_markup: backToMainKeyboard() });
  });

  bot.callbackQuery('menu:help', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(HELP_TEXT, { reply_markup: backToMainKeyboard() });
  });
}
