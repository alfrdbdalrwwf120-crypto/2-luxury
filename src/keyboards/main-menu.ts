import { InlineKeyboard } from 'grammy';

export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🎨 طلب تصميم', 'menu:order')
    .row()
    .text('💰 الخدمات والأسعار', 'menu:prices')
    .row()
    .text('📦 طلباتي', 'menu:myorders')
    .row()
    .text('📞 التواصل معنا', 'menu:contact')
    .row()
    .text('ℹ️ طريقة الاستخدام', 'menu:help');
}
