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
const reviews: { userName: string; text: string; rating: string }[] = [];
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

const packagesList = [
  { name: "🌟 باقة انطلاقة المشروع", details: "شعار + كرت شخصي + ورق مراسلات", price: "350 د.ل" },
  { name: "🚀 باقة الهوية الكاملة", details: "شعار + هوية بصرية متكاملة + علب وتغليف", price: "1100 د.ل" },
  { name: "⚡ باقة VIP المستعجلة", details: "تسليم أي تصميم خلال 24 ساعة فقط", price: "حسب نوع الخدمة + 30%" },
];

// القائمة الرئيسية الفاخرة
const getMainKeyboard = (userId: number) => {
  const keyboard = new InlineKeyboard()
    .text("🎨 طلب تصميم جديد", "cmd_request_design").row()
    .text("📦 الباقات العروض التوفيرية", "cmd_packages").row()
    .text("🖼️ معرض الأعمال والأنماط", "cmd_portfolio").row()
    .text("💰 الخدمات والأسعار", "cmd_services").row()
    .text("⭐ آراء وتقييمات العملاء", "cmd_reviews").row()
    .text("📁 طلباتي الحالية", "cmd_my_orders").row()
    .text("📞 التواصل المباشر مع المصمم", "cmd_contact").row()
    .text("ℹ️ حول الفخامة للتصميم", "cmd_help");

  if (userId === ADMIN_CHAT_ID) {
    keyboard.row().text("👑 لوحة تحكم الإدارة", "admin_panel_home");
  }

  return keyboard;
};

// لوحة الإدارة
const adminPanelKeyboard = new InlineKeyboard()
  .text("📋 عرض كل الطلبات", "admin_list_orders").row()
  .text("📊 إحصائيات وتقارير البوت", "admin_stats").row()
  .text("🔙 العودة للقائمة الرئيسية", "back_to_main");

bot.command("start", async (ctx) => {
  const userId = ctx.from?.id || 0;
  const welcomeText = 
    `👑 **أهلاً بك في بوت الفخامة للتصميم**\n\n` +
    `نقدم لك أفضل الحلول البصرية والهويات التجارية المتكاملة بأعلى جودة واحترافية.\n\n` +
    `اختر ما يناسب احتياجك من القائمة الرئيسية التفاعلية أدناه:`;
  
  await ctx.reply(welcomeText, { reply_markup: getMainKeyboard(userId), parse_mode: "Markdown" });
});

bot.command("admin", async (ctx) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) return;
  await ctx.reply("👑 **لوحة تحكم إدارة الفخامة للتصميم:**", { reply_markup: adminPanelKeyboard, parse_mode: "Markdown" });
});

bot.callbackQuery("admin_panel_home", async (ctx) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) return;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("👑 **لوحة تحكم إدارة الفخامة للتصميم:**", { reply_markup: adminPanelKeyboard, parse_mode: "Markdown" });
});

bot.callbackQuery("back_to_main", async (ctx) => {
  const userId = ctx.from?.id || 0;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("👑 **القائمة الرئيسية - الفخامة للتصميم:**", { reply_markup: getMainKeyboard(userId), parse_mode: "Markdown" });
});

// عرض الخدمات والأسعار
bot.callbackQuery("cmd_services", async (ctx) => {
  await ctx.answerCallbackQuery();
  let msg = "💰 **قائمة خدمات وأسعار الفخامة للتصميم:**\n\n";
  servicesList.forEach(s => {
    msg += `${s.name} : ${s.price}\n`;
  });
  await ctx.reply(msg, { parse_mode: "Markdown" });
});

// عرض الباقات
bot.callbackQuery("cmd_packages", async (ctx) => {
  await ctx.answerCallbackQuery();
  let msg = "📦 **الباقات والحلول المتكاملة (العروض التوفيرية):**\n\n";
  packagesList.forEach(p => {
    msg += `🔹 **${p.name}**\n📝 المكونات: ${p.details}\n💵 السعر: ${p.price}\n------------------\n`;
  });
  msg += `_💡 لطلب أي باقة، اضغط على زر "طلب تصميم جديد" واختر الباقة المطلوب تصميمها!_`;
  await ctx.reply(msg, { parse_mode: "Markdown" });
});

// معرض الأعمال
bot.callbackQuery("cmd_portfolio", async (ctx) => {
  await ctx.answerCallbackQuery();
  const msg = 
    `🖼️ **معرض أعمال الفخامة للتصميم**\n\n` +
    `نصنع العلامات التجارية والأنماط البصرية الفريدة التي تترك انطباعاً راقياً لدى عملائك.\n\n` +
    `📌 **مجالات تميزنا:**\n` +
    `• رسم الشعارات وبناء الهويات التجارية البصرية الكاملة.\n` +
    `• تصميم المنتجات، العلب، والأكياس الورقية والكرتونية.\n` +
    `• ابتكار نمط الـ Pattern الخاص بالشركات.\n\n` +
    `💡 *يمكنك مراسلتنا بطلب عينات خاصة بمجال عملك وسنرسلها لك فوراً!*`;
  
  await ctx.reply(msg, { parse_mode: "Markdown" });
});

// قسم التقييمات
bot.callbackQuery("cmd_reviews", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (reviews.length === 0) {
    await ctx.reply("⭐ **تقييمات العملاء:**\n\nنحن نسعى دائماً لتقديم أفضل خدمة! كن أول من يطلب ويشاركنا رأيه الان.");
  } else {
    let msg = "⭐ **آراء وتقييمات عملاء الفخامة للتصميم:**\n\n";
    reviews.forEach(r => {
      msg += `👤 **${r.userName}**: ${r.rating}\n💬 "${r.text}"\n------------------\n`;
    });
    await ctx.reply(msg, { parse_mode: "Markdown" });
  }
});

// بدء الطلب
bot.callbackQuery("cmd_request_design", async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard();
  
  // إضافة الخدمات
  servicesList.forEach((s, index) => {
    keyboard.text(s.name, `srv_${index}`).row();
  });
  
  // إضافة الباقات كخيارات طلب مباشرة
  packagesList.forEach((p, index) => {
    keyboard.text(`📦 ${p.name}`, `pkg_${index}`).row();
  });

  await ctx.reply("اختر الخدمة أو الباقة المطلوبة لبدء الطلب:", { reply_markup: keyboard });
});

bot.callbackQuery("cmd_contact", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("📞 أهلاً بك! اكتب استفسارك أو التفاصيل التي تريدها هنا مباشرة، وسيتم تحويلها فوراً إلى المصمم للرد عليك.");
});

bot.callbackQuery("cmd_help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("ℹ️ **عن الفخامة للتصميم:**\nنحن متخصصون في الابتكار والتصميم البصري والشعارات بالمعايير الفنية العالية لتلبي تطلعات العلامات التجارية الرائدة.");
});

// معالجة لوحة الإدارة
bot.callbackQuery("admin_list_orders", async (ctx) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) return;
  await ctx.answerCallbackQuery();
  
  if (orders.length === 0) {
    await ctx.reply("📭 لا توجد أي طلبات مسجلة حالياً.");
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
  await ctx.reply(`📊 **إحصائيات بوت الفخامة للتصميم:**\n\n- عدد الخدمات: ${servicesList.length}\n- عدد الباقات: ${packagesList.length}\n- إجمالي الطلبات: ${orders.length}\n- حالة الاتصال: متصل 24/7 🟢`);
});

// معالجة اختيار الخدمات والبيانات والتحديثات التفاعلية
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from?.id || 0;

  // تغيير حالة الطلب من قبل المدير بضغطة زر
  if (data.startsWith("st_") && userId === ADMIN_CHAT_ID) {
    const parts = data.split("_");
    const newStatus = parts[1];
    const orderId = parseInt(parts[2]);

    const order = orders.find(o => o.id === orderId);
    if (order) {
      let statusText = "قيد التجهيز ⏳";
      if (newStatus === "done") statusText = "مكتمل وجاهز ✅";
      if (newStatus === "cancel") statusText = "ملغي ❌";

      order.status = statusText;
      await ctx.answerCallbackQuery({ text: `تم تحديث حالة الطلب #${orderId} إلى: ${statusText}` });

      // إشعار الزبون بحدث التحديث
      try {
        await bot.api.sendMessage(
          order.userId, 
          `🔔 **تحديث بشأن طلبك (#${orderId}):**\n\nأصبحت حالة طلبك الآن: **${statusText}**`
        );
      } catch (e) {
        console.error("خطأ إرسال التحديث للزبون:", e);
      }
    }
    return;
  }

  if (data.startsWith("srv_") || data.startsWith("pkg_")) {
    let selectedName = "";
    let selectedPrice = "";

    if (data.startsWith("srv_")) {
      const srvIndex = parseInt(data.replace("srv_", ""));
      selectedName = servicesList[srvIndex].name;
      selectedPrice = servicesList[srvIndex].price;
    } else {
      const pkgIndex = parseInt(data.replace("pkg_", ""));
      selectedName = packagesList[pkgIndex].name;
      selectedPrice = packagesList[pkgIndex].price;
    }

    userSessions[userId] = {
      service: selectedName,
      step: 1,
      data: { priceRange: selectedPrice }
    };

    await ctx.answerCallbackQuery();
    await ctx.reply(`لقد اخترت: **${selectedName}**\n\nالخطوة 1: ما هو اسم المشروع أو العلامة التجارية؟`, { parse_mode: "Markdown" });
  } 
  else if (data === "cmd_my_orders") {
    await ctx.answerCallbackQuery();
    const userOrders = orders.filter(o => o.userId === userId);
    if (userOrders.length === 0) {
      await ctx.reply("📦 ليس لديك أي طلبات مسجلة حتى الآن.");
    } else {
      let msg = "📦 **سجل طلباتك لدى الفخامة للتصميم:**\n\n";
      userOrders.forEach(o => {
        msg += `رقم الطلب: #${o.id}\nالخدمة: ${o.serviceName}\nالحالة: ${o.status}\nالتاريخ: ${o.date}\n------------------\n`;
      });
      await ctx.reply(msg, { parse_mode: "Markdown" });
    }
  } 
  else if (data === "color_yes" || data === "color_no") {
    const session = userSessions[userId];
    if (!session) {
      await ctx.answerCallbackQuery({ text: "انتهت الجلسة، أعد البدء من جديد عبر /start" });
      return;
    }

    session.data.colors = data === "color_yes" ? "نعم، سيتم تحديدها" : "لا، اتركها للتذوق الفني للمصمم";
    session.step = 5;

    await ctx.answerCallbackQuery();
    const kb = new InlineKeyboard().text("📎 نعم، سأرسل ملفات", "file_yes").text("➡️ لا يوجد", "file_no");
    await ctx.reply("الخطوة 5: هل لديك شعار قديم أو صور ومراجع تحب إرفاقها؟", { reply_markup: kb });
  }
  else if (data === "file_yes" || data === "file_no") {
    const session = userSessions[userId];
    if (!session) {
      await ctx.answerCallbackQuery({ text: "انتهت الجلسة، أعد البدء من جديد عبر /start" });
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
      priceRange: session.data.priceRange || "يحدد بعد المراجع",
      status: "قيد المراجعة ⏳",
      date: new Date().toLocaleDateString()
    };

    orders.push(newOrder);
    delete userSessions[userId];

    await ctx.answerCallbackQuery();

    // إرسال الإشعار للمدير مع أزرار التحكم السريعة بحالة الطلب
    try {
      const adminMsg = 
        `🚨 **طلب تصميم جديد! (#${newOrderId})**\n\n` +
        `👤 العميل: ${clientName} (${clientUsername})\n` +
        `🆔 معرف المستخدم: \`${userId}\`\n` +
        `🎨 الخدمة/الباقة: ${newOrder.serviceName}\n` +
        `📌 اسم المشروع: ${newOrder.details.projectName}\n` +
        `🏷️ المجال: ${newOrder.details.projectField}\n` +
        `💡 الفكرة: ${newOrder.details.idea}\n` +
        `🎨 الألوان: ${newOrder.details.colors}\n` +
        `📎 المرفقات: ${newOrder.details.files}\n` +
        `💰 السعر المتوقع: ${newOrder.priceRange}`;

      const adminOrderKb = new InlineKeyboard()
        .text("⏳ قيد التجهيز", `st_process_${newOrderId}`)
        .text("✅ إنجاز", `st_done_${newOrderId}`)
        .text("❌ إلغاء", `st_cancel_${newOrderId}`);

      await bot.api.sendMessage(ADMIN_CHAT_ID, adminMsg, { reply_markup: adminOrderKb, parse_mode: "Markdown" });
    } catch (err) {
      console.error("خطأ إرسال الإشعار للمدير:", err);
    }

    // تأكيد الطلب للزبون
    const summaryMsg = 
      `✅ **تم تسجيل طلبك بنجاح في الفخامة للتصميم (#${newOrderId})**\n\n` +
      `- الخدمة: ${newOrder.serviceName}\n` +
      `- المشروع: ${newOrder.details.projectName}\n` +
      `- المجال: ${newOrder.details.projectField}\n` +
      `- السعر المتوقع: ${newOrder.priceRange}\n\n` +
      `سيتم مراجعة الطلب والتواصل معك قريباً جداً!`;

    await ctx.reply(summaryMsg, { parse_mode: "Markdown" });
  }
});

// معالجة الرسائل النصية
bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id || 0;
  const text = ctx.message.text;

  if (text.startsWith("/")) return;

  // 1. رد المدير على الزبون باستخدام الـ Reply
  if (userId === ADMIN_CHAT_ID && ctx.message.reply_to_message) {
    const repliedText = ctx.message.reply_to_message.text || "";
    const matchId = repliedText.match(/معرف المستخدم: `(\d+)`/) || repliedText.match(/معرف المستخدم \(ID: (\d+)\)/);
    
    if (matchId && matchId[1]) {
      const targetUserId = parseInt(matchId[1]);
      try {
        await bot.api.sendMessage(targetUserId, `💬 **رد من إدارة الفخامة للتصميم:**\n\n${text}`);
        await ctx.reply("✅ تم إرسال الرد إلى الزبون بنجاح!");
      } catch (e) {
        await ctx.reply("❌ فشل الإرسال، قد يكون الزبون قام بحظر البوت.");
      }
      return;
    }
  }

  // 2. خطوات الطلب
  const session = userSessions[userId];
  if (session && session.step) {
    if (session.step === 1) {
      session.data.projectName = text;
      session.step = 2;
      await ctx.reply("الخطوة 2: ما هو مجال المشروع؟ (مثل: مطعم، شركة مقاولات، متجر أزياء)");
    } else if (session.step === 2) {
      session.data.projectField = text;
      session.step = 3;
      await ctx.reply("الخطوة 3: اشرح فكرتك والتصور المطلوب للتصميم بشكل مختصر.");
    } else if (session.step === 3) {
      session.data.idea = text;
      session.step = 4;
      const kb = new InlineKeyboard().text("🎨 نعم", "color_yes").text("⚪ اتركها للمصمم", "color_no");
      await ctx.reply("الخطوة 4: هل لديك ألوان مفضلة تريد اعتمادها؟", { reply_markup: kb });
    }
    return;
  }

  // 3. توجيه استفسارات الزبائن للمدير
  if (userId !== ADMIN_CHAT_ID) {
    const clientName = ctx.from?.first_name || "عميل";
    const clientUsername = ctx.from?.username ? `@${ctx.from.username}` : "بدون معرف";
    
    try {
      const forwardMsg = 
        `📩 **استفسار جديد من عميل!**\n` +
        `👤 الاسم: ${clientName} (${clientUsername})\n` +
        `🆔 معرف المستخدم (ID: ${userId})\n\n` +
        `💬 الرسالة:\n${text}\n\n` +
        `_💡 للرد على هذا العميل، قم بعمل Reply (رد) على هذه الرسالة واكتب ردك._`;

      await bot.api.sendMessage(ADMIN_CHAT_ID, forwardMsg, { parse_mode: "Markdown" });
      await ctx.reply("✅ تم تحويل رسالتك إلى إدارة الفخامة للتصميم، وسيتم الرد عليك فوراً!");
    } catch (err) {
      console.error("خطأ تحويل الرسالة:", err);
    }
  }
});

bot.start();

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Luxury Design Bot is running smoothly!");
});

const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
      
