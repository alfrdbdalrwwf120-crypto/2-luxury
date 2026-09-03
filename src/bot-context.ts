import type { Context, SessionFlavor } from 'grammy';
import type { SessionData } from './types/index.js';

export type BotContext = Context & SessionFlavor<SessionData>;

export function initialSession(): SessionData {
  return { draft: null };
}
