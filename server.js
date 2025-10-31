// server.js
// Установка: npm init -y && npm install express node-fetch
// Запуск локально: OPENAI_API_KEY=sk-... node server.js
// Для платформы без fetch в Node замените вызов fetch на node-fetch или axios.

const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const app = express();
app.use(express.json({limit:'200kb'}));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if(!OPENAI_KEY){
  console.warn('ОШИБКА: не найден OPENAI_API_KEY в переменных окружения. /api/analyze вернёт ошибку.');
}

app.post('/api/analyze', async (req, res) => {
  try{
    const { answers } = req.body;
    if(!Array.isArray(answers) || answers.length === 0){
      return res.status(400).json({ error: 'Неверные данные: ожидается поле answers как массив.' });
    }

    const userText = answers.map((a,i)=>`Вопрос ${i+1}: ${a.question}\\nОтвет: ${a.answer}`).join('\\n\\n');

    const systemInstr = `Ты — помощник по профориентации. Проанализируй ответы пользователя и дай:
1) Краткий вывод о сильных сторонах и интересах.
2) 3-4 рекомендации по карьерным направлениям с кратким объяснением почему.
3) Практические шаги на ближайшие 6–12 месяцев (курсы, проекты, стажировки).
4) Ресурсы и советы по развитию необходимых навыков.
Отвечай на русском языке, структурированно с заголовками.`;

    if(!OPENAI_KEY){
      return res.status(500).json({ error: 'Server not configured: OPENAI_API_KEY missing on server.' });
    }

    const payload = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemInstr },
        { role: 'user', content: userText }
      ],
      max_tokens: 900
    };

    const fetchResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if(!fetchResp.ok){
      const txt = await fetchResp.text();
      return res.status(500).json({ error: 'Ошибка от OpenAI: ' + txt });
    }

    const data = await fetchResp.json();
    const advice = data?.choices?.[0]?.message?.content || JSON.stringify(data);
    res.json({ advice });

  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Статика: отдаём фронтенд
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));