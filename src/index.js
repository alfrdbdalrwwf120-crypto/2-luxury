const { Bot, InlineKeyboard } = require("grammy");
const { createServer } = require("node:http");

// التوكن ومعرف الأدمن
const token = process.env.BOT_TOKEN || "ضع_التوكن_هنا";
const bot = new Bot(token);

const ADMIN_CHAT_ID = 7812617493;

// إدارة البيانات
const orders = [];
const reviews = [
  { userName: "محمد أ.", rating: "⭐⭐⭐⭐⭐", text: "تصميم شعار احترافي جداً وتعامل راقي." },
  { userName: "سارة م.", rating: "⭐⭐⭐⭐⭐", text: "هوية بصرية متكاملة وفاخرة، شكراً لـ المحترف للتصميم." }
];
const portfolioItems = [];
const userSessions = {};

// القوائم والخدمات
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
  { name: "🎨 تصميم مجلة", price: "من 40 إلى 60 د.ل لكل صفحة" }
];

const packagesList = [
  { name: "🌟 باقة انطلاقة المشروع", details: "شعار + كرت شخصي + ورق مراسلات", price: "350 د.ل" },
  { name: "🚀 باقة الهوية الكاملة", details: "شعار + هوية بصرية متكاملة + علب وتغليف", price: "1100 د.ل" },
  { name: "⚡ باقة VIP المستعجلة", details: "تسليم أي تصميم خلال 24 ساعة فقط", price: "حسب نوع الخدمة + 30%" }
];

function cleanText(str) {
  if (!str) return "";
  return String(str).replace(/[_*`\[\]]/g, "");
}

function getMainKeyboard(userId) {
  const keyboard = new InlineKeyboard()
    .text("🎨 طلب تصميم جديد", "cmd_request_design").row()
    .text("📂 استلام ملفات المشروع (PDF / PNG / ZIP)", "cmd_get_files").row()
    .text("💎 استشارة بصرية سريعة (VIP)", "cmd_vip_consult").row()
    .text("📦 الباقات والعروض التوفيرية", "cmd_packages").row()
    .text("🖼️ معرض الأعمال (صور النماذج)", "cmd_portfolio").row()
    .text("💰 الخدمات والأسعار", "cmd_services").row()
    .text("⭐ آراء وتقييمات العملاء", "cmd_reviews").row()
    .text("✍️ أضف تقييمك الآن", "cmd_add_review").row()
    .text("📁 طلباتي الحالية", "cmd_my_orders").row()
    .text("📞 التواصل المباشر مع المصمم", "cmd_contact").row()
    .text("ℹ️ حول المحترف للتصميم", "cmd_help");

  if (Number(userId) === ADMIN_CHAT_ID) {
    keyboard.row().text("👑 لوحة تحكم الإدارة", "admin_panel_home");
  }

  return keyboard;
}

const adminPanelKeyboard = new InlineKeyboard()
  .text("📋 عرض كل الطلبات", "admin_list_orders").row()
  .text("➕ إضافة نموذج جديد للمعرض", "admin_add_portfolio").row()
  .text("📊 إحصائيات وتقارير البوت", "admin_stats").row()
  .text("🔙 العودة للقائمة الرئيسية", "back_to_main");

// معالج الأخطاء لمنع توقف البوت
bot.catch((err) => {
  console.error("حدث خطأ استثنائي وتم معالجته:", err.error);
});

// الأوامر
bot.command("start", async (ctx) => {
  const userId = ctx.from ? ctx.from.id : 0;
  const welcomeText = 
    "✨ أهلاً بك في المحترف للتصميم ✨\n\n" +
    "نقدم لك أفخم الحلول البصرية والهويات التجارية المتكاملة بأعلى معايير الجودة والاحترافية.\n\n" +
    "اختر ما يناسبك من القائمة الرئيسية أدناه:";
  
  await ctx.reply(welcomeText, { reply_markup: getMainKeyboard(userId) });
});

bot.command("admin", async (ctx) => {
  if (ctx.from && ctx.from.id === ADMIN_CHAT_ID) {
    await ctx.reply("👑 لوحة تحكم إدارة المحترف للتصميم:", { reply_markup: adminPanelKeyboard });
  }
});

// التفاعلات والأزرار
bot.callbackQuery("admin_panel_home", async (ctx) => {
  if (ctx.from && ctx.from.id === ADMIN_CHAT_ID) {
    await ctx.answerCallbackQuery().catch(() => {});
    await ctx.editMessageText("👑 لوحة تحكم إدارة المحترف للتصميم:", { reply_markup: adminPanelKeyboard });
  }
});

bot.callbackQuery("back_to_main", async (ctx) => {
  const userId = ctx.from ? ctx.from.id : 0;
  await ctx.answerCallbackQuery().catch(() => {});
  await ctx.editMessageText("✨ القائمة الرئيسية - المحترف للتصميم:", { reply_markup: getMainKeyboard(userId) });
});

bot.callbackQuery("cmd_services", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  let msg = "💰 قائمة خدمات وأسعار المحترف للتصميم:\n\n";
  servicesList.forEach(s => {
    msg += `${s.name} : ${s.price}\n`;
  });
  await ctx.reply(msg);
});

bot.callbackQuery("cmd_packages", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  let msg = "📦 الباقات والحلول المتكاملة:\n\n";
  packagesList.forEach(p => {
    msg += `🔹 ${p.name}\n📝 المكونات: ${p.details}\n💵 السعر: ${p.price}\n------------------\n`;
  });
  await ctx.reply(msg);
});

bot.callbackQuery("cmd_get_files", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const userId = ctx.from ? ctx.from.id : 0;
  userSessions[userId] = { step: 70, data: {} };

  await ctx.reply(
    "📂 طلب استلام ملفات المشروع:\n\n" +
    "أرسل رقم الطلب الخاص بك في رسالة (مثال: 1234) وسنقوم بتجهيز الصور والملفات وإرسالها لك مباشرة!"
  );
});

bot.callbackQuery("cmd_vip_consult", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const userId = ctx.from ? ctx.from.id : 0;
  userSessions[userId] = { step: 50, data: {} };
  
  await ctx.reply(
    "💎 خدمة الاستشارة البصرية (VIP):\n\n" +
    "أرسل لنا تصميمك الحالي أو الفكرة التي تفكر بها، وسيتم تقييمها وإعطاؤك توجيهاً فنياً مخصصاً!"
  );
});

bot.callbackQuery("cmd_portfolio", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});

  if (portfolioItems.length === 0) {
    await ctx.reply("🖼️ معرض أعمال المحترف للتصميم:\n\nقريباً يتم رفع أحدث النماذج والتصاميم الحصرية!");
    return;
  }

  await ctx.reply("🖼️ إليك نماذج من أحدث أعمال المحترف للتصميم:");
  for (const item of portfolioItems) {
    try {
      await ctx.replyWithPhoto(item.fileId, { caption: item.caption });
    } catch (e) {}
  }
});

bot.callbackQuery("admin_add_portfolio", async (ctx) => {
  if (ctx.from && ctx.from.id === ADMIN_CHAT_ID) {
    await ctx.answerCallbackQuery().catch(() => {});
    userSessions[ADMIN_CHAT_ID] = { step: 80, data: {} };
    await ctx.reply("🖼️ إضافة تصميم جديد للمعرض:\n\nقم بإرسال الصورة الآن مباشرة، واكتب التفاصيل/الوصف في خانة الشرح (Caption).");
  }
});

bot.callbackQuery("cmd_reviews", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  let msg = "⭐ آراء وتقييمات العملاء:\n\n";
  reviews.forEach(r => {
    msg += `👤 ${cleanText(r.userName)} - ${r.rating}\n💬 "${cleanText(r.text)}"\n------------------\n`;
  });
  await ctx.reply(msg);
});

bot.callbackQuery("cmd_add_review", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const kb = new InlineKeyboard()
    .text("⭐⭐⭐⭐⭐ (ممتاز جداً)", "rate_5").row()
    .text("⭐⭐⭐⭐ (جيد جداً)", "rate_4").row()
    .text("⭐⭐⭐ (جيد)", "rate_3");

  await ctx.reply("⭐ اختر تقييمك لخدمات المحترف للتصميم:", { reply_markup: kb });
});

bot.callbackQuery("cmd_request_design", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const keyboard = new InlineKeyboard();
  servicesList.forEach((s, index) => {
    keyboard.text(s.name, `srv_${index}`).row();
  });
  packagesList.forEach((p, index) => {
    keyboard.text(`📦 ${p.name}`, `pkg_${index}`).row();
  });
  await ctx.reply("اختر الخدمة أو الباقة المطلوبة لبدء الطلب:", { reply_markup: keyboard });
});

bot.callbackQuery("cmd_contact", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  await ctx.reply("📞 أهلاً بك! اكتب استفسارك أو التفاصيل هنا مباشرة، وسيتم تحويلها فوراً للمصمم للرد عليك.");
});

bot.callbackQuery("cmd_help", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  await ctx.reply("ℹ️ عن المحترف للتصميم:\nمتخصصون في صناعة الهويات البصرية والشعارات والتصاميم المبتكرة بأعلى معايير الفخامة والاحترافية.");
});

bot.callbackQuery("admin_list_orders", async (ctx) => {
  if (ctx.from && ctx.from.id === ADMIN_CHAT_ID) {
    await ctx.answerCallbackQuery().catch(() => {});
    if (orders.length === 0) {
      await ctx.reply("📭 لا توجد أي طلبات مسجلة حالياً.");
    } else {
      let msg = `📋 قائمة الطلبات المسجلة (${orders.length}):\n\n`;
      orders.forEach(o => {
        msg += `🔹 طلب #${o.id}\n👤 العميل: ${cleanText(o.userName)}\n🎨 الخدمة: ${o.serviceName}\n📌 المشروع: ${cleanText(o.details.projectName || "غير محدد")}\nالحالة: ${o.status}\n------------------\n`;
      });
      await ctx.reply(msg);
    }
  }
});

bot.callbackQuery("admin_stats", async (ctx) => {
  if (ctx.from && ctx.from.id === ADMIN_CHAT_ID) {
    await ctx.answerCallbackQuery().catch(() => {});
    await ctx.reply(`📊 إحصائيات بوت المحترف للتصميم:\n\n- الخدمات المتاحة: ${servicesList.length}\n- إجمالي الطلبات: ${orders.length}\n- نماذج المعرض: ${portfolioItems.length}\n- التقييمات المسجلة: ${reviews.length}\n- الحالة: متصل 24/7 🟢`);
  }
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from ? ctx.from.id : 0;

  if (data.startsWith("rate_")) {
    const starsCount = data.replace("rate_", "");
    let ratingStr = "⭐⭐⭐⭐⭐";
    if (starsCount === "4") ratingStr = "⭐⭐⭐⭐";
    if (starsCount === "3") ratingStr = "⭐⭐⭐";

    userSessions[userId] = { step: 99, reviewRating: ratingStr, data: {} };
    await ctx.answerCallbackQuery().catch(() => {});
    await ctx.reply("✍️ شكراً لك! الآن أرسل في رسالة نصية رأيك أو تعليقك على الخدمة لنشره في قسم التقييمات:");
    return;
  }

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
      await ctx.answerCallbackQuery({ text: `تم التحديث إلى: ${statusText}` }).catch(() => {});

      try {
        await bot.api.sendMessage(order.userId, `🔔 تحديث بشأن طلبك (#${orderId}):\n\nأصبحت حالة طلبك الآن: ${statusText}`);
      } catch (e) {}
    }
    return;
  }

  if (data.startsWith("srv_") || data.startsWith("pkg_")) {
    let selectedName = "";
    let selectedPrice = "";

    if (data.startsWith("srv_")) {
      const srvIndex = parseInt(data.replace("srv_", ""));
      selectedName = servicesList[srvIndex] ? servicesList[srvIndex].name : "خدمة تصميم";
      selectedPrice = servicesList[srvIndex] ? servicesList[srvIndex].price : "";
    } else {
      const pkgIndex = parseInt(data.replace("pkg_", ""));
      selectedName = packagesList[pkgIndex] ? packagesList[pkgIndex].name : "باقة تصميم";
      selectedPrice = packagesList[pkgIndex] ? packagesList[pkgIndex].price : "";
    }

    userSessions[userId] = { service: selectedName, step: 1, data: { priceRange: selectedPrice } };
    await ctx.answerCallbackQuery().catch(() => {});
    await ctx.reply(`لقد اخترت: ${selectedName}\n\nالخطوة 1: ما هو اسم المشروع أو العلامة التجارية؟`);
  } 
  else if (data === "cmd_my_orders") {
    await ctx.answerCallbackQuery().catch(() => {});
    const userOrders = orders.filter(o => o.userId === userId);
    if (userOrders.length === 0) {
      await ctx.reply("📦 ليس لديك أي طلبات مسجلة حتى الآن.");
    } else {
      let msg = "📦 سجل طلباتك لدى المحترف للتصميم:\n\n";
      userOrders.forEach(o => {
        msg += `رقم الطلب: #${o.id}\nالخدمة: ${o.serviceName}\nالحالة: ${o.status}\nالتاريخ: ${o.date}\n------------------\n`;
      });
      await ctx.reply(msg);
    }
  } 
  else if (data === "color_yes" || data === "color_no") {
    const session = userSessions[userId];
    if (!session) return;

    session.data.colors = data === "color_yes" ? "نعم، سيتم تحديدها" : "لا، اتركها للتذوق الفني للمصمم";
    session.step = 5;

    await ctx.answerCallbackQuery().catch(() => {});
    const kb = new InlineKeyboard().text("📎 نعم، سأرسل ملفات", "file_yes").text("➡️ لا يوجد", "file_no");
    await ctx.reply("الخطوة 5: هل لديك شعار قديم أو صور ومراجع تحب إرفاقها؟", { reply_markup: kb });
  }
  else if (data === "file_yes" || data === "file_no") {
    const session = userSessions[userId];
    if (!session) return;

    session.data.files = data === "file_yes" ? "سيتم إرسال الملفات" : "لا توجد ملفات";

    const newOrderId = Math.floor(1000 + Math.random() * 9000);
    const clientName = ctx.from ? ctx.from.first_name : "عميل";
    const clientUsername = (ctx.from && ctx.from.username) ? `@${ctx.from.username}` : "لا يوجد معرف";

    const newOrder = {
      id: newOrderId,
      userId: userId,
      userName: clientName,
      serviceName: session.service || "تصميم",
      details: session.data,
      priceRange: session.data.priceRange || "يحدد بعد المراجعة",
      status: "قيد المراجعة ⏳",
      date: new Date().toLocaleDateString()
    };

    orders.push(newOrder);
    delete userSessions[userId];

    await ctx.answerCallbackQuery().catch(() => {});

    try {
      const adminMsg = 
        `🚨 طلب تصميم جديد! (#${newOrderId})\n\n` +
        `👤 العميل: ${cleanText(clientName)} (${cleanText(clientUsername)})\n` +
        `🆔 معرف المستخدم: ID_${userId}\n` +
        `🎨 الخدمة/الباقة: ${newOrder.serviceName}\n` +
        `📌 اسم المشروع: ${cleanText(newOrder.details.projectName || "غير محدد")}\n` +
        `🏷️ المجال: ${cleanText(newOrder.details.projectField || "غير محدد")}\n` +
        `💡 الفكرة: ${cleanText(newOrder.details.idea || "غير محدد")}\n` +
        `🎨 الألوان: ${newOrder.details.colors}\n` +
        `📎 المرفقات: ${newOrder.details.files}\n` +
        `💰 السعر المتوقع: ${newOrder.priceRange}`;

      const adminOrderKb = new InlineKeyboard()
        .text("⏳ قيد التجهيز", `st_process_${newOrderId}`)
        .text("✅ إنجاز", `st_done_${newOrderId}`)
        .text("❌ إلغاء", `st_cancel_${newOrderId}`);

      await bot.api.sendMessage(ADMIN_CHAT_ID, adminMsg, { reply_markup: adminOrderKb });
    } catch (err) {}

    await ctx.reply(`✅ تم تسجيل طلبك بنجاح في المحترف للتصميم (#${newOrderId})\n\nسيتم مراجعة الطلب والتواصل معك قريباً جداً!`);
  }
});

// التعامل مع الوسائط
bot.on("message:photo", async (ctx) => {
  const userId = ctx.from ? ctx.from.id : 0;
  const session = userSessions[userId];

  if (userId === ADMIN_CHAT_ID && session && session.step === 80) {
    const photoArray = ctx.message.photo;
    const largestPhoto = photoArray[photoArray.length - 1];
    const caption = ctx.message.caption || "🎨 نموذج تصميم جديد من المحترف للتصميم";

    portfolioItems.push({
      fileId: largestPhoto.file_id,
      caption: caption
    });

    delete userSessions[userId];
    await ctx.reply("✅ تم إضافة النموذج بنجاح إلى معرض الأعمال!", { reply_markup: adminPanelKeyboard });
    return;
  }

  if (userId === ADMIN_CHAT_ID && ctx.message.reply_to_message) {
    const repliedMsg = ctx.message.reply_to_message;
    const repliedText = repliedMsg.text || repliedMsg.caption || "";
    const extractedId = repliedText.match(/ID_(\d+)/)?.[1];

    if (extractedId) {
      const targetUserId = parseInt(extractedId);
      const photoArray = ctx.message.photo;
      const fileId = photoArray[photoArray.length - 1].file_id;
      const caption = ctx.message.caption || "🖼️ تفضل، هذه هي معاينة/صورة مشروعك النهائية!\n\nنشكر اختيارك لـ المحترف للتصميم ✨";

      try {
        await bot.api.sendPhoto(targetUserId, fileId, { caption: caption });
        await ctx.reply("✅ تم إرسال الصورة للعميل بنجاح!");
      } catch (e) {
        await ctx.reply("❌ فشل إرسال الصورة، قد يكون العميل حظر البوت.");
      }
    }
  }
});

bot.on("message:document", async (ctx) => {
  const userId = ctx.from ? ctx.from.id : 0;

  if (userId === ADMIN_CHAT_ID && ctx.message.reply_to_message) {
    const repliedMsg = ctx.message.reply_to_message;
    const repliedText = repliedMsg.text || repliedMsg.caption || "";
    const extractedId = repliedText.match(/ID_(\d+)/)?.[1];

    if (extractedId) {
      const targetUserId = parseInt(extractedId);
      const fileId = ctx.message.document.file_id;
      const caption = ctx.message.caption || "🎁 تفضل، هذه هي ملفات عملك النهائية جاهزة للتحميل!\n\nنشكر اختيارك لـ المحترف للتصميم ✨";

      try {
        await bot.api.sendDocument(targetUserId, fileId, { caption: caption });
        await ctx.reply("✅ تم إرسال الملف إلى العميل بنجاح!");
      } catch (e) {
        await ctx.reply("❌ فشل إرسال الملف، قد يكون العميل حظر البوت.");
      }
    }
  }
});

// التعامل مع النصوص
bot.on("message:text", async (ctx) => {
  const userId = ctx.from ? ctx.from.id : 0;
  const session = userSessions[userId];
  const text = ctx.message.text;

  if (text.startsWith("/")) return;

  if (session && session.step === 70) {
    const orderNum = text;
    const clientName = ctx.from ? ctx.from.first_name : "عميل";
    const clientUsername = (ctx.from && ctx.from.username) ? `@${ctx.from.username}` : "لا يوجد معرف";

    delete userSessions[userId];

    try {
      const adminNotice = 
        `📦 طلب استلام ملفات مشروع!\n\n` +
        `👤 العميل: ${cleanText(clientName)} (${cleanText(clientUsername)})\n` +
        `🆔 معرف المستخدم: ID_${userId}\n` +
        `🔢 رقم الطلب المدخل: ${cleanText(orderNum)}\n\n` +
        `💡 قم بعمل Reply على هذه الرسالة وأرفق (صورة أو ملف PDF/ZIP) لتسليمه للعميل فوراً.`;

      await bot.api.sendMessage(ADMIN_CHAT_ID, adminNotice);
      await ctx.reply("⌛ جاري مراجعة طلبك... تم إشعار المصمم برقم طلبك وسيصلك ملف العمل هنا مباشرة خلال لحظات!");
    } catch (e) {
      await ctx.reply("✅ تم إرسال طلبك للإدارة.");
    }
    return;
  }

  if (session && session.step === 50) {
    const clientName = ctx.from ? ctx.from.first_name : "عميل";
    const clientUsername = (ctx.from && ctx.from.username) ? `@${ctx.from.username}` : "لا يوجد معرف";

    try {
      const headerMsg = 
        `💎 طلب استشارة بصرية جديدة (VIP)\n\n` +
        `👤 العميل: ${cleanText(clientName)} (${cleanText(clientUsername)})\n` +
        `🆔 معرف المستخدم: ID_${userId}\n` +
        `💬 الرسالة/الاستفسار:\n${cleanText(text)}`;

      await bot.api.sendMessage(ADMIN_CHAT_ID, headerMsg);
      
      delete userSessions[userId];
      await ctx.reply("✨ تم استلام طلب الاستشارة بنجاح! سيقوم المصمم بدراسة التفاصيل والرد عليك بتقييم فني شامِل.");
    } catch (e) {
      await ctx.reply("✅ تم تحويل استشارتك للمصمم بنجاح.");
    }
    return;
  }

  if (session && session.step === 99) {
    const clientName = ctx.from ? ctx.from.first_name : "عميل";
    reviews.push({
      userName: clientName,
      rating: session.reviewRating || "⭐⭐⭐⭐⭐",
      text: text
    });
    delete userSessions[userId];
    await ctx.reply("⭐ شكراً لك! تم حفظ ونشر تقييمك بنجاح في قسم آراء العملاء.");
    return;
  }

  if (userId === ADMIN_CHAT_ID && ctx.message.reply_to_message) {
    const repliedMsg = ctx.message.reply_to_message;
    const repliedText = repliedMsg.text || repliedMsg.caption || "";
    const extractedId = repliedText.match(/ID_(\d+)/)?.[1];
    
    if (extractedId) {
      const targetUserId = parseInt(extractedId);
      try {
        await bot.api.sendMessage(targetUserId, `💬 رد من المحترف للتصميم:\n\n${text}`);
        await ctx.reply("✅ تم إرسال الرد إلى الزبون بنجاح!");
      } catch (e) {
        await ctx.reply("❌ فشل الإرسال، قد يكون العميل حظر البوت.");
      }
      return;
    }
  }

  if (session && session.step) {
    if (session.step === 1) {
      session.data.projectName = text;
      session.step = 2;
      await ctx.reply("الخطوة 2: ما هو مجال الم
