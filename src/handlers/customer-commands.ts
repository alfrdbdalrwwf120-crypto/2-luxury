import type { Bot } from 'grammy';
import type { BotContext } from '../bot-context.js';
import { getOrdersByUser } from '../db/orders-repo.js';
import { clearDraft } from '../db/drafts-repo.js';
import { formatOrderCard } from '../services/order-format.js';
import { mainMenuKeyboard } from '../keyboards/main-menu.js';
import { backToMainKeyboard } from '../keyboards/services-menu.js';

const CONTACT_TEXT = `📞 التواصل معنا

يمكنك التواصل مباشرة معنا عبر تيليجرام، وسنقوم بالرد عليك في أقرب وقت.

كما يمكنك متابعة أي طلب سابق عبر "📦 طلباتي" في القائمة الرئيسية.`;

const HELP_TEXT = `ℹ️ طريقة استخدام البوت

1️⃣ اختر "🎨 طلب تصميم" من القائمة الرئيسية.
2️⃣ اختر نوع الخدمة التي تريدها.
3️⃣ أجب على الأسئلة خطوة بخطوة (اسم المشروع، الفكرة، الألوان، المقاس إن وجد).
4️⃣ راجع ملخص الطلب وأكّده.
5️⃣ سيصلك رقم الطلب، ويمكنك متابعة حالته من "📦 طلباتي" أو بأمر /status.

الأوامر المتاحة:
/start - بدء استخدام البوت
/services - عرض الخدمات
/prices - عرض الأسعار
/order - طلب خدمة تصميم
/myorders - عرض طلباتي
/status - متابعة حالة الطلب
/contact - التواصل مع المصمم
/cancel - إلغاء الطلب الحالي
/help - هذه الرسالة`;

export function registerCustomerCommands(bot: Bot<BotContext>): void {
  bot.command('myorders', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const orders = await getOrdersByUser(userId);
    if (orders.length === 0) {
      await ctx.reply('📦 لا توجد لديك أي طلبات بعد.\n\nيمكنك بدء طلب جديد من القائمة الرئيسية.', {
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }

    const cards = await Promise.all(orders.map((o) => formatOrderCard(o)));
    await ctx.reply(`📦 طلباتك (${orders.length}):\n\n${cards.join('\n\n---\n\n')}`, {
      reply_markup: backToMainKeyboard(),
    });
  });

  bot.command('status', async (ctx) => {
    const parts = ctx.message?.text?.trim().split(/\s+/) ?? [];
    const arg = parts[1];

    const userId = ctx.from?.id;
    if (!userId) return;

    if (!arg) {
      await ctx.reply(
        'الرجاء كتابة رقم الطلب بعد الأمر، مثال:\n/status 1001\n\nأو استخدم /myorders لعرض جميع طلباتك.',
      );
      return;
    }

    const orderNumber = Number(arg.replace('#', ''));
    if (!Number.isFinite(orderNumber)) {
      await ctx.reply('رقم الطلب غير صالح.');
      return;
    }

    const orders = await getOrdersByUser(userId);
    const order = orders.find((o) => o.order_number === orderNumber);

    if (!order) {
      await ctx.reply('لم يتم العثور على طلب بهذا الرقم ضمن طلباتك.');
      return;
    }

    await ctx.reply(await formatOrderCard(order), { reply_markup: backToMainKeyboard() });
  });

  bot.command('cancel', async (ctx) => {
    const userId = ctx.from?.id;
    if (!ctx.session.draft) {
      await ctx.reply('لا يوجد طلب حالي قيد التعبئة لإلغائه.');
      return;
    }
    ctx.session.draft = null;
    if (userId) await clearDraft(userId);

    await ctx.reply('❌ تم إلغاء الطلب الحالي.', { reply_markup: mainMenuKeyboard() });
  });

  bot.command('contact', async (ctx) => {
    await ctx.reply(CONTACT_TEXT, { reply_markup: backToMainKeyboard() });
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(HELP_TEXT, { reply_markup: backToMainKeyboard() });
  });
}

export { CONTACT_TEXT, HELP_TEXT };
