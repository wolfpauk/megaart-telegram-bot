const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const bot = new TelegramBot(BOT_TOKEN, { webHook: true });

async function getAIResponse(message, userId) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://megaart-telegram-bot-git.vercel.app',
        'X-Title': 'MegaArt Sales Manager'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku', // можно заменить модель
        messages: [
          {
            role: 'system',
            content: `Ты - менеджер по продажам компании MegaArt, специализируешься на наружной рекламе и вывесках. 
            Отвечай профессионально, дружелюбно и по делу. 
            Предлагай услуги: объемные буквы, световые короба, неоновые вывески.
            Уточняй детали для расчета стоимости.`
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '⚠️ Не удалось получить ответ от AI.';
  } catch (error) {
    console.error('OpenRouter error:', error);
    return 'Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.';
  }
}

async function processWithBMADAgent(message, userId) {
  const lowerMessage = message.toLowerCase();

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

  // Для всего сложного — отправляем запрос в AI
  return await getAIResponse(message, userId);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
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
