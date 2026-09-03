import type { Bot } from 'grammy';
import type { BotContext } from '../bot-context.js';
import { handleWizardText } from '../services/order-wizard.js';
import { handleAdminAwaitingText } from './admin.js';

export function registerTextRouter(bot: Bot<BotContext>): void {
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return; // commands are handled elsewhere

    // Admin awaiting free-text input (search, price update, notes) takes priority
    // only for recognized admins; otherwise falls through to the customer wizard.
    const handledByAdmin = await handleAdminAwaitingText(ctx, text);
    if (handledByAdmin) return;

    const handledByWizard = await handleWizardText(ctx, text);
    if (handledByWizard) return;

    // No active flow — gently nudge toward the menu instead of staying silent.
    await ctx.reply('استخدم القائمة بالأسفل أو الأمر /start لعرض الخيارات المتاحة.');
  });
}
