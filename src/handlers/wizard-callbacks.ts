import type { Bot } from 'grammy';
import type { BotContext } from '../bot-context.js';
import { isValidServiceKey } from '../config/services.js';
import { loadDraft } from '../db/drafts-repo.js';
import {
  startOrderWizard,
  resumeOrderWizard,
  handleColorsChoice,
  handleReferencesChoice,
  handleSizeChoice,
  handleConfirmOrder,
  handleCancelOrder,
  handleEditOrder,
} from '../services/order-wizard.js';
import { mainMenuKeyboard } from '../keyboards/main-menu.js';

export function registerWizardCallbacks(bot: Bot<BotContext>): void {
  bot.callbackQuery(/^order:service:(.+)$/, async (ctx) => {
    const key = ctx.match[1];
    if (!isValidServiceKey(key)) {
      await ctx.answerCallbackQuery({ text: 'خدمة غير معروفة' });
      return;
    }
    await startOrderWizard(ctx, key);
  });

  bot.callbackQuery('wizard:colors:yes', async (ctx) => handleColorsChoice(ctx, true));
  bot.callbackQuery('wizard:colors:no', async (ctx) => handleColorsChoice(ctx, false));

  bot.callbackQuery('wizard:refs:yes', async (ctx) => handleReferencesChoice(ctx, true));
  bot.callbackQuery('wizard:refs:no', async (ctx) => handleReferencesChoice(ctx, false));

  bot.callbackQuery(/^wizard:size:(.+)$/, async (ctx) => {
    const size = ctx.match[1];
    await handleSizeChoice(ctx, size);
  });

  bot.callbackQuery('wizard:confirm', handleConfirmOrder);
  bot.callbackQuery('wizard:cancel', handleCancelOrder);
  bot.callbackQuery('wizard:edit', handleEditOrder);

  bot.callbackQuery('wizard:resume', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const draft = await loadDraft(userId);
    if (!draft) {
      await ctx.editMessageText('لم يعد الطلب السابق متاحاً. يمكنك بدء طلب جديد.', {
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }
    await ctx.deleteMessage().catch(() => {});
    await resumeOrderWizard(ctx, draft);
  });

  bot.callbackQuery('wizard:restart', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (userId) {
      const { clearDraft } = await import('../db/drafts-repo.js');
      await clearDraft(userId);
    }
    ctx.session.draft = null;
    await ctx.editMessageText('اختر ما تريد من القائمة بالأسفل:', {
      reply_markup: mainMenuKeyboard(),
    });
  });
}
