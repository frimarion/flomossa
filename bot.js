const TelegramBot = require("node-telegram-bot-api");
const { BOT_TOKEN, ADMIN_CHAT_ID, MINI_APP_URL } = require("./config");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log("🌿 Flomossa Bot запущен!");

const WELCOME_PHOTO = "https://frimarion.github.io/flomossa/welcome.jpg";

// ── /start — приветствие с фото ──────────────
bot.onText(/\/start/, (msg) => {
  const keyboard = {
    keyboard: [
      [{ text: "🌿 Открыть магазин", web_app: { url: MINI_APP_URL } }],
      [{ text: "📞 Написать нам в канал" }],
    ],
    resize_keyboard: true,
  };

  bot.sendPhoto(msg.chat.id, WELCOME_PHOTO, {
    caption:
      "🌿 *Flomossa* — живые флорариумы и моссариумы\n\n" +
      "Создаём маленькие миры из мха и растений в стекле 🔮\n" +
      "Каждый флорариум — ручная работа с любовью в Москве.\n\n" +
      "👇 Нажмите, чтобы открыть каталог",
    parse_mode: "Markdown",
    reply_markup: keyboard,
  }).catch(() => {
    bot.sendMessage(msg.chat.id,
      "🌿 *Добро пожаловать в Flomossa!*\n\n" +
      "Магазин живых флорариумов и моссариумов.\n" +
      "Каждый — ручная работа с любовью 🔮\n\n" +
      "👇 Нажмите, чтобы открыть каталог",
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  });

  // Обработка кнопки "Написать нам"
  bot.onText(/Написать нам/, (m) => {
    bot.sendMessage(m.chat.id,
      "📞 Наш канал: @Flomossa\n\nПишите, с удовольствием ответим! 🌿"
    );
  });
});

// ── Получаем заказ из мини-аппа ──────────────
bot.on("web_app_data", async (msg) => {
  const userId    = msg.from.id;
  const username  = msg.from.username ? `@${msg.from.username}` : "нет username";
  const firstName = msg.from.first_name || "";

  let order;
  try {
    order = JSON.parse(msg.web_app_data.data);
  } catch (e) {
    console.error("Ошибка парсинга заказа:", e);
    return;
  }

  // Подтверждение клиенту
  await bot.sendMessage(userId,
    `✅ *Заказ принят!*\n\n` +
    `👤 ${order.name}\n` +
    `📱 ${order.phone}\n` +
    `🏠 ${order.address}\n` +
    (order.comment !== "Без пожеланий" ? `💬 ${order.comment}\n` : "") +
    `\n🛒 *Состав заказа:*\n${order.items.map(i => `  • ${i}`).join("\n")}\n\n` +
    `💰 *Итого: ${order.total}*\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `🌿 Свяжемся с вами в течение 1–2 часов.\n` +
    `Спасибо, что выбрали *Flomossa*! 💚`,
    { parse_mode: "Markdown" }
  );

  // Уведомление администратору
  await bot.sendMessage(ADMIN_CHAT_ID,
    `🛍 *НОВЫЙ ЗАКАЗ!*\n\n` +
    `👤 ${order.name}\n` +
    `📱 ${order.phone}\n` +
    `🏠 ${order.address}\n` +
    `💬 ${order.comment}\n` +
    `🚚 ${order.delivery === "delivery" ? "Доставка курьером" : "Самовывоз"}\n\n` +
    `🔗 Telegram: ${username} (${firstName}, ID: ${userId})\n\n` +
    `🛒 *Состав:*\n${order.items.map(i => `  • ${i}`).join("\n")}\n\n` +
    `💰 *Итого: ${order.total}*`,
    { parse_mode: "Markdown" }
  ).catch(e => console.error("Не удалось уведомить админа:", e.message));
});
