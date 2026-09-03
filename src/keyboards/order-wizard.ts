import { InlineKeyboard } from 'grammy';

export function colorsChoiceKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🎨 نعم', 'wizard:colors:yes')
    .text('⚪ لا، اخترها أنت', 'wizard:colors:no')
    .row()
    .text('❌ إلغاء الطلب', 'wizard:cancel');
}

export function referencesChoiceKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📎 نعم، سأرسل ملفات', 'wizard:refs:yes')
    .text('➡️ لا', 'wizard:refs:no')
    .row()
    .text('❌ إلغاء الطلب', 'wizard:cancel');
}

export function sizeChoiceKeyboard(sizeOptions: string[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const size of sizeOptions) {
    kb.text(size, `wizard:size:${size}`).row();
  }
  kb.text('❌ إلغاء الطلب', 'wizard:cancel');
  return kb;
}

export function orderSummaryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ تأكيد الطلب', 'wizard:confirm')
    .row()
    .text('✏️ تعديل المعلومات', 'wizard:edit')
    .row()
    .text('❌ إلغاء الطلب', 'wizard:cancel');
}

export function cancelOnlyKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('❌ إلغاء الطلب', 'wizard:cancel');
}

export function resumeDraftKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('▶️ إكمال الطلب السابق', 'wizard:resume')
    .row()
    .text('🆕 بدء طلب جديد', 'wizard:restart');
}
