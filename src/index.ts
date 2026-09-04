import { Bot } from "grammy";
import { createServer } from "node:http";

// قراءة توكن البوت من متغيرات البيئة في Render، أو وضعه مباشرة هنا كاحتياط
const token = process.env.BOT_TOKEN || "ضع_التوكن_هنا";
const bot = new Bot(token);

// أمر ترحيبي بسيط للتأكد من عمل البوت
bot.command("start", (ctx) => ctx.reply("أهلاً بك! البوت يعمل بنجاح 24/7 🚀"));

// تشغيل بوت الـ Telegram
bot.start();
console.log("تم بدء تشغيل بوت التيليجرام بنجاح...");

// خادم HTTP بسيط جداً لكي يستجيب لـ Render ويمنع توقف الخدمة
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running 24/7 successfully!");
});

// الاستماع على البورت الخاص بمنصة Render
const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`HTTP server is listening on port ${PORT}`);
});
