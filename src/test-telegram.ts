import { env } from './config/env.js';

async function main(): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/getMe`);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram connection failed: ${data.description || `HTTP ${response.status}`}`);
  }

  console.log('Telegram connection successful.');
  console.log(`Bot name: ${data.result.first_name}`);
  console.log(`Bot username: @${data.result.username}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
