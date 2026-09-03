import type { Bot } from 'grammy';
import type { BotContext } from '../bot-context.js';
import { mainMenuKeyboard } from '../keyboards/main-menu.js';
import { loadDraft } from '../db/drafts-repo.js';
import { resumeDraftKeyboard } from '../keyboards/order-wizard.js';

const welcomeText = `👋 أهلاً بك في خدمات التصميم
نساعدك في تحويل فكرتك إلى تصميم احترافي يناسب مشروعك وعلامتك التجارية.

اختر ما تريد من القائمة بالأسفل:`;

export function registerStartHandler(bot: Bot<BotContext>): void {
  bot.command('start', async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) {
      const draft = await loadDraft(userId);
      if (draft) {
        ctx.session.draft = draft;
        await ctx.reply('👋 أهلاً بعودتك! لديك طلب لم يكتمل بعد.', {
          reply_markup: resumeDraftKeyboard(),
        });
        return;
      }
    }

    await ctx.reply(welcomeText, { reply_markup: mainMenuKeyboard() });
  });
}
