import 'dotenv/config';

const token = process.env.BOT_TOKEN?.trim();

if (!token || token === 'replace_with_your_bot_token') {
  throw new Error(
    'BOT_TOKEN is missing. Copy .env.example to .env and add the token from @BotFather.',
  );
}

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_KEY?.trim();

if (!supabaseUrl || supabaseUrl === 'replace_with_your_supabase_url') {
  throw new Error('SUPABASE_URL is missing. Add it to .env.');
}

if (!supabaseKey || supabaseKey === 'replace_with_your_supabase_secret_key') {
  throw new Error('SUPABASE_SERVICE_KEY is missing. Add it to .env.');
}

const adminIdsRaw = process.env.ADMIN_IDS?.trim() || '';
const adminIds = adminIdsRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => Number(s))
  .filter((n) => Number.isFinite(n));

export const env = {
  telegramBotToken: token,
  botName: process.env.BOT_NAME?.trim() || 'دقة للتصميم',
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl,
  supabaseKey,
  adminIds,
} as const;
