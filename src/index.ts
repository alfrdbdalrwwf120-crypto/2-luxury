import { Bot, InlineKeyboard, Context } from "grammy";
import { createServer } from "node:http";

const token = process.env.BOT_TOKEN || "ضع_التوكن_هنا";
const bot = new Bot(token);

// إعدادات الـ Admin (ضع معرف تيليجرام الخاص بك هنا ليظهر له لوحة التحكم والمدير)
const ADMIN_ID = Number(process.env.ADMIN_ID) || 0; 

// قاعدة بيانات مؤقتة في الذاكرة (يمكن ربطها بقاعدة بيانات لاحقاً)
interface Order {
  id: number;
  userId: number;
  userName: string;
  serviceName: string;
  step: string;
  details: {
    projectName?: string;
    projectField?: string;
    idea?: string;
    colors?: string;
    files?: string;
    size?: string;
  };
  priceRange: string;
  status: "قيد المراجعة" | "تم قبول الطلب" | "قيد التنفيذ" | "مكتمل" | "ملغي";
  date: string;
}

const orders: Order[] = documentStore(); // تخزين مؤقت للطلبات
const userSessions: Record<number, { service?: string; step?: number; data: any }> = {};

function documentStore() {
  return [];
}

// قائمة الخدمات والأسعار
const servicesList = [
  { name: "🎨 تصميم شعار", price: "من 200 إلى 600 د.ل" },
  { name: "🎨 تحديث شعار", price: "من 125 إلى 400 د.ل" },
  { name: "🎨 تصميم هوية بصرية", price: "من 500 إلى 1400 د.ل" },
  { name: "🎨 تحديث هوية بصرية", price: "من 400 إلى 1000 د.ل" },
  { name: "🎨 تصميم نمط Pattern", price: "من 40 إلى 60 د.ل" },
  { name: "🎨 تصميم كرت شخصي", price: "من 25 إلى 50 د.ل" },
  { name: "🎨 تصميم علب وتغليف", price: "من 225 إلى 550 د.ل" },
  { name: "🎨 تصميم ختم", price: "من 40 إلى 60 د.ل" },
  { name: "🎨 تصميم بروشور", price: "من 75 إلى 125 د.ل" },
  { name: "🎨 تصميم شهادات", price: "من 40 إلى 60 د.ل" },
  { name: "🎨 تصميم لوحة إعلانية", price: "من 70 إلى 150 د.ل" },
  { name: "🎨 تصميم ورق مراسلات", price: "من 40 إلى 60 د.ل" },
  { name: "🎨 تصميم أكياس", price: "من 40 إلى 70 د.ل" },
  { name: "🎨 تصميم دفتر ملاحظات", price: "من 40 إلى 65 د.ل" },
  { name: "🎨 تصميم استكرات", price: "من 40 إلى 60 د.ل" },
  { name: "🎨 تصميم غلاف كتاب", price: "من 75 إلى 175 د.ل" },
  { name: "🎨 تصميم فلاير", price: "من 60 إلى 85 د.ل" },
  { name: "🎨 تصميم مجلة", price: "من 40 إلى 60 د.ل لكل صفحة" },
];

// الأزرار الرئيسية للبوت
const mainMenu = new InlineKeyboard()
  .text("🎨 طلب تصميم", "cmd_request_design").row()
  .text("💰 الخدمات والأسعار", "cmd_services").row()
  .text("📦 طلباتي", "cmd_my_orders").row()
  .text("📞 التواصل معنا", "cmd_contact").row()
  .text("ℹ️ طريقة الاستخدام", "cmd_help");

// أمر البدء /start
bot.command("start", async (ctx) => {
  const welcomeText = 
    `👋 أهلاً بك في خدمات التصميم\n` +
    `نساعدك في تحويل فكرتك إلى تصميم احترافي يناسب مشروعك وعلامتك التجارية.\n\n` +
    `اختر ما تريد من القائمة بالأسفل:`;
  
  await ctx.reply(welcomeText, { reply_markup: mainMenu });
});

// عرض الخدمات والأسعار
bot.command("prices", async (ctx) => {
  let msg = "💰 **قائمة الخدمات والأسعار الأساسية:**\n\n";
  servicesList.forEach(s => {
    msg += `${s.name}\n${s.price}\n\n`;
  });
  await ctx.reply(msg, { parse_mode: "Markdown" });
});

bot.callbackQuery("cmd_services", async (ctx) => {
  await ctx.answerCallbackQuery();
  let msg = "💰 **قائمة الخدمات والأسعار الأساسية:**\n\n";
  servicesList.forEach(s => {
    msg += `${s.name}\n${s.price}\n\n`;
  });
  await ctx.reply(msg);
});

// طلب تصميم جديد (عرض الخدمات للاختيار)
bot.callbackQuery("cmd_request_design", async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard();
  servicesList.forEach((s, index) => {
    keyboard.text(s.name, `srv_${index}`).row();
  });
  await ctx.reply("اختر الخدمة المطلوبة من القائمة:", { reply_markup: keyboard });
});

// تفاعل المستخدم مع اختيار خدمة معينة لبدء الخطوات
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from?.id || 0;

  if (data.startsWith("srv_")) {
    const srvIndex = parseInt(data.replace("srv_", ""));
    const selectedService = servicesList[srvIndex];

    userSessions[userId] = {
      service: selectedService.name,
      step: 1,
      data: { priceRange: selectedService.price }
    };

    await ctx.answerCallbackQuery();
    await ctx.reply(`لقد اخترت: **${selectedService.name}**\n\nالخطوة 1: ما اسم المشروع أو العلامة التجارية؟`, { parse_mode: "Markdown" });
  } else if (data === "cmd_my_orders") {
    await ctx.answerCallbackQuery();
    const userOrders = orders.filter(o => o.userId === userId);
    if (userOrders.length === 0) {
      await ctx.reply("📦 ليس لديك أي طلبات مسجلة حتى الآن.");
    } else {
      let msg = "📦 **سجل طلباتك السابقة:**\n\n";
      userOrders.forEach(o => {
        msg += `رقم الطلب: #${o.id}\nالخدمة: ${o.serviceName}\nالحالة: ${o.status}\nالتاريخ: ${o.date}\n------------------\n`;
      });
      await ctx.reply(msg, { parse_mode: "Markdown" });
    }
  } else if (data === "cmd_contact") {
    await ctx.answerCallbackQuery();
    await ctx.reply("📞 يمكنك التواصل مباشرة مع المصمم عبر مراسلتنا هنا وسنرد عليك في أقرب وقت.");
  } else if (data === "cmd_help") {
    await ctx.answerCallbackQuery();
    await ctx.reply("ℹ️ طريقة الاستخدام:\nببساطة اضغط على 'طلب تصميم'، اختر الخدمة، وأجب عن الأسئلة البسيطة خطوة بخطوة وسيتم إرسال طلبك للمراجعة فوراً!");
  }
});

// استقبال نصوص خطوات الطلب
bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id || 0;
  const text = ctx.message.text;

  // تجاهل الأوامر التي تبدأ بـ /
  if (text.startsWith("/")) return;

  const session = userSessions[userId];
  if (!session || !session.step) {
    return; // لم يبدأ طلب جديد
  }

  if (session.step === 1) {
    session.data.projectName = text;
    session.step = 2;
    await ctx.reply("الخطوة 2: ما مجال المشروع؟");
  } else if (session.step === 2) {
    session.data.projectField = text;
    session.step = 3;
    await ctx.reply("الخطوة 3: اشرح لنا فكرتك أو الشكل الذي تتخيله للتصميم.");
  } else if (session.step === 3) {
    session.data.idea = text;
    session.step = 4;
    const kb = new InlineKeyboard().text("🎨 نعم", "color_yes").text("⚪ لا، اخترها أنت", "color_no");
    await ctx.reply("الخطوة 4: هل لديك ألوان مفضلة؟", { reply_markup: kb });
  }
});

// معالجة الأزرار الداخلية للألوان والمرفقات
bot.callbackQuery(/color_/, async (ctx) => {
  const userId = ctx.from?.id || 0;
  const session = userSessions[userId];
  if (!session) return;

  const choice = ctx.callbackQuery.data === "color_yes" ? "نعم، سيتم تحديدها" : "لا، اتركها للمصمم";
  session.data.colors = choice;
  session.step = 5;

  await ctx.answerCallbackQuery();
  const kb = new InlineKeyboard().text("📎 نعم، سأرسل ملفات", "file_yes").text("➡️ لا", "file_no");
  await ctx.reply("الخطوة 5: هل لديك شعار قديم أو صور أو مراجع تريد إرسالها؟", { reply_markup: kb });
});

bot.callbackQuery(/file_/, async (ctx) => {
  const userId = ctx.from?.id || 0;
  const session = userSessions[userId];
  if (!session) return;

  const choice = ctx.callbackQuery.data === "file_yes" ? "سيتم إرسال الملفات" : "لا توجد ملفات";
  session.data.files = choice;

  // إنشاء الطلب النهائي وعرض الملخص
  const newOrderId = Math.floor(1000 + Math.random() * 9000);
  const newOrder: Order = {
    id: newOrderId,
    userId: userId,
    userName: ctx.from?.first_name || "عميل",
    serviceName: session.service || "تصميم",
    step: "منتهي",
    details: session.data,
    priceRange: session.data.priceRange || "يحدد بعد المراجعة",
    status: "قيد المراجعة",
    date: new Date().toLocaleDateString()
  };

  orders.push(newOrder);
  delete userSessions[userId]; // مسح الجلسة

  await ctx.answerCallbackQuery();
  const summaryMsg = 
    `📋 **ملخص الطلب (#${newOrderId}):**\n\n` +
    `- الخدمة: ${newOrder.serviceName}\n` +
    `- اسم المشروع: ${newOrder.details.projectName}\n` +
    `- المجال: ${newOrder.details.projectField}\n` +
    `- الفكرة: ${newOrder.details.idea}\n` +
    `- الألوان: ${newOrder.details.colors}\n` +
    `- المرفقات: ${newOrder.details.files}\n` +
    `- السعر المتوقع: ${newOrder.priceRange}\n\n` +
    `✅ تم تسجيل طلبك بنجاح وسيتواصل معك المصمم قريباً!`;

  await ctx.reply(summaryMsg, { parse_mode: "Markdown" });
});

// تشغيل البوت
bot.start();
console.log("تم بدء تشغيل بوت المحترف للتصميم بنجاح...");

// خادم HTTP للبقاء 24/7 على Render
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Design Bot is running 24/7 successfully!");
});

const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`HTTP server is listening on port ${PORT}`);
});
                    
