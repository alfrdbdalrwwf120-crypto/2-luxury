import type { Bot } from 'grammy';
import type { BotContext } from '../bot-context.js';
import { env } from '../config/env.js';
import {
  getAllOrders,
  getNewOrders,
  getOrderByNumber,
  getOrdersByCustomerName,
  updateOrderStatus,
  updateOrderPrice,
  updateOrderAdminNotes,
} from '../db/orders-repo.js';
import {
  getAllServices,
  getServiceByKeyDb,
  setServiceActive,
  updateServicePriceRange,
} from '../db/services-repo.js';
import { formatOrderFullDetails } from '../services/order-format.js';
import { notifyCustomerStatusChange, notifyCustomerMessage } from '../services/notifications.js';
import {
  adminMainMenuKeyboard,
  adminOrderActionsKeyboard,
  adminStatusMenuKeyboard,
  adminOrdersListKeyboard,
  adminServicesListKeyboard,
  adminServiceActionsKeyboard,
  backToAdminMainKeyboard,
} from '../keyboards/admin-menu.js';
import type { OrderStatus } from '../types/index.js';

function isAdmin(userId: number | undefined): boolean {
  if (!userId) return false;
  return env.adminIds.includes(userId);
}

async function requireAdmin(ctx: BotContext): Promise<boolean> {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply('عذراً، هذا الأمر مخصص للمدير فقط.');
    return false;
  }
  return true;
}

export function registerAdminHandlers(bot: Bot<BotContext>): void {
  bot.command('admin', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    ctx.session.awaitingAdminAction = undefined;
    await ctx.reply('🛠️ لوحة تحكم المصمم', { reply_markup: adminMainMenuKeyboard() });
  });

  bot.callbackQuery('admin:main', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.answerCallbackQuery();
      return;
    }
    ctx.session.awaitingAdminAction = undefined;
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('🛠️ لوحة تحكم المصمم', { reply_markup: adminMainMenuKeyboard() });
  });

  bot.callbackQuery('admin:close', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('تم إغلاق لوحة التحكم.');
  });

  bot.callbackQuery('admin:new_orders', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const orders = await getNewOrders();
    if (orders.length === 0) {
      await ctx.editMessageText('لا توجد طلبات جديدة حالياً.', {
        reply_markup: backToAdminMainKeyboard(),
      });
      return;
    }
    await ctx.editMessageText(`🆕 الطلبات الجديدة (${orders.length}):`, {
      reply_markup: adminOrdersListKeyboard(orders),
    });
  });

  bot.callbackQuery('admin:all_orders', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const orders = await getAllOrders(20);
    if (orders.length === 0) {
      await ctx.editMessageText('لا توجد طلبات بعد.', { reply_markup: backToAdminMainKeyboard() });
      return;
    }
    await ctx.editMessageText(`📋 آخر ${orders.length} طلب:`, {
      reply_markup: adminOrdersListKeyboard(orders),
    });
  });

  bot.callbackQuery('admin:search_order', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    ctx.session.awaitingAdminAction = { type: 'search_order' };
    await ctx.editMessageText('🔍 أرسل رقم الطلب الذي تريد البحث عنه (مثال: 1001).', {
      reply_markup: backToAdminMainKeyboard(),
    });
  });

  bot.callbackQuery('admin:search_customer', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    ctx.session.awaitingAdminAction = { type: 'search_customer' };
    await ctx.editMessageText('🔍 أرسل اسم العميل أو جزء منه للبحث.', {
      reply_markup: backToAdminMainKeyboard(),
    });
  });

  bot.callbackQuery('admin:services', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const services = await getAllServices();
    await ctx.editMessageText('🛠️ إدارة الخدمات:', {
      reply_markup: adminServicesListKeyboard(services),
    });
  });

  bot.callbackQuery(/^admin:order:(\d+):view$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const orderNumber = Number(ctx.match[1]);
    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      await ctx.editMessageText('لم يتم العثور على الطلب.', {
        reply_markup: backToAdminMainKeyboard(),
      });
      return;
    }
    await ctx.editMessageText(await formatOrderFullDetails(order), {
      reply_markup: adminOrderActionsKeyboard(order),
    });
  });

  bot.callbackQuery(/^admin:order:(\d+):status_menu$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const orderNumber = Number(ctx.match[1]);
    await ctx.editMessageText(`🔄 اختر الحالة الجديدة للطلب #${orderNumber}:`, {
      reply_markup: adminStatusMenuKeyboard(orderNumber),
    });
  });

  bot.callbackQuery(/^admin:order:(\d+):set_status:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const orderNumber = Number(ctx.match[1]);
    const status = ctx.match[2] as OrderStatus;

    const order = await updateOrderStatus(orderNumber, status);
    if (!order) {
      await ctx.editMessageText('تعذر تحديث حالة الطلب.', {
        reply_markup: backToAdminMainKeyboard(),
      });
      return;
    }

    await notifyCustomerStatusChange(order, status);
    await ctx.editMessageText(await formatOrderFullDetails(order), {
      reply_markup: adminOrderActionsKeyboard(order),
    });
  });

  bot.callbackQuery(/^admin:order:(\d+):price$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const orderNumber = Number(ctx.match[1]);
    ctx.session.awaitingAdminAction = { type: 'set_price', orderNumber };
    await ctx.editMessageText(`💰 أرسل السعر النهائي للطلب #${orderNumber} (بالأرقام فقط).`, {
      reply_markup: backToAdminMainKeyboard(),
    });
  });

  bot.callbackQuery(/^admin:order:(\d+):note$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const orderNumber = Number(ctx.match[1]);
    ctx.session.awaitingAdminAction = { type: 'admin_note', orderNumber };
    await ctx.editMessageText(`📝 أرسل الملاحظة التي تريد إضافتها للطلب #${orderNumber}.`, {
      reply_markup: backToAdminMainKeyboard(),
    });
  });

  bot.callbackQuery(/^admin:order:(\d+):contact$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const orderNumber = Number(ctx.match[1]);
    ctx.session.awaitingAdminAction = { type: 'contact_customer', orderNumber };
    await ctx.editMessageText(`✉️ أرسل الرسالة التي تريد إرسالها للعميل صاحب الطلب #${orderNumber}.`, {
      reply_markup: backToAdminMainKeyboard(),
    });
  });

  bot.callbackQuery(/^admin:service:(.+):view$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const key = ctx.match[1];
    const service = await getServiceByKeyDb(key);
    if (!service) {
      await ctx.editMessageText('لم يتم العثور على الخدمة.', {
        reply_markup: backToAdminMainKeyboard(),
      });
      return;
    }
    const statusText = service.active ? '✅ مفعّلة' : '🚫 معطّلة';
    const text = `${service.emoji} ${service.name}\n\nالحالة: ${statusText}\nنطاق السعر: من ${service.minPrice} إلى ${service.maxPrice} د.ل${service.perPage ? ' لكل صفحة' : ''}`;
    await ctx.editMessageText(text, { reply_markup: adminServiceActionsKeyboard(service) });
  });

  bot.callbackQuery(/^admin:service:(.+):enable$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const key = ctx.match[1];
    await setServiceActive(key, true);
    const service = await getServiceByKeyDb(key);
    if (!service) return;
    await ctx.editMessageText(`✅ تم تفعيل خدمة ${service.name}.`, {
      reply_markup: adminServiceActionsKeyboard(service),
    });
  });

  bot.callbackQuery(/^admin:service:(.+):disable$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const key = ctx.match[1];
    await setServiceActive(key, false);
    const service = await getServiceByKeyDb(key);
    if (!service) return;
    await ctx.editMessageText(`🚫 تم تعطيل خدمة ${service.name}.`, {
      reply_markup: adminServiceActionsKeyboard(service),
    });
  });

  bot.callbackQuery(/^admin:service:(.+):price$/, async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    const key = ctx.match[1];
    ctx.session.awaitingAdminAction = { type: 'set_price', serviceKey: key };
    await ctx.editMessageText(
      `💰 أرسل نطاق السعر الجديد للخدمة بالصيغة:\nالأدنى-الأعلى\nمثال: 200-600`,
      { reply_markup: backToAdminMainKeyboard() },
    );
  });
}

/**
 * Handles free-text input while the admin is in an "awaiting" state
 * (search, price entry, note entry, contact message).
 * Returns true if the text was consumed by an admin flow.
 */
export async function handleAdminAwaitingText(ctx: BotContext, text: string): Promise<boolean> {
  const userId = ctx.from?.id;
  if (!isAdmin(userId)) return false;

  const action = ctx.session.awaitingAdminAction;
  if (!action) return false;

  const trimmed = text.trim();

  switch (action.type) {
    case 'search_order': {
      ctx.session.awaitingAdminAction = undefined;
      const orderNumber = Number(trimmed.replace('#', ''));
      if (!Number.isFinite(orderNumber)) {
        await ctx.reply('رقم الطلب غير صالح.', { reply_markup: backToAdminMainKeyboard() });
        return true;
      }
      const order = await getOrderByNumber(orderNumber);
      if (!order) {
        await ctx.reply('لم يتم العثور على الطلب.', { reply_markup: backToAdminMainKeyboard() });
        return true;
      }
      await ctx.reply(await formatOrderFullDetails(order), {
        reply_markup: adminOrderActionsKeyboard(order),
      });
      return true;
    }

    case 'search_customer': {
      ctx.session.awaitingAdminAction = undefined;
      const orders = await getOrdersByCustomerName(trimmed);
      if (orders.length === 0) {
        await ctx.reply('لا توجد طلبات لعميل بهذا الاسم.', {
          reply_markup: backToAdminMainKeyboard(),
        });
        return true;
      }
      await ctx.reply(`🔍 نتائج البحث (${orders.length}):`, {
        reply_markup: adminOrdersListKeyboard(orders),
      });
      return true;
    }

    case 'set_price': {
      const serviceKey = action.serviceKey;
      ctx.session.awaitingAdminAction = undefined;

      if (serviceKey) {
        const match = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
        if (!match) {
          await ctx.reply('الصيغة غير صحيحة. مثال: 200-600', {
            reply_markup: backToAdminMainKeyboard(),
          });
          return true;
        }
        const min = Number(match[1]);
        const max = Number(match[2]);
        await updateServicePriceRange(serviceKey, min, max);
        const service = await getServiceByKeyDb(serviceKey);
        await ctx.reply(`✅ تم تحديث نطاق السعر إلى: من ${min} إلى ${max} د.ل`, {
          reply_markup: service
            ? adminServiceActionsKeyboard(service)
            : backToAdminMainKeyboard(),
        });
        return true;
      }

      if (!action.orderNumber) return true;
      const price = Number(trimmed);
      if (!Number.isFinite(price) || price <= 0) {
        await ctx.reply('الرجاء إرسال رقم صحيح للسعر.', {
          reply_markup: backToAdminMainKeyboard(),
        });
        return true;
      }
      const order = await updateOrderPrice(action.orderNumber, price);
      if (!order) {
        await ctx.reply('تعذر تحديث السعر.', { reply_markup: backToAdminMainKeyboard() });
        return true;
      }
      await ctx.reply(`✅ تم تحديث السعر النهائي إلى ${price} د.ل`, {
        reply_markup: adminOrderActionsKeyboard(order),
      });
      return true;
    }

    case 'admin_note': {
      ctx.session.awaitingAdminAction = undefined;
      if (!action.orderNumber) return true;
      const order = await updateOrderAdminNotes(action.orderNumber, trimmed);
      if (!order) {
        await ctx.reply('تعذر إضافة الملاحظة.', { reply_markup: backToAdminMainKeyboard() });
        return true;
      }
      await ctx.reply('✅ تم إضافة الملاحظة.', {
        reply_markup: adminOrderActionsKeyboard(order),
      });
      return true;
    }

    case 'contact_customer': {
      ctx.session.awaitingAdminAction = undefined;
      if (!action.orderNumber) return true;
      const order = await getOrderByNumber(action.orderNumber);
      if (!order) {
        await ctx.reply('تعذر العثور على الطلب.', { reply_markup: backToAdminMainKeyboard() });
        return true;
      }
      const sent = await notifyCustomerMessage(
        order.telegram_user_id,
        `✉️ رسالة بخصوص طلبك #${order.order_number}:\n\n${trimmed}`,
      );
      await ctx.reply(sent ? '✅ تم إرسال الرسالة للعميل.' : '⚠️ تعذر إرسال الرسالة للعميل.', {
        reply_markup: adminOrderActionsKeyboard(order),
      });
      return true;
    }

    default:
      return false;
  }
}
