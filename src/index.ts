import { Bot, InlineKeyboard } from "grammy";
import { createServer } from "node:http";

const token = process.env.BOT_TOKEN || "ضع_التوكن_هنا";
const bot = new Bot(token);

const ADMIN_CHAT_ID = 7812617493;

interface Order {
  id: number;
  userId: number;
  userName: string;
  serviceName: string;
  details: {
    projectName?: string;
    projectField?: string;
    idea?: string;
    colors?: string;
    files?: string;
  };
  priceRange: string;
  status: string;
  date: string;
}

const orders: Order[] = [];
const userSessions: Record<number, { service?: string; step?: number; data: any }> = {};

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

// قائمة الزبون العادية
const mainMenu = new InlineKeyboard()
  .text("🎨 طلب تصميم", "cmd_request_design").row()
  .text("💰 الخدمات والأسعار", "cmd_services").row()
  .text("📦 طلباتي", "cmd_my_orders").row()
  .text("📞 التواصل معنا", "cmd_contact").row()
  .text("ℹ️ طريقة الاستخدام", "cmd_help");

// لوحة أزرار التحكم الخاصة بالمصمم (المدير)
const adminPanelKeyboard = new InlineKeyboard()
  .text("📋 عرض كل الطلبات", "admin_list_orders").row()
  .text("📊 إحصائيات البوت", "admin_stats").row()
  .text("⚙️ حالة البوت: يعمل بنجاح 🟢", "admin_status");

bot.command("start", async (ctx) => {
  const userId = ctx.from?.id;

  // إذا كنت أنت المدير، نرحب بك ونعطيك خيار فتح لوحة التحكم
  if (userId === ADMIN_CHAT_ID) {
    const adminWelcome = 
      `👑 **أهلاً بك يا عبد الرؤوف في لوحة تحكم بوت المحترف للتصميم!**\n\n` +
      `يمكنك استعراض الطلبات أو إدارة البوت من الأزرار بالأسفل، أو استخدام خاصية الـ (Reply) للرد على أي رسالة تصلك من الزبائن مباشرة:`;
    await ctx.reply(adminWelcome, { reply_markup: adminPanelKeyboard, parse_mode: "Markdown" });
    return;
  }

  // ترحيب الزبون العادي
  const welcomeText = 
    `👋 أهلاً بك في خدمات المحترف للتصميم\n` +
    `نساعدك في تحويل فكرتك إلى تصميم احترافي يناسب مشروعك وعلامتك التجارية.\n\n` +
    `اختر ما تريد من القائمة بالأسفل:`;
  
  await ctx.reply(welcomeText, { reply_markup: mainMenu });
});

// أمر سريع لفتح لوحة التحكم للمدير في أي وقت
bot.command("admin", async (ctx) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) return;
  await ctx.reply("👑 **لوحة تحكم الإدارة:**", { reply_markup: adminPanelKeyboard, parse_mode: "Markdown" });
});

bot.callbackQuery("cmd_services", async (ctx) => {
  await ctx.answerCallbackQuery();
  let msg = "💰 **قائمة الخدمات والأسعار الأساسية:**\n\n";
  servicesList.forEach(s => {
    msg += `${s.name} : ${s.price}\n`;
  });
  await ctx.reply(msg);
});

bot.callbackQuery("cmd_request_design", async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard();
  servicesList.forEach((s, index) => {
    keyboard.text(s.name, `srv_${index}`).row();
  });
  await ctx.reply("اختر الخدمة المطلوبة من القائمة:", { reply_markup: keyboard });
});

bot.callbackQuery("cmd_contact", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("📞 أهلاً بك! اكتب رسالتك أو استفسارك هنا، وسيتم تحويله مباشرة إلى المصمم وسيتم الرد عليك في أقرب وقت.");
});

bot.callbackQuery("cmd_help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("ℹ️ طريقة الاستخدام:\n1. اضغط 'طلب تصميم'\n2. حدد الخدمة المطلوبة\n3. أجب عن خطوات المشروع البسيطة\n4. سيصلك رقم الطلب ويتم متابعته معك مباشرة!");
});

// معالجة أزرار المدير (الإدارة)
bot.callbackQuery("admin_list_orders", async (ctx) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) return;
  await ctx.answerCallbackQuery();
  
  if (orders.length === 0) {
    await ctx.reply("📭 لا توجد أي طلبات مسجلة حتى الآن.");
  } else {
    let msg = `📋 **قائمة الطلبات المسجلة (${orders.length}):**\n\n`;
    orders.forEach(o => {
      msg += `🔹 طلب #${o.id}\n👤 العميل: ${o.userName}\n🎨 الخدمة: ${o.serviceName}\n📌 المشروع: ${o.details.projectName}\nالحالة: ${o.status}\n------------------\n`;
    });
    await ctx.reply(msg, { parse_mode: "Markdown" });
  }
});

bot.callbackQuery("admin_stats", async (ctx) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) return;
  await ctx.answerCallbackQuery();
  await ctx.reply(`📊 **إحصائيات بوت المحترف:**\n\n- عدد الخدمات المتاحة: ${servicesList.length} خدمة\n- عدد الطلبات الإجمالية: ${orders.length} طلب\n- حالة السيرفر: متصل 24/7 🟢`);
});

bot.callbackQuery("admin_status", async (ctx) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) return;
  await ctx.answerCallbackQuery({ text: "البوت يعمل بكفاءة تامة على Render!" });
});

// معالجة الأزرار العامة والطلبات
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
  } 
  else if (data === "cmd_my_orders") {
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
  } 
  else if (data === "color_yes" || data === "color_no") {
    const session = userSessions[userId];
    if (!session) {
      await ctx.answerCallbackQuery({ text: "انتهت الجلسة، الرجاء البدء من جديد عبر /start" });
      return;
    }

    session.data.colors = data === "color_yes" ? "نعم، سيتم تحديدها" : "لا، اتركها للمصمم";
    session.step = 5;

    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard().text("📎 نعم، سأرسل ملفات", "file_yes").text("➡️ لا", "file_no");
    await ctx.reply("الخطوة 5: هل لديك شعار قديم أو صور أو مراجع تريد إرسالها؟", { reply_markup: kb });
  }
  else if (data === "file_yes" || data === "file_no") {
    const session = userSessions[userId];
    if (!session) {
      await ctx.answerCallbackQuery({ text: "انتهت الجلسة، الرجاء البدء من جديد عبر /start" });
      return;
    }

    session.data.files = data === "file_yes" ? "سيتم إرسال الملفات" : "لا توجد ملفات";

    const newOrderId = Math.floor(1000 + Math.random() * 9000);
    const clientName = ctx.from?.first_name || "عميل";
    const clientUsername = ctx.from?.username ? `@${ctx.from.username}` : "لا يوجد معرف";

    const newOrder: Order = {
      id: newOrderId,
      userId: userId,
      userName: clientName,
      serviceName: session.service || "تصميم",
      details: session.data,
      priceRange: session.data.priceRange || "يحدد بعد المراجعة",
      status: "قيد المراجعة",
      date: new Date().toLocaleDateString()
    };

    orders.push(newOrder);
    delete userSessions[userId];

    await ctx.answerCallbackQuery();

    // إشعار المدير مع زر لوحة التحكم السريعة
    try {
      const adminMsg = 
        `🚨 **طلب تصميم جديد! (#${newOrderId})**\n\n` +
        `👤 اسم العميل: ${clientName} (${clientUsername})\n` +
        `🆔 معرف المستخدم: \`${userId}\`\n` +
        `🎨 الخدمة: ${newOrder.serviceName}\n` +
        `📌 اسم المشروع: ${newOrder.details.projectName}\n` +
        `🏷️ المجال: ${newOrder.details.projectField}\n` +
        `💡 الفكرة: ${newOrder.details.idea}\n` +
        `🎨 الألوان: ${newOrder.details.colors}\n` +
        `📎 المرفقات: ${newOrder.details.files}\n` +
        `💰 السعر المتوقع: ${newOrder.priceRange}`;

      await bot.api.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("خطأ في إرسال الإشعار للمدير:", err);
    }

    // تأكيد للعميل
    const summaryMsg = 
      `📋 **ملخص الطلب (#${newOrderId}):**\n\n` +
      `- الخدمة: ${newOrder.serviceName}\n` +
      `- اسم المشروع: ${newOrder.details.projectName}\n` +
      `- المجال: ${newOrder.details.projectField}\n` +
      `- السعر المتوقع: ${newOrder.priceRange}\n\n` +
      `✅ تم تسجيل طلبك بنجاح وسيتم التواصل معك من قبل المصمم قريباً!`;

    await ctx.reply(summaryMsg, { parse_mode: "Markdown" });
  }
});

// معالجة الرسائل النصية
bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id || 0;
  const text = ctx.message.text;

  if (text.startsWith("/")) return;

  // 1. رد المدير على الزبون عبر Reply
  if (userId === ADMIN_CHAT_ID && ctx.message.reply_to_message) {
    const repliedText = ctx.message.reply_to_message.text || "";
    const matchId = repliedText.match(/معرف المستخدم: `(\d+)`/) || repliedText.match(/معرف المستخدم \(ID: (\d+)\)/);
    
    if (matchId && matchId[1]) {
      const targetUserId = parseInt(matchId[1]);
      try {
        await bot.api.sendMessage(targetUserId, `💬 **رد من إدارة المحترف للتصميم:**\n\n${text}`);
        await ctx.reply("✅ تم إرسال الرد إلى الزبون بنجاح!");
      } catch (e) {
        await ctx.reply("❌ فشل إرسال الرد، قد يكون الزبون حظر البوت.");
      }
      return;
    }
  }

  // 2. خطوات الزبون لطلب التصميم
  const session = userSessions[userId];
  if (session && session.step) {
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
    return;
  }

  // 3. تحويل استفسارات الزبائن العادية إليك
  if (userId !== ADMIN_CHAT_ID) {
    const clientName = ctx.from?.first_name || "عميل";
    const clientUsername = ctx.from?.username ? `@${ctx.from.username}` : "بدون معرف";
    
    try {
      const forwardMsg = 
        `📩 **استفسار جديد من الزبون!**\n` +
        `👤 الاسم: ${clientName} (${clientUsername})\n` +
        `🆔 معرف المستخدم (ID: ${userId})\n\n` +
        `💬 الرسالة:\n${text}\n\n` +
        `_💡 للرد على هذا الزبون، قم بعمل Reply (رد) على هذه الرسالة واكتب ردك._`;

      await bot.api.sendMessage(ADMIN_CHAT_ID, forwardMsg, { parse_mode: "Markdown" });
      await ctx.reply("✅ تم إرسال رسالتك إلى الإدارة بنجاح، سيتم الرد عليك قريباً!");
    } catch (err) {
      console.error("خطأ في تحويل الاستفسار:", err);
    }
  }
});

bot.start();
console.log("تم تشغيل البوت بنظام لوحة تحكم الأزرار والرد المباشر...");

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Design Bot with Admin Panel is running 24/7!");
});

const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
    
