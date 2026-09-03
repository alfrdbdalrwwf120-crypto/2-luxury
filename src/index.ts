import { Bot, session } from 'grammy';
import { env } from './config/env.js';
import type { BotContext } from './bot-context.js';
import { initialSession } from './bot-context.js';
import { seedServicesIfNeeded } from './db/services-repo.js';
import { registerBotForNotifications } from './services/notifications.js';

import { registerStartHandler } from './handlers/start.js';
import { registerServicesHandlers } from './handlers/services.js';
import { registerCustomerCommands } from './handlers/customer-commands.js';
import { registerMenuCallbacks } from './handlers/menu-callbacks.js';
import { registerWizardCallbacks } from './handlers/wizard-callbacks.js';
import { registerAdminHandlers } from './handlers/admin.js';
import { registerTextRouter } from './handlers/text-router.js';

async function main(): Promise<void> {
  console.log(`${env.botName} is starting in ${env.nodeEnv} mode...`);

  await seedServicesIfNeeded();

  const bot = new Bot<BotContext>(env.telegramBotToken);
  bot.use(session({ initial: initialSession }));

  registerBotForNotifications(bot);

  registerStartHandler(bot);
  registerServicesHandlers(bot);
  registerCustomerCommands(bot);
  registerMenuCallbacks(bot);
  registerWizardCallbacks(bot);
  registerAdminHandlers(bot);
  registerTextRouter(bot); // must be registered last: catches leftover text messages

  bot.catch((err) => {
    console.error('Unhandled bot error:', err.error);
  });

  const me = await bot.api.getMe();
  console.log(`Connected as @${me.username}`);

  await bot.start();
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
