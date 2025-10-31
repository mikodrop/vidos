class ProfessionTest {
    constructor() {
        this.currentQuestion = 0;
        this.answers = [];
        this.questions = [
            "Какие школьные предметы вам нравятся больше всего и почему?",
            "Опишите ваши любимые хобби и занятия в свободное время",
            "Какие задачи или деятельность заставляют вас забыть о времени?",
            "Что вам больше нравится: работать в команде или самостоятельно? Почему?",
            "Опишите ситуацию, когда вы успешно решили сложную проблему",
            "Какими навыками и способностями вы обладаете?",
            "Как вы относитесь к рутинной работе?",
            "Что для вас важно в будущей профессии (зарплата, карьера, интересные задачи и т.д.)?",
            "Опишите ваш идеальный рабочий день",
            "Как вы справляетесь со стрессом и давлением?",
            "Что вас мотивирует и вдохновляет?",
            "Какие достижения в жизни вызывают у вас наибольшую гордость?",
            "Как вы учитесь новому? Что вам помогает в обучении?",
            "Опишите ваши сильные и слабые стороны",
            "Кем вы видите себя через 5 лет?"
        ];

        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.renderQuestions();
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.startTest());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('submit-btn').addEventListener('click', (e) => this.submitTest(e));
        document.getElementById('restart-btn').addEventListener('click', () => this.restartTest());
    }

    renderQuestions() {
        const container = document.getElementById('questions-container');
        container.innerHTML = '';

        this.questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = `question ${index === 0 ? 'active' : ''}`;
            questionElement.innerHTML = `
                <h3>Вопрос ${index + 1} из ${this.questions.length}</h3>
                <p>${question}</p>
                <textarea 
                    placeholder="Введите ваш ответ здесь..." 
                    rows="4"
                    data-index="${index}"
                >${this.answers[index] || ''}</textarea>
            `;
            container.appendChild(questionElement);
        });

        this.updateProgress();
    }

    startTest() {
        document.getElementById('intro-screen').classList.remove('active');
        document.getElementById('test-form').classList.add('active');
        this.showQuestion(0);
    }

    showQuestion(index) {
        document.querySelectorAll('.question').forEach((q, i) => {
            q.classList.toggle('active', i === index);
        });

        document.getElementById('prev-btn').style.display = index === 0 ? 'none' : 'block';
        document.getElementById('next-btn').style.display = index === this.questions.length - 1 ? 'none' : 'block';
        document.getElementById('submit-btn').style.display = index === this.questions.length - 1 ? 'block' : 'none';

        this.updateProgress();
    }

    updateProgress() {
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = 
            `Вопрос ${this.currentQuestion + 1} из ${this.questions.length}`;
    }

    saveAnswer() {
        const textarea = document.querySelector(`textarea[data-index="${this.currentQuestion}"]`);
        if (textarea) {
            this.answers[this.currentQuestion] = textarea.value.trim();
        }
    }

    nextQuestion() {
        this.saveAnswer();
        
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.showQuestion(this.currentQuestion);
        }
    }

    previousQuestion() {
        this.saveAnswer();
        
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.showQuestion(this.currentQuestion);
        }
    }

    async submitTest(e) {
        e.preventDefault();
        this.saveAnswer();

        // Проверяем, что все вопросы answered
        const unanswered = this.answers.filter(answer => !answer || answer.trim() === '');
        if (unanswered.length > 0) {
            if (!confirm('Некоторые вопросы остались без ответа. Вы уверены, что хотите продолжить?')) {
                return;
            }
        }

        // Показываем экран загрузки
        document.getElementById('test-form').classList.remove('active');
        document.getElementById('loading-screen').classList.add('active');

        try {
            const analysis = await this.analyzeWithDeepSeek();
            this.showResults(analysis);
        } catch (error) {
            console.error('Error analyzing answers:', error);
            this.showResults(this.generateFallbackAnalysis());
        }
    }

    async analyzeWithDeepSeek() {
    try {
        // Netlify Function URL
        const response = await fetch('/.netlify/functions/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                answers: this.answers 
            }),
        });

        const data = await response.json();
        return data.analysis || this.generateFallbackAnalysis();
        
    } catch (error) {
        console.error('Error:', error);
        return this.generateFallbackAnalysis();
    }
}

    generateAnalysis() {
        // Анализ на основе ключевых слов в ответах
        const allAnswers = this.answers.join(' ').toLowerCase();
        
        let analysis = "На основе ваших ответов я могу предложить следующие направления:\n\n";

        // Анализ интересов
        if (allAnswers.includes('программирование') || allAnswers.includes('компьютер') || allAnswers.includes('технологи')) {
            analysis += "💻 **IT-сфера**: Разработчик, Data Scientist, IT-специалист\n";
        }
        
        if (allAnswers.includes('медицина') || allAnswers.includes('лечить') || allAnswers.includes('здоровье')) {
            analysis += "🏥 **Медицина**: Врач, медсестра, фармацевт\n";
        }
        
        if (allAnswers.includes('учить') || allAnswers.includes('образование') || allAnswers.includes('преподава')) {
            analysis += "📚 **Образование**: Учитель, преподаватель, педагог\n";
        }
        
        if (allAnswers.includes('бизнес') || allAnswers.includes('управление') || allAnswers.includes('организац')) {
            analysis += "💼 **Бизнес и менеджмент**: Менеджер, предприниматель, руководитель\n";
        }
        
        if (allAnswers.includes('творч') || allAnswers.includes('искусство') || allAnswers.includes('дизайн')) {
            analysis += "🎨 **Творческие профессии**: Дизайнер, художник, архитектор\n";
        }
        
        if (allAnswers.includes('наука') || allAnswers.includes('исследование') || allAnswers.includes('эксперимент')) {
            analysis += "🔬 **Наука и исследования**: Ученый, исследователь, лаборант\n";
        }

        analysis += "\n**Рекомендации для дальнейшего развития:**\n";
        analysis += "• Пройдите дополнительные профессиональные тесты\n";
        analysis += "• Посетите дни открытых дверей в вузах\n";
        analysis += "• Пообщайтесь с представителями интересующих профессий\n";
        analysis += "• Развивайте навыки, соответствующие выбранному направлению\n\n";

        analysis += "Помните, что выбор профессии - это важный шаг, и вы всегда можете изменить направление в будущем!";

        return analysis;
    }

    generateFallbackAnalysis() {
        return `На основе ваших ответов я вижу разнообразные интересы и способности. Вот общие рекомендации:

🔍 **Для уточнения профессионального направления рекомендую:**

1. Пройти дополнительные профориентационные тесты
2. Посетить консультацию с карьерным консультантом
3. Пообщаться с представителями разных профессий
4. Попробовать стажировки в разных сферах

💡 **Следующие шаги:**
- Составьте список интересующих профессий
- Изучите требования к этим профессиям
- Определите, какие навыки вам нужно развить
- Начните с малого - попробуйте курсы или воркшопы

Помните, что профессиональный путь может меняться - это нормально! Главное продолжать развиваться и пробовать новое.`;
    }

    showResults(analysis) {
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('results-screen').classList.add('active');
        document.getElementById('results-text').textContent = analysis;
    }

    restartTest() {
        this.currentQuestion = 0;
        this.answers = [];
        document.getElementById('results-screen').classList.remove('active');
        document.getElementById('test-form').classList.add('active');
        this.renderQuestions();
        this.showQuestion(0);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new ProfessionTest();
});
