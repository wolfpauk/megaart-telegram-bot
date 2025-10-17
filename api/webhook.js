// Vercel serverless function for Telegram webhook
const TelegramBot = require('node-telegram-bot-api');

// Bot token from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set!');
}

// Create bot instance without polling (webhook mode)
const bot = new TelegramBot(BOT_TOKEN);

// Simple in-memory storage for conversations (in production, use Redis or database)
const conversations = new Map();

// BMAD Agent simulation (replace with actual BMAD integration)
async function processWithBMADAgent(message, userId) {
  const lowerMessage = message.toLowerCase();

  // Simple responses based on keywords
  if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй') || lowerMessage.includes('start')) {
    return `🏢 Добро пожаловать в Мегаарт!

Я ваш персональный менеджер по продажам наружной рекламы и вывесок.

Чем могу помочь?
• Выбрать тип вывески
• Рассчитать стоимость
• Оформить заказ
• Ответить на вопросы`;
  }

  if (lowerMessage.includes('каталог') || lowerMessage.includes('вывеск')) {
    return `🏷️ Наши виды вывесок:

1️⃣ Объемные буквы
• Преимущества: высокая видимость, долговечность
• Материалы: композит, акрил, металл

2️⃣ Световые короба
• Преимущества: круглосуточная видимость
• Освещение: LED подсветка

3️⃣ Неоновые вывески
• Преимущества: эффектный дизайн
• Экономичное потребление энергии

Какой тип вас интересует?`;
  }

  if (lowerMessage.includes('расчет') || lowerMessage.includes('стоимость') || lowerMessage.includes('цена')) {
    return `💰 Для расчета стоимости мне нужны следующие данные:

• Тип вывески (объемные буквы, световой короб, неон)
• Размеры (высота × ширина в см)
• Место установки
• Дополнительные услуги (монтаж, согласование)

Укажите эти параметры, и я подготовлю смету!`;
  }

  if (lowerMessage.includes('заказ') || lowerMessage.includes('оформить')) {
    return `📋 Для оформления заказа:

1. Выберите тип вывески
2. Уточните размеры и материалы
3. Укажите место установки
4. Определите сроки

После этого я подготовлю договор и смету.

Готовы начать?`;
  }

  if (lowerMessage.includes('контакт') || lowerMessage.includes('связаться')) {
    return `📞 Контакты Мегаарт:

🌐 Сайт: https://mega-art05.ru/
📷 Instagram: https://www.instagram.com/megaart_05/
📱 Телефон: +7 (XXX) XXX-XX-XX
📍 Адрес: Махачкала, ул. Примерная, д. 123

Работаем ежедневно с 9:00 до 18:00`;
  }

  // Default response
  return `Я менеджер по продажам Мегаарт. Могу помочь с:

• 📋 Выбором типа вывески
• 💰 Расчетом стоимости
• 📝 Оформлением заказа
• ❓ Ответами на вопросы

Что вас интересует?`;
}

// Handle incoming webhook
module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;

    // Log the incoming update
    console.log('Received update:', JSON.stringify(update, null, 2));

    // Process the update
    await bot.processUpdate(update);

    // Send success response
    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set up bot event handlers
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text;

    if (!messageText) return; // Skip non-text messages

    console.log(`Message from ${userId}: ${messageText}`);

    // Process message with BMAD agent
    const response = await processWithBMADAgent(messageText, userId);

    // Send response
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

  } catch (error) {
    console.error('Message handling error:', error);
  }
});

bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const data = query.callback_data;

    let response = '';

    switch (data) {
      case 'catalog':
        response = `🏷️ Наши виды вывесок:

1️⃣ Объемные буквы - высокая видимость
2️⃣ Световые короба - круглосуточная подсветка
3️⃣ Неоновые вывески - эффектный дизайн

Выберите тип для подробностей:`;
        break;

      case 'estimate':
        response = `💰 Для расчета стоимости укажите:

• Тип вывески
• Размеры (В×Ш в см)
• Место установки
• Дополнительные услуги

Пример: "Объемные буквы, 50×200 см, Махачкала, с монтажом"`;
        break;

      case 'contact':
        response = `📞 Контакты Мегаарт:

🌐 https://mega-art05.ru/
📷 https://www.instagram.com/megaart_05/
📱 +7 (XXX) XXX-XX-XX

Работаем ежедневно 9:00-18:00`;
        break;

      case 'help':
        response = `❓ Я могу помочь с:

• Выбором типа вывески
• Расчетом стоимости
• Оформлением заказа
• Ответами на вопросы

Просто напишите, что вас интересует!`;
        break;

      default:
        response = 'Неизвестная команда. Напишите /help для справки.';
    }

    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(chatId, response);

  } catch (error) {
    console.error('Callback handling error:', error);
  }
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error);
});