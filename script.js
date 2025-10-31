const questions = [
    "Какие школьные предметы вам нравятся больше всего и почему?",
    "Опишите ваши любимые хобби и занятия в свободное время",
    "Какие задачи или деятельность заставляют вас забыть о времени?",
    "Что вам больше нравится: работать в команде или самостоятельно? Почему?",
    "Опишите ситуацию, когда вы успешно решили сложную проблему",
    "Какими навыками и способностями вы обладаете?",
    "Как вы относитесь к рутинной работе?",
    "Что для вас важно в будущей профессии?",
    "Опишите ваш идеальный рабочий день",
    "Как вы справляетесь со стрессом и давлением?",
    "Что вас мотивирует и вдохновляет?",
    "Какие достижения вызывают у вас наибольшую гордость?",
    "Как вы учитесь новому?",
    "Опишите ваши сильные и слабые стороны",
    "Кем вы видите себя через 5 лет?"
];

let currentQuestion = 0;
let answers = [];

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function startTest() {
    currentQuestion = 0;
    answers = [];
    showScreen('test');
    showQuestion();
}

function showQuestion() {
    const container = document.getElementById('questionContainer');
    container.innerHTML = `
        <div class="question">
            <h3>Вопрос ${currentQuestion + 1} из ${questions.length}</h3>
            <p>${questions[currentQuestion]}</p>
            <textarea oninput="saveAnswer(${currentQuestion}, this.value)">${answers[currentQuestion] || ''}</textarea>
        </div>
    `;
    
    updateProgress();
    updateButtons();
}

function saveAnswer(index, value) {
    answers[index] = value;
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion();
    }
}

function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();
    }
}

function updateProgress() {
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Вопрос ${currentQuestion + 1} из ${questions.length}`;
}

function updateButtons() {
    const submitBtn = document.getElementById('submitBtn');
    if (currentQuestion === questions.length - 1) {
        submitBtn.style.display = 'inline-block';
    } else {
        submitBtn.style.display = 'none';
    }
}

async function submitTest() {
    showScreen('loading');
    
    try {
        // Отправляем ответы на наш "сервер" в Netlify
        const response = await fetch('/.netlify/functions/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answers: answers })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('resultsContent').innerHTML = data.analysis.replace(/\n/g, '<br>');
        } else {
            document.getElementById('resultsContent').textContent = 'Произошла ошибка. Попробуйте ещё раз.';
        }
        
        showScreen('results');
    } catch (error) {
        document.getElementById('resultsContent').textContent = 'Ошибка соединения. Проверьте интернет.';
        showScreen('results');
    }
}

function restartTest() {
    showScreen('intro');
}

// Показываем начальный экран
showScreen('intro');