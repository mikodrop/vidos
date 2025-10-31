const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
    try {
        const { answers } = req.body;
        
        const prompt = `Проанализируй ответы пользователя на вопросы профориентации и дай подробные рекомендации по выбору профессии. Ответы: ${answers.join(', ')}. Проанализируй интересы, склонности, сильные стороны и дай 3-5 подходящих профессиональных направлений с объяснением.`;

        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "Ты профессиональный карьерный консультант. Анализируй ответы и давай конкретные, полезные рекомендации."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ analysis: response.data.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Ошибка анализа' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});