import { Bot, InlineKeyboard, Context } from "grammy";
import { createServer } from "http";

interface Order {
  id: number;
  userId: number;
  userName: string;
  serviceName: string;
  details: Record<string, string>;
  priceRange: string;
  status: string;
  date: string;
}

interface Review {
  userName: string;
  rating: string;
  text: string;
}

interface PortfolioItem {
  fileId: string;
  caption: string;
}

interface UserSession {
  step?: number;
  service?: string;
  reviewRating?: string;
  data: Record<string, string>;
}

const token = process.env.BOT_TOKEN || "";

if (!token) {
  console.error("❌ BOT_TOKEN غير موجود في Environment Variables");
  process.exit(1);
}

const bot = new Bot(token);

const ADMIN_CHAT_ID = 7812617493;

const orders: Order[] = [];

const reviews: Review[] = [
  {
    userName: "محمد أ.",
    rating: "⭐⭐⭐⭐⭐",
    text: "تصميم شعار احترافي جداً وتعامل راقي."
  },
  {
    userName: "سارة م.",
    rating: "⭐⭐⭐⭐⭐",
    text: "هوية بصرية متكاملة وفاخرة، شكراً لـ المحترف للتصميم."
  }
];

const portfolioItems: PortfolioItem[] = [];

const userSessions: Record<number, UserSession> = {};

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
  {
    name: "🌟 باقة انطلاقة المشروع",
    details: "شعار + كرت شخصي + ورق مراسلات",
    price: "350 د.ل"
  },
  {
    name: "🚀 باقة الهوية الكاملة",
    details: "شعار + هوية بصرية متكاملة + علب وتغليف",
    price: "1100 د.ل"
  },
  {
    name: "⚡ باقة VIP المستعجلة",
    details: "تسليم أي تصميم خلال 24 ساعة فقط",
    price: "حسب نوع الخدمة + 30%"
  }
];

function cleanText(str: string | undefined): string {
  if (!str) return "";
  return String(str).replace(/[_*`\[\]]/g, "");
}

function getMainKeyboard(userId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text("🎨 طلب تصميم جديد", "cmd_request_design")
    .row()
    .text("📂 استلام ملفات المشروع (PDF / PNG / ZIP)", "cmd_get_files")
    .row()
    .text("💎 استشارة بصرية سريعة (VIP)", "cmd_vip_consult")
    .row()
    .text("📦 الباقات والعروض التوفيرية", "cmd_packages")
    .row()
    .text("🖼️ معرض الأعمال (صور النماذج)", "cmd_portfolio")
    .row()
    .text("💰 الخدمات والأسعار", "cmd_services")
    .row()
    .text("⭐ آراء وتقييمات العملاء", "cmd_reviews")
    .row()
    .text("✍️ أضف تقييمك الآن", "cmd_add_review")
    .row()
    .text("📁 طلباتي الحالية", "cmd_my_orders")
    .row()
    .text("📞 التواصل المباشر مع المصمم", "cmd_contact")
    .row()
    .text("ℹ️ حول المحترف للتصميم", "cmd_help");

  if (Number(userId) === ADMIN_CHAT_ID) {
    keyboard
      .row()
      .text("👑 لوحة تحكم الإدارة", "admin_panel_home");
  }

  return keyboard;
}

function getAdminPanelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("📋 عرض كل الطلبات", "admin_list_orders")
    .row()
    .text("➕ إضافة نموذج جديد للمعرض", "admin_add_portfolio")
    .row()
    .text("📊 إحصائيات وتقارير البوت", "admin_stats")
    .row()
    .text("🔙 العودة للقائمة الرئيسية", "back_to_main");
}

/* ERROR HANDLER */

bot.catch((err) => {
  console.error("❌ حدث خطأ في البوت:", err.error);
});

/* START */

bot.command("start", async (ctx: Context) => {
  const userId = ctx.from?.id || 0;

  const welcomeText =
    "✨ أهلاً بك في المحترف للتصميم ✨\n\n" +
    "نقدم لك أفخم الحلول البصرية والهويات التجارية المتكاملة بأعلى معايير الجودة والاحترافية.\n\n" +
    "اختر ما يناسبك من القائمة الرئيسية أدناه:";

  await ctx.reply(welcomeText, {
    reply_markup: getMainKeyboard(userId)
  });
});

/* ADMIN */

bot.command("admin", async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) return;

  await ctx.reply("👑 لوحة تحكم إدارة المحترف للتصميم:", {
    reply_markup: getAdminPanelKeyboard()
  });
});

bot.callbackQuery("admin_panel_home", async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) {
    await ctx.answerCallbackQuery().catch(() => {});
    return;
  }

  await ctx.answerCallbackQuery().catch(() => {});

  await ctx.editMessageText(
    "👑 لوحة تحكم إدارة المحترف للتصميم:",
    {
      reply_markup: getAdminPanelKeyboard()
    }
  );
});

/* BACK */

bot.callbackQuery("back_to_main", async (ctx: Context) => {
  const userId = ctx.from?.id || 0;

  await ctx.answerCallbackQuery().catch(() => {});

  await ctx.editMessageText(
    "✨ القائمة الرئيسية - المحترف للتصميم:",
    {
      reply_markup: getMainKeyboard(userId)
    }
  );
});

/* SERVICES */

bot.callbackQuery("cmd_services", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  let msg = "💰 قائمة خدمات وأسعار المحترف للتصميم:\n\n";

  servicesList.forEach((service) => {
    msg += `${service.name}\n💵 ${service.price}\n\n`;
  });

  await ctx.reply(msg);
});

/* PACKAGES */

bot.callbackQuery("cmd_packages", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  let msg = "📦 الباقات والحلول المتكاملة:\n\n";

  packagesList.forEach((pack) => {
    msg +=
      `🔹 ${pack.name}\n` +
      `📝 المكونات: ${pack.details}\n` +
      `💵 السعر: ${pack.price}\n` +
      `------------------\n`;
  });

  await ctx.reply(msg);
});

/* GET FILES */

bot.callbackQuery("cmd_get_files", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  const userId = ctx.from?.id || 0;

  userSessions[userId] = {
    step: 70,
    data: {}
  };

  await ctx.reply(
    "📂 طلب استلام ملفات المشروع:\n\n" +
    "أرسل رقم الطلب الخاص بك في رسالة.\n\n" +
    "مثال: 1234\n\n" +
    "بعدها سيقوم المصمم بمراجعة الطلب وإرسال الملفات لك هنا."
  );
});

/* VIP */

bot.callbackQuery("cmd_vip_consult", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  const userId = ctx.from?.id || 0;

  userSessions[userId] = {
    step: 50,
    data: {}
  };

  await ctx.reply(
    "💎 خدمة الاستشارة البصرية (VIP):\n\n" +
    "أرسل لنا تصميمك الحالي أو الفكرة التي تفكر بها، " +
    "وسيتم تقييمها وإعطاؤك توجيهاً فنياً مخصصاً."
  );
});

/* PORTFOLIO */

bot.callbackQuery("cmd_portfolio", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  if (portfolioItems.length === 0) {
    await ctx.reply(
      "🖼️ معرض أعمال المحترف للتصميم:\n\n" +
      "قريباً يتم رفع أحدث النماذج والتصاميم الحصرية!"
    );

    return;
  }

  await ctx.reply(
    "🖼️ إليك نماذج من أحدث أعمال المحترف للتصميم:"
  );

  for (const item of portfolioItems) {
    try {
      await ctx.replyWithPhoto(item.fileId, {
        caption: item.caption
      });
    } catch (error) {
      console.error("Portfolio photo error:", error);
    }
  }
});

/* ADD PORTFOLIO */

bot.callbackQuery("admin_add_portfolio", async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) {
    await ctx.answerCallbackQuery().catch(() => {});
    return;
  }

  await ctx.answerCallbackQuery().catch(() => {});

  userSessions[ADMIN_CHAT_ID] = {
    step: 80,
    data: {}
  };

  await ctx.reply(
    "🖼️ إضافة تصميم جديد للمعرض:\n\n" +
    "قم بإرسال الصورة الآن مباشرة.\n\n" +
    "ويمكنك كتابة التفاصيل أو الوصف في خانة الشرح (Caption)."
  );
});

/* REVIEWS */

bot.callbackQuery("cmd_reviews", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  let msg = "⭐ آراء وتقييمات العملاء:\n\n";

  if (reviews.length === 0) {
    msg += "لا توجد تقييمات حتى الآن.";
  } else {
    reviews.forEach((review) => {
      msg +=
        `👤 ${cleanText(review.userName)} - ${review.rating}\n` +
        `💬 "${cleanText(review.text)}"\n` +
        `------------------\n`;
    });
  }

  await ctx.reply(msg);
});

/* ADD REVIEW */

bot.callbackQuery("cmd_add_review", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  const keyboard = new InlineKeyboard()
    .text("⭐⭐⭐⭐⭐ (ممتاز جداً)", "rate_5")
    .row()
    .text("⭐⭐⭐⭐ (جيد جداً)", "rate_4")
    .row()
    .text("⭐⭐⭐ (جيد)", "rate_3");

  await ctx.reply(
    "⭐ اختر تقييمك لخدمات المحترف للتصميم:",
    {
      reply_markup: keyboard
    }
  );
});

/* NEW DESIGN ORDER */

bot.callbackQuery("cmd_request_design", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  const keyboard = new InlineKeyboard();

  servicesList.forEach((service, index) => {
    keyboard
      .text(service.name, `srv_${index}`)
      .row();
  });

  packagesList.forEach((pack, index) => {
    keyboard
      .text(`📦 ${pack.name}`, `pkg_${index}`)
      .row();
  });

  await ctx.reply(
    "🎨 اختر الخدمة أو الباقة المطلوبة لبدء الطلب:",
    {
      reply_markup: keyboard
    }
  );
});

/* CONTACT */

bot.callbackQuery("cmd_contact", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  const userId = ctx.from?.id || 0;

  userSessions[userId] = {
    step: 60,
    data: {}
  };

  await ctx.reply(
    "📞 التواصل المباشر مع المصمم:\n\n" +
    "اكتب استفسارك أو التفاصيل هنا مباشرة، " +
    "وسيتم تحويلها فوراً للمصمم للرد عليك."
  );
});

/* ABOUT */

bot.callbackQuery("cmd_help", async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});

  await ctx.reply(
    "ℹ️ عن المحترف للتصميم:\n\n" +
    "متخصصون في صناعة الهويات البصرية والشعارات والتصاميم المبتكرة " +
    "بأعلى معايير الفخامة والاحترافية."
  );
});

/* ADMIN ORDERS */

bot.callbackQuery("admin_list_orders", async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) {
    await ctx.answerCallbackQuery().catch(() => {});
    return;
  }

  await ctx.answerCallbackQuery().catch(() => {});

  if (orders.length === 0) {
    await ctx.reply("📭 لا توجد أي طلبات مسجلة حالياً.");
    return;
  }

  let msg =
    `📋 قائمة الطلبات المسجلة (${orders.length}):\n\n`;

  orders.forEach((order) => {
    msg +=
      `🔹 طلب #${order.id}\n` +
      `👤 العميل: ${cleanText(order.userName)}\n` +
      `🎨 الخدمة: ${cleanText(order.serviceName)}\n` +
      `📌 المشروع: ${cleanText(order.details.projectName || "غير محدد")}\n` +
      `🏷️ المجال: ${cleanText(order.details.projectField || "غير محدد")}\n` +
      `الحالة: ${order.status}\n` +
      `📅 التاريخ: ${order.date}\n` +
      `------------------\n`;
  });

  await ctx.reply(msg);
});

/* ADMIN STATS */

bot.callbackQuery("admin_stats", async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_CHAT_ID) {
    await ctx.answerCallbackQuery().catch(() => {});
    return;
  }

  await ctx.answerCallbackQuery().catch(() => {});

  await ctx.reply(
    `📊 إحصائيات بوت المحترف للتصميم:\n\n` +
    `- الخدمات المتاحة: ${servicesList.length}\n` +
    `- إجمالي الطلبات: ${orders.length}\n` +
    `- نماذج المعرض: ${portfolioItems.length}\n` +
    `- التقييمات المسجلة: ${reviews.length}\n` +
    `- الحالة: متصل 24/7 🟢`
  );
});

/* ALL CALLBACK QUERIES */

bot.on("callback_query:data", async (ctx: Context) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from?.id || 0;

  /* RATING */

  if (data.startsWith("rate_")) {
    const starsCount = data.replace("rate_", "");

    let ratingStr = "⭐⭐⭐⭐⭐";

    if (starsCount === "4") {
      ratingStr = "⭐⭐⭐⭐";
    }

    if (starsCount === "3") {
      ratingStr = "⭐⭐⭐";
    }

    userSessions[userId] = {
      step: 99,
      reviewRating: ratingStr,
      data: {}
    };

    await ctx.answerCallbackQuery().catch(() => {});

    await ctx.reply(
      "✍️ شكراً لك!\n\n" +
      "الآن أرسل في رسالة نصية رأيك أو تعليقك على الخدمة لنشره في قسم التقييمات."
    );

    return;
  }

  /* CHANGE ORDER STATUS */

  if (
    data.startsWith("st_") &&
    userId === ADMIN_CHAT_ID
  ) {
    const parts = data.split("_");
    const newStatus = parts[1];
    const orderId = parseInt(parts[2], 10);

    const order = orders.find(
      (item) => item.id === orderId
    );

    if (!order) {
      await ctx.answerCallbackQuery({
        text: "❌ الطلب غير موجود"
      }).catch(() => {});

      return;
    }

    let statusText = "قيد التجهيز ⏳";

    if (newStatus === "done") {
      statusText = "مكتمل وجاهز ✅";
    }

    if (newStatus === "cancel") {
      statusText = "ملغي ❌";
    }

    order.status = statusText;

    await ctx.answerCallbackQuery({
      text: `تم التحديث إلى: ${statusText}`
    }).catch(() => {});

    try {
      await bot.api.sendMessage(
        order.userId,
        `🔔 تحديث بشأن طلبك (#${orderId}):\n\n` +
        `أصبحت حالة طلبك الآن: ${statusText}`
      );
    } catch (error) {
      console.error(
        "Status notification error:",
        error
      );
    }

    return;
  }

  /* SERVICE OR PACKAGE */

  if (
    data.startsWith("srv_") ||
    data.startsWith("pkg_")
  ) {
    let selectedName = "";
    let selectedPrice = "";

    if (data.startsWith("srv_")) {
      const index = parseInt(
        data.replace("srv_", ""),
        10
      );

      const service = servicesList[index];

      if (service) {
        selectedName = service.name;
        selectedPrice = service.price;
      } else {
        selectedName = "خدمة تصميم";
      }
    } else {
      const index = parseInt(
        data.replace("pkg_", ""),
        10
      );

      const pack = packagesList[index];

      if (pack) {
        selectedName = pack.name;
        selectedPrice = pack.price;
      } else {
        selectedName = "باقة تصميم";
      }
    }

    userSessions[userId] = {
      service: selectedName,
      step: 1,
      data: {
        priceRange: selectedPrice
      }
    };

    await ctx.answerCallbackQuery().catch(() => {});

    await ctx.reply(
      `لقد اخترت: ${selectedName}\n\n` +
      "الخطوة 1 من 5:\n" +
      "📌 ما هو اسم المشروع أو العلامة التجارية؟"
    );

    return;
  }

  /* MY ORDERS */

  if (data === "cmd_my_orders") {
    await ctx.answerCallbackQuery().catch(() => {});

    const userOrders = orders.filter(
      (order) => order.userId === userId
    );

    if (userOrders.length === 0) {
      await ctx.reply(
        "📦 ليس لديك أي طلبات مسجلة حتى الآن."
      );

      return;
    }

    let msg =
      "📦 سجل طلباتك لدى المحترف للتصميم:\n\n";

    userOrders.forEach((order) => {
      msg +=
        `رقم الطلب: #${order.id}\n` +
        `الخدمة: ${order.serviceName}\n` +
        `الحالة: ${order.status}\n` +
        `التاريخ: ${order.date}\n` +
        `------------------\n`;
    });

    await ctx.reply(msg);

    return;
  }

  /* COLORS */

  if (
    data === "color_yes" ||
    data === "color_no"
  ) {
    const session = userSessions[userId];

    if (!session) {
      await ctx.answerCallbackQuery().catch(() => {});
      return;
    }

    session.data.colors =
      data === "color_yes"
        ? "نعم، سيتم تحديد الألوان من العميل"
        : "لا، يترك اختيار الألوان للمصمم";

    session.step = 5;

    await ctx.answerCallbackQuery().catch(() => {});

    const keyboard = new InlineKeyboard()
      .text(
        "📎 نعم، سأرسل ملفات",
        "file_yes"
      )
      .text(
        "➡️ لا يوجد",
        "file_no"
      );

    await ctx.reply(
      "الخطوة 5 من 5:\n\n" +
      "📎 هل لديك شعار قديم أو صور ومراجع تحب إرفاقها؟",
      {
        reply_markup: keyboard
      }
    );

    return;
  }

  /* FILES */

  if (
    data === "file_yes" ||
    data === "file_no"
  ) {
    const session = userSessions[userId];

    if (!session) {
      await ctx.answerCallbackQuery().catch(() => {});
      return;
    }

    session.data.files =
      data === "file_yes"
        ? "سيتم إرسال الملفات"
        : "لا توجد ملفات";

    const newOrderId =
      Math.floor(1000 + Math.random() * 9000);

    const clientName =
      ctx.from?.first_name || "عميل";

    const clientUsername =
      ctx.from?.username
        ? `@${ctx.from.username}`
        : "لا يوجد معرف";

    const newOrder: Order = {
      id: newOrderId,
      userId,
      userName: clientName,
      serviceName:
        session.service || "تصميم",
      details: session.data,
      priceRange:
        session.data.priceRange ||
        "يحدد بعد المراجعة",
      status: "قيد المراجعة ⏳",
      date:
        new Date().toLocaleDateString("ar-LY")
    };

    orders.push(newOrder);

    await ctx.answerCallbackQuery().catch(() => {});

    try {
      const adminMsg =
        `🚨 طلب تصميم جديد! (#${newOrderId})\n\n` +
        `👤 العميل: ${cleanText(clientName)} (${cleanText(clientUsername)})\n` +
        `🆔 معرف المستخدم: ID_${userId}\n` +
        `🎨 الخدمة/الباقة: ${cleanText(newOrder.serviceName)}\n` +
        `📌 اسم المشروع: ${cleanText(newOrder.details.projectName || "غير محدد")}\n` +
        `🏷️ المجال: ${cleanText(newOrder.details.projectField || "غير محدد")}\n` +
        `💡 الفكرة: ${cleanText(newOrder.details.idea || "غير محدد")}\n` +
        `🎨 الألوان: ${cleanText(newOrder.details.colors || "غير محدد")}\n` +
        `📎 المرفقات: ${cleanText(newOrder.details.files || "غير محدد")}\n` +
        `💰 السعر المتوقع: ${cleanText(newOrder.priceRange)}`;

      const adminOrderKeyboard =
        new InlineKeyboard()
          .text(
            "⏳ قيد التجهيز",
            `st_process_${newOrderId}`
          )
          .text(
            "✅ إنجاز",
            `st_done_${newOrderId}`
          )
          .text(
            "❌ إلغاء",
            `st_cancel_${newOrderId}`
          );

      await bot.api.sendMessage(
        ADMIN_CHAT_ID,
        adminMsg,
        {
          reply_markup: adminOrderKeyboard
        }
      );
    } catch (error) {
      console.error(
        "Admin order notification error:",
        error
      );
    }

    delete userSessions[userId];

    await ctx.reply(
      `✅ تم تسجيل طلبك بنجاح في المحترف للتصميم (#${newOrderId})\n\n` +
      "سيتم مراجعة الطلب والتواصل معك قريباً جداً!"
    );

    return;
  }
});

/* PHOTO MESSAGES */

bot.on("message:photo", async (ctx: Context) => {
  const userId = ctx.from?.id || 0;
  const session = userSessions[userId];
  const photos = ctx.message?.photo;

  if (!photos || photos.length === 0) {
    return;
  }

  const largestPhoto =
    photos[photos.length - 1];

  /* إضافة صورة للمعرض */

  if (
    userId === ADMIN_CHAT_ID &&
    session &&
    session.step === 80
  ) {
    portfolioItems.push({
      fileId: largestPhoto.file_id,
      caption:
        ctx.message?.caption ||
        "نموذج من أعمال المحترف للتصميم"
    });

    delete userSessions[userId];

    await ctx.reply(
      "✅ تم إضافة التصميم بنجاح إلى معرض الأعمال."
    );

    return;
  }

  /* إرسال صورة للعميل عند الرد على رسالة الإدارة */

  if (userId === ADMIN_CHAT_ID) {
    const replyMessage =
      ctx.message?.reply_to_message;

    if (!replyMessage) {
      return;
    }

    const replyText =
      ("text" in replyMessage
        ? replyMessage.text
        : undefined) ||
      ("caption" in replyMessage
        ? replyMessage.caption
        : undefined) ||
      "";

    const match =
      replyText.match(/ID_(\d+)/);

    if (!match) {
      return;
    }

    const targetUserId =
      Number(match[1]);

    try {
      await bot.api.sendPhoto(
        targetUserId,
        largestPhoto.file_id,
        {
          capt
