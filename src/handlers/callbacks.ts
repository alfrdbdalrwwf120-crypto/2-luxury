import type { Bot, Context } from 'grammy';
import { mainMenuKeyboard } from '../keyboards/main-menu.js';

export function registerCallbackHandlers(bot: Bot<Context>): void {
  bot.callbackQuery(/^menu:/, async (ctx) => {
    await ctx.answerCallbackQuery();

    const action = ctx.callbackQuery.data;
    const messages: Record<string, string> = {
      'menu:services': 'سيتم تجهيز قائمة خدمات التصميم في الخطوة التالية.',
      'menu:request': 'سيتم تجهيز نموذج طلب التصميم في الخطوة التالية.',
      'menu:portfolio': 'سيتم تجهيز معرض الأعمال في الخطوة التالية.',
      'menu:about': 'سيتم إضافة معلومات النشاط التجاري في الخطوة التالية.',
      'menu:contact': 'سيتم تجهيز خيارات التواصل في الخطوة التالية.',
    };

    await ctx.editMessageText(messages[action] || 'اختر أحد الخيارات من القائمة الرئيسية.', {
      reply_markup: mainMenuKeyboard(),
    });
  });
}
