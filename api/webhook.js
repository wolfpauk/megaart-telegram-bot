// Импортируем node-telegram-bot-api
const TelegramBot = require('node-telegram-bot-api');

// Получаем токен из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Создаём бот в режиме webhook
const bot = new TelegramBot(BOT_TOKEN, { webHook: true });

// BMAD-agent обработка
async function processWithBMADAgent(message, userId) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй') || lowerMessage.includes('start')) {
    return `🏢 Добро пожаловать в Мегаарт!\n\nЯ ваш персональный менеджер по продажам наружной рекламы и вывесок.\n\nЧем могу помочь?\n• Выбрать тип вывески\n• Рассчитать стоимость\n• Оформить заказ\n• Ответить на вопросы`;
  }

  if (lowerMessage.includes('каталог') || lowerMessage.includes('вывеск')) {
    return `🏷️ Наши виды вывесок:\n\n1️⃣ Объемные буквы\n• Преимущества: высокая видимость, долговечность\n• Материалы: композит, акрил, металл\n\n2️⃣ Световые короба\n• Преимущества: круглосуточная видимость\n• Освещение: LED подсветка\n\n3️⃣ Неоновые вывески\n• Преимущества: эффектный дизайн\n• Экономичное потребление энергии\n\nКакой тип вас интересует?`;
  }

  if (lowerMessage.includes('расчет') || lowerMessage.includes('стоимость') || lowerMessage.includes('цена')) {
    return `💰 Для расчета стоимости мне нужны следующие данные:\n\n• Тип вывески (объемные буквы, световой короб, неон)\n• Размеры (высота × ширина в см)\n• Место установки\n• Дополнительные услуги (монтаж, согласование)\n\nУкажите эти параметры, и я подготовлю смету!`;
  }

  if (lowerMessage.includes('заказ') || lowerMessage.includes('оформить')) {
    return `📋 Для оформления заказа:\n\n1. Выберите тип вывески\n2. Уточните размеры и материалы\n3. Укажите место установки\n4. Определите сроки\n\nПосле этого я подготовлю договор и смету.\n\nГотовы начать?`;
  }

  if (lowerMessage.includes('контакт') || lowerMessage.includes('связаться')) {
    return `📞 Контакты Мегаарт:\n\n🌐 Сайт: https://mega-art05.ru/\n📷 Instagram: https://www.instagram.com/megaart_05/\n📱 Телефон: +7 (XXX) XXX-XX-XX\n📍 Адрес: Махачкала, ул. Примерная, д. 123\n\nРаботаем ежедневно с 9:00 до 18:00`;
  }

  return `Я менеджер по продажам Мегаарт. Могу помочь с:\n\n• 📋 Выбором типа вывески\n• 💰 Расчетом стоимости\n• 📝 Оформлением заказа\n• ❓ Ответами на вопросы\n\nЧто вас интересует?`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;

    // Логируем апдейт
    console.log('Received update:', JSON.stringify(update, null, 2));

    // Обработка текстовых сообщений
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const userId = update.message.from.id;
      const messageText = update.message.text;
      const response = await processWithBMADAgent(messageText, userId);

      await bot.sendMessage(chatId, response, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 Каталог', callback_data: 'catalog' },
              { text: '💰 Расчет', callback_data: 'estimate' }
            ],
            [
              { text: '📞 Контакты', callback_data: 'contact' },
              { text: '❓ Помощь', callback_data: 'help' }
            ]
          ]
        }
      });
    }

    // Обработка callback_query
    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;

      let response = '';

      switch (data) {
        case 'catalog':
          response = `🏷️ Наши виды вывесок:\n\n1️⃣ Объемные буквы - высокая видимость\n2️⃣ Световые короба - круглосуточная подсветка\n3️⃣ Неоновые вывески - эффектный дизайн\n\nВыберите тип для подробностей:`;
          break;
        case 'estimate':
          response = `💰 Для расчета стоимости укажите:\n\n• Тип вывески\n• Размеры (В×Ш в см)\n• Место установки\n• Дополнительные услуги\n\nПример: "Объемные буквы, 50×200 см, Махачкала, с монтажом"`;
          break;
        case 'contact':
          response = `📞 Контакты Мегаарт:\n\n🌐 https://mega-art05.ru/\n📷 https://www.instagram.com/megaart_05/\n📱 +7 (XXX) XXX-XX-XX\n\nРаботаем ежедневно 9:00-18:00`;
          break;
        case 'help':
          response = `❓ Я могу помочь с:\n\n• Выбором типа вывески\n• Расчетом стоимости\n• Оформлением заказа\n• Ответами на вопросы\n\nПросто напишите, что вас интересует!`;
          break;
        default:
          response = 'Неизвестная команда. Напишите /help для справки.';
      }

      await bot.answerCallbackQuery(update.callback_query.id);
      await bot.sendMessage(chatId, response);
    }

    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
