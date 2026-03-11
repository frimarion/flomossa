const TelegramBot = require("node-telegram-bot-api");
const { BOT_TOKEN, ADMIN_CHAT_ID, MINI_APP_URL } = require("./config");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log("🌿 Flomossa Bot запущен!");

// ── /start — открываем мини-апп ──────────────
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🌿 Добро пожаловать в *Flomossa*!\n\nМагазин живых флорариумов и моссариумов.\nКаждый — ручная работа с любовью 🔮\n\nНажмите кнопку ниже, чтобы открыть каталог 👇`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "🌿 Открыть магазин",
            web_app: { url: MINI_APP_URL }
          }
        ]]
      }
    }
  );
});

// ── Получаем заказ из мини-аппа ──────────────
bot.on("web_app_data", async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "нет username";
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
    `✅ *Ваш заказ принят!*\n\n` +
    `👤 ${order.name}\n` +
    `📱 ${order.phone}\n` +
    `🏠 ${order.address}\n` +
    (order.comment !== "Без пожеланий" ? `💬 ${order.comment}\n` : "") +
    `\n🛒 *Состав заказа:*\n${order.items.map(i => `  • ${i}`).join("\n")}\n\n` +
    `💰 *Итого: ${order.total}*\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `🌿 Мы свяжемся с вами в течение 1–2 часов.\n` +
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
    `🚚 Доставка: ${order.delivery === "delivery" ? "курьер" : "самовывоз"}\n\n` +
    `🔗 Telegram: ${username} (${firstName}, ID: ${userId})\n\n` +
    `🛒 *Состав:*\n${order.items.map(i => `  • ${i}`).join("\n")}\n\n` +
    `💰 *Итого: ${order.total}*`,
    { parse_mode: "Markdown" }
  ).catch(e => console.error("Не удалось уведомить админа:", e.message));
});
