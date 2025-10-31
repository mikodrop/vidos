// Этот файл будет работать на Netlify как наш "сервер"

const axios = require('axios');

exports.handler = async function(event, context) {
    // Разрешаем запросы с любого сайта (CORS)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Если браузер отправляет предварительный запрос OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Проверяем что запрос POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Получаем ответы пользователя из запроса
        const { answers } = JSON.parse(event.body);
        
        // Получаем API ключ из настроек Netlify
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        // Создаем промпт для DeepSeek
        const prompt = createPrompt(answers);

        // Отправляем запрос к DeepSeek API
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `Ты профессиональный карьерный консультант. 
                    Тщательно проанализируй ответы пользователя и дай подробные, персонализированные рекомендации по профориентации.
                    Учти все нюансы из ответов. Будь конкретен и дай практические советы.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Возвращаем результат пользователю
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                analysis: response.data.choices[0].message.content
            })
        };

    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to analyze answers'
            })
        };
    }
};

// Функция для создания промпта из ответов
function createPrompt(answers) {
    let prompt = "Проанализируй эти ответы на вопросы профориентации и дай развернутые рекомендации:\n\n";
    
    const questionThemes = [
        "Любимые предметы",
        "Хобби и увлечения", 
        "Увлекающая деятельность",
        "Рабочие предпочтения",
        "Опыт решения проблем",
        "Навыки и способности",
        "Отношение к рутине",
        "Приоритеты в профессии",
        "Идеальный рабочий день",
        "Стрессоустойчивость",
        "Мотивация",
        "Достижения",
        "Стиль обучения",
        "Сильные и слабые стороны",
        "Планы на будущее"
    ];

    answers.forEach((answer, index) => {
        prompt += `${questionThemes[index]}: ${answer}\n\n`;
    });

    prompt += "Проанализируй эти ответы и дай:\n";
    prompt += "1. Анализ личности и склонностей\n";
    prompt += "2. 3-5 подходящих профессий с объяснением\n"; 
    prompt += "3. Конкретные шаги для развития\n";
    prompt += "4. Рекомендации по образованию\n\n";
    prompt += "Будь максимально конкретен и используй информацию из ответов!";

    return prompt;
}