import { Bot, InlineKeyboard } from "grammy";
import { createServer } from "node:http";

// قراءة توكن البوت من متغيرات البيئة في Render
const token = process.env.BOT_TOKEN || "ضع_التوكن_هنا";
const bot = new Bot(token);

// إعداد القائمة الرئيسية والأزرار التفاعلية (Inline Keyboards)
const mainMenuKeyboard = new InlineKeyboard()
  .text("🎨 طلب تصميم", "request_design").row()
  .text("💰 الخدمات والأسعار", "services_prices").row()
  .text("📦 طلباتي", "my_orders").row()
  .text("📞 التواصل معنا", "contact_us").row()
  .text("ℹ️ طريقة الاستخدام", "how_to_use");

// أمر البدء /start مع رسالة الترحيب والأزرار
bot.command("start", async (ctx) => {
  const welcomeMessage = 
    `🌟 **أهلاً بك في خدمات التصميم**\n` +
    `في عالم تتزاحم فيه الأفكار وتتعدد فيه الأصوات، نطلق من قلب ليبيا 🇱🇾 لنحول رؤيتك إلى واقع بصري يأسر الألباب 👁️✨. في "الفخامة"، لا نصمم مجرد أشكال ورسومات، بل ننسج لكل مشروع قصته الخاصة 📖🖋️، ونمنح علامتكم التجارية هويتها الاستثنائية التي تعكس الرقي وتترك انطباعاً لا يُنسى 💎🚀.\n\n` +
    `بين الإبداع العاصف والدقة المتناهية ⚡📐، نرافقكم خطوة بخطوة من الفكرة الأولى وحتى تفاصيل الظهور الأخير، لنسطر معاً نجاحاً يتحدث عن نفسه ✨.\n\n` +
    `اختار ما تريد من القائمة بالأسفل:`;

  await ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: mainMenuKeyboard,
  });
});

// التعامل مع نقرات الأزرار
bot.callbackQuery("request_design", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("🎨 لبدء طلب تصميم جديد، يرجى كتابة تفاصيل فكرتك أو مشروعك هنا وسنتواصل معك قريباً!");
});

bot.callbackQuery("services_prices", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("💰 إليك قائمة خدماتنا وأسعارنا التنافسية:\n- تصميم هوية تجارية متكاملة\n- شعارات وبانرات\n- تصاميم سوشيال ميديا");
});

bot.callbackQuery("my_orders", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("📦 ليس لديك طلبات نشطة حالياً.");
});

bot.callbackQuery("contact_us", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("📞 يمكنك التواصل معنا مباشرة عبر مراسلة الدعم الفني.");
});

bot.callbackQuery("how_to_use", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("ℹ️ طريقة الاستخدام بسيطة جداً: فقط اضغط على 'طلب تصميم' واتبع التعليمات.");
});

// تشغيل البوت
bot.start();
console.log("تم بدء تشغيل بوت التيليجرام بكامل الأزرار والخدمات بنجاح...");

// خادم HTTP للبقاء 24/7 على Render
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running 24/7 successfully!");
});

const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`HTTP server is listening on port ${PORT}`);
});
