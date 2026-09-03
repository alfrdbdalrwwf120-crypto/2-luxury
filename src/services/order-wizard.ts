import type { BotContext } from '../bot-context.js';
import { getServiceByKeyDb } from '../db/services-repo.js';
import { saveDraft, clearDraft } from '../db/drafts-repo.js';
import { createOrder } from '../db/orders-repo.js';
import type { OrderDraft, ServiceDefinition } from '../types/index.js';
import {
  colorsChoiceKeyboard,
  referencesChoiceKeyboard,
  sizeChoiceKeyboard,
  orderSummaryKeyboard,
  cancelOnlyKeyboard,
} from '../keyboards/order-wizard.js';
import { mainMenuKeyboard } from '../keyboards/main-menu.js';
import { notifyAdminsNewOrder } from './notifications.js';

// Wizard steps in order. Some are skipped conditionally (size only if needed).
type Step =
  | 'project_name'
  | 'project_field'
  | 'idea_description'
  | 'colors'
  | 'colors_text'
  | 'references'
  | 'size'
  | 'custom_size'
  | 'summary';

async function persist(ctx: BotContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId || !ctx.session.draft) return;
  await saveDraft(userId, ctx.session.draft);
}

export async function startOrderWizard(ctx: BotContext, serviceKey: string): Promise<void> {
  const service = await getServiceByKeyDb(serviceKey);
  if (!service || !service.active) {
    await ctx.answerCallbackQuery?.();
    await ctx.editMessageText('عذراً، هذه الخدمة غير متاحة حالياً.', {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  ctx.session.draft = {
    service_key: service.key,
    step: 'project_name',
  };
  await persist(ctx);

  await ctx.answerCallbackQuery?.();
  await ctx.editMessageText(
    `${service.emoji} ${service.name}\n\nما اسم المشروع أو العلامة التجارية؟`,
    { reply_markup: cancelOnlyKeyboard() },
  );
}

export async function resumeOrderWizard(ctx: BotContext, draft: OrderDraft): Promise<void> {
  ctx.session.draft = draft;
  await askForCurrentStep(ctx, draft);
}

async function askForCurrentStep(ctx: BotContext, draft: OrderDraft): Promise<void> {
  const service = await getServiceByKeyDb(draft.service_key);
  if (!service) {
    ctx.session.draft = null;
    await ctx.reply('عذراً، حدث خطأ في استكمال الطلب. الرجاء البدء من جديد.', {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const step = draft.step as Step;
  switch (step) {
    case 'project_name':
      await ctx.reply('ما اسم المشروع أو العلامة التجارية؟', {
        reply_markup: cancelOnlyKeyboard(),
      });
      break;
    case 'project_field':
      await ctx.reply('ما مجال المشروع؟', { reply_markup: cancelOnlyKeyboard() });
      break;
    case 'idea_description':
      await ctx.reply('اشرح لنا فكرتك أو الشكل الذي تتخيله.', {
        reply_markup: cancelOnlyKeyboard(),
      });
      break;
    case 'colors':
      await ctx.reply('هل لديك ألوان مفضلة؟', { reply_markup: colorsChoiceKeyboard() });
      break;
    case 'colors_text':
      await ctx.reply('تفضل، اكتب الألوان المفضلة لديك.', {
        reply_markup: cancelOnlyKeyboard(),
      });
      break;
    case 'references':
      await ctx.reply('هل لديك تصميم قديم أو صور أو مراجع تريد إرسالها؟', {
        reply_markup: referencesChoiceKeyboard(),
      });
      break;
    case 'size':
      await ctx.reply('📐 اختر المقاس:', {
        reply_markup: sizeChoiceKeyboard(service.sizeOptions ?? []),
      });
      break;
    case 'custom_size':
      await ctx.reply('اكتب المقاس المطلوب (العرض × الارتفاع).', {
        reply_markup: cancelOnlyKeyboard(),
      });
      break;
    case 'summary':
      await showSummary(ctx, draft, service);
      break;
  }
}

async function advance(ctx: BotContext, nextStep: Step): Promise<void> {
  if (!ctx.session.draft) return;
  ctx.session.draft.step = nextStep;
  await persist(ctx);
  await askForCurrentStep(ctx, ctx.session.draft);
}

/** Handles a plain text message while a wizard is in progress. Returns true if it was consumed. */
export async function handleWizardText(ctx: BotContext, text: string): Promise<boolean> {
  const draft = ctx.session.draft;
  if (!draft) return false;

  const trimmed = text.trim();
  if (!trimmed) {
    await ctx.reply('الرجاء إدخال نص صالح.');
    return true;
  }

  switch (draft.step as Step) {
    case 'project_name':
      draft.project_name = trimmed;
      await advance(ctx, 'project_field');
      return true;
    case 'project_field':
      draft.project_field = trimmed;
      await advance(ctx, 'idea_description');
      return true;
    case 'idea_description':
      draft.idea_description = trimmed;
      await advance(ctx, 'colors');
      return true;
    case 'colors_text':
      draft.colors_text = trimmed;
      await advance(ctx, 'references');
      return true;
    case 'custom_size':
      draft.custom_size = trimmed;
      await advance(ctx, 'summary');
      return true;
    default:
      return false;
  }
}

export async function handleColorsChoice(ctx: BotContext, wantsColors: boolean): Promise<void> {
  const draft = ctx.session.draft;
  if (!draft) return;
  draft.wants_colors = wantsColors;
  await ctx.answerCallbackQuery?.();
  if (wantsColors) {
    await advance(ctx, 'colors_text');
  } else {
    await advance(ctx, 'references');
  }
}

export async function handleReferencesChoice(
  ctx: BotContext,
  hasReferences: boolean,
): Promise<void> {
  const draft = ctx.session.draft;
  if (!draft) return;
  draft.has_references = hasReferences;
  await ctx.answerCallbackQuery?.();

  const service = await getServiceByKeyDb(draft.service_key);
  if (service?.needsSize) {
    await advance(ctx, 'size');
  } else {
    await advance(ctx, 'summary');
  }
}

export async function handleSizeChoice(ctx: BotContext, size: string): Promise<void> {
  const draft = ctx.session.draft;
  if (!draft) return;
  draft.size_choice = size;
  await ctx.answerCallbackQuery?.();

  if (size === 'مقاس خاص') {
    await advance(ctx, 'custom_size');
  } else {
    await advance(ctx, 'summary');
  }
}

function formatSummaryText(
  draft: OrderDraft,
  service: ServiceDefinition,
  orderNumberPreview?: number,
): string {
  const lines: string[] = ['📋 ملخص الطلب', ''];
  if (orderNumberPreview) lines.push(`رقم الطلب: #${orderNumberPreview}`);
  lines.push(`الخدمة: ${service.emoji} ${service.name}`);
  if (draft.project_name) lines.push(`اسم المشروع: ${draft.project_name}`);
  if (draft.project_field) lines.push(`مجال المشروع: ${draft.project_field}`);
  if (draft.idea_description) lines.push(`تفاصيل الفكرة: ${draft.idea_description}`);

  if (draft.wants_colors === true) {
    lines.push(`الألوان المفضلة: ${draft.colors_text || 'غير محددة'}`);
  } else if (draft.wants_colors === false) {
    lines.push('الألوان: يختارها المصمم');
  }

  if (draft.has_references === true) {
    lines.push('الملفات المرفقة: سيرسلها العميل عبر التواصل المباشر');
  } else if (draft.has_references === false) {
    lines.push('الملفات المرفقة: لا يوجد');
  }

  if (draft.size_choice) {
    const sizeText = draft.size_choice === 'مقاس خاص' ? draft.custom_size : draft.size_choice;
    lines.push(`المقاس: ${sizeText}`);
  }

  const perPageSuffix = service.perPage ? ' لكل صفحة' : '';
  lines.push('');
  lines.push(`💰 السعر التقديري: من ${service.minPrice} إلى ${service.maxPrice} د.ل${perPageSuffix}`);
  lines.push('(السعر النهائي يُحدد بعد مراجعة التفاصيل)');

  return lines.join('\n');
}

async function showSummary(
  ctx: BotContext,
  draft: OrderDraft,
  service: ServiceDefinition,
): Promise<void> {
  draft.step = 'summary';
  await persist(ctx);
  const text = formatSummaryText(draft, service);
  await ctx.reply(text, { reply_markup: orderSummaryKeyboard() });
}

export async function handleConfirmOrder(ctx: BotContext): Promise<void> {
  const draft = ctx.session.draft;
  const userId = ctx.from?.id;
  if (!draft || !userId) return;

  const service = await getServiceByKeyDb(draft.service_key);
  if (!service) {
    await ctx.answerCallbackQuery?.();
    await ctx.editMessageText('عذراً، حدث خطأ. الرجاء البدء من جديد.', {
      reply_markup: mainMenuKeyboard(),
    });
    ctx.session.draft = null;
    return;
  }

  await ctx.answerCallbackQuery?.();

  const order = await createOrder({
    telegram_user_id: userId,
    customer_name: [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ') || null,
    username: ctx.from?.username ?? null,
    service_key: service.key,
    draft,
    price_min: service.minPrice,
    price_max: service.maxPrice,
    final_price: null,
  });

  ctx.session.draft = null;
  await clearDraft(userId);

  await ctx.editMessageText(
    `✅ تم تسجيل طلبك بنجاح!\n\nرقم الطلب: #${order.order_number}\n\nتم استلام تفاصيل طلبك وسيتم التواصل معك لاستكمال الإجراءات.\n\nيمكنك متابعة حالة طلبك من "📦 طلباتي" في القائمة الرئيسية.`,
    { reply_markup: mainMenuKeyboard() },
  );

  await notifyAdminsNewOrder(ctx, order, service);
}

export async function handleCancelOrder(ctx: BotContext): Promise<void> {
  const userId = ctx.from?.id;
  ctx.session.draft = null;
  if (userId) await clearDraft(userId);

  await ctx.answerCallbackQuery?.();
  await ctx.editMessageText('❌ تم إلغاء الطلب.\n\nيمكنك بدء طلب جديد في أي وقت.', {
    reply_markup: mainMenuKeyboard(),
  });
}

export async function handleEditOrder(ctx: BotContext): Promise<void> {
  const draft = ctx.session.draft;
  if (!draft) return;
  draft.step = 'project_name';
  await persist(ctx);

  await ctx.answerCallbackQuery?.();
  await ctx.editMessageText('حسناً، لنبدأ من جديد بجمع تفاصيل طلبك.\n\nما اسم المشروع أو العلامة التجارية؟', {
    reply_markup: cancelOnlyKeyboard(),
  });
}
