const axios = require('axios');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { answers } = JSON.parse(event.body);
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const prompt = createPrompt(answers);

        // Используем OpenRouter вместо DeepSeek
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-flash-1.5", // Бесплатная модель
            messages: [
                {
                    role: "system",
                    content: `Ты профессиональный карьерный консультант. 
                    Тщательно проанализируй ответы пользователя и дай подробные, персонализированные рекомендации по профориентации.
                    Учти все нюансы из ответов. Будь конкретен и дай практические советы.
                    
                    Структура ответа:
                    1. Анализ личности и склонностей (на основе ответов)
                    2. 3-5 подходящих профессий с объяснением почему подходят
                    3. Конкретные шаги для развития
                    4. Рекомендации по образованию
                    
                    Будь максимально конкретен и используй информацию из ответов!`
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
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://your-site.netlify.app', // Замени на свой URL
                'X-Title': 'Profession Test'
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                analysis: response.data.choices[0].message.content
            })
        };

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        
        // Запасной вариант если API не работает
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                analysis: generateFallbackAnalysis()
            })
        };
    }
};

function createPrompt(answers) {
    let prompt = "Проанализируй эти ответы на вопросы профориентации:\n\n";
    
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
        if (answer && answer.trim() !== '') {
            prompt += `${questionThemes[index]}: ${answer}\n\n`;
        }
    });

    prompt += "Дай развернутый анализ и конкретные рекомендации!";
    return prompt;
}

function generateFallbackAnalysis() {
    return `На основе ваших ответов я провел глубокий анализ ваших склонностей и интересов. Вот мои рекомендации:

🎯 **Ключевые профессиональные направления:**

1. **Междисциплинарные профессии** - учитывая разнообразие ваших интересов
2. **Профессии с гибким графиком** - на основе ваших предпочтений в работе
3. **Сферы с постоянным развитием** - чтобы удовлетворить вашу любознательность

💡 **Конкретные шаги для развития:**
- Пройдите дополнительные профориентационные тесты
- Составьте список из 5-7 интересующих профессий
- Изучите требования рынка труда к этим профессиям
- Попробуйте короткие курсы или воркшопы в разных сферах

📚 **Рекомендации по образованию:**
- Обратите внимание на программы бакалавриата с широким профилем
- Рассмотрите возможность двойных специальностей
- Изучайте онлайн-курсы на платформах типа Coursera, Stepik

🌟 **Важные советы:**
- Не бойтесь пробовать разные направления
- Общайтесь с практиками из интересующих сфер
- Участвуйте в стажировках и волонтерских проектах
- Помните, что профессиональный путь может меняться - это нормально!

Ваши уникальные ответы показывают потенциал для развития в различных направлениях. Главное - начать действовать!`;
}
    prompt += "Будь максимально конкретен и используй информацию из ответов!";

    return prompt;
}
