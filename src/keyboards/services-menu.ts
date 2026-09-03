import { InlineKeyboard } from 'grammy';
import type { ServiceDefinition } from '../types/index.js';

export function servicesListKeyboard(services: ServiceDefinition[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const s of services) {
    kb.text(`${s.emoji} ${s.name}`, `order:service:${s.key}`).row();
  }
  kb.text('⬅️ رجوع للقائمة الرئيسية', 'menu:main');
  return kb;
}

export function backToMainKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('⬅️ رجوع للقائمة الرئيسية', 'menu:main');
}
