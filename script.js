// Assuming quizData is loaded globally from data.js
// Assuming culturalData is loaded globally from culturalData.js
const state = {
    currentSubject: 'conservation',
    currentWeek: 1,
    progress: {}, // Tracks answered questions per week: { weekNum: { correct: 0, totalAnswered: 0 } }
    questionsByWeek: {}
};

// DOM Elements
const subjectSelector = document.getElementById('subjectSelector');
const subjectTitle = document.getElementById('subjectTitle');
const weekSelector = document.getElementById('weekSelector');
const questionsContainer = document.getElementById('questionsContainer');
const currentWeekDisplay = document.getElementById('currentWeekDisplay');
const progressDisplay = document.getElementById('progressDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');

function init() {
    // Subject buttons setup
    if (subjectSelector) {
        const subjectBtns = subjectSelector.querySelectorAll('.week-btn');
        subjectBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subject = e.target.getAttribute('data-subject');
                selectSubject(subject);
            });
        });
    }

    // Load initial data
    loadSubjectData(state.currentSubject);
}

function selectSubject(subject) {
    if (state.currentSubject === subject) return;
    state.currentSubject = subject;

    // Update active subject button
    const subjectBtns = subjectSelector.querySelectorAll('.week-btn');
    subjectBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-subject') === subject);
    });

    if (subject === 'conservation') {
        subjectTitle.textContent = 'Conservation Economics';
    } else if (subject === 'cultural') {
        subjectTitle.textContent = 'Introduction to Cultural Studies';
    }

    loadSubjectData(subject);
}

function loadSubjectData(subject) {
    let currentData = [];
    if (subject === 'conservation') {
        currentData = quizData;
    } else if (subject === 'cultural') {
        currentData = culturalData;
    }

    // reset state
    state.progress = {};
    state.questionsByWeek = {};
    weekSelector.innerHTML = '';

    // Process data
    const weeks = new Set();
    currentData.forEach(q => {
        weeks.add(q.week);
        if (!state.questionsByWeek[q.week]) {
            state.questionsByWeek[q.week] = [];
            state.progress[q.week] = { correct: 0, totalAnswered: 0 };
        }
        state.questionsByWeek[q.week].push(q);
    });

    const sortedWeeks = Array.from(weeks).sort((a, b) => a - b);
    
    // Default to the first available week
    if (sortedWeeks.length > 0) {
        state.currentWeek = sortedWeeks[0];
    } else {
        state.currentWeek = 1;
    }

    // Render Week Buttons
    sortedWeeks.forEach(week => {
        const btn = document.createElement('button');
        btn.className = `week-btn ${week === state.currentWeek ? 'active' : ''}`;
        btn.textContent = `Week ${week}`;
        btn.onclick = () => selectWeek(week);
        weekSelector.appendChild(btn);
    });

    renderWeek();
}

function selectWeek(week) {
    if (state.currentWeek === week) return;
    state.currentWeek = week;
    
    // Update active button only within weekSelector
    weekSelector.querySelectorAll('.week-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === `Week ${week}`);
    });
    
    renderWeek();
}

function renderWeek() {
    currentWeekDisplay.textContent = state.currentWeek;
    updateStatsDisplay();
    
    questionsContainer.innerHTML = '';
    const questions = state.questionsByWeek[state.currentWeek] || [];
    
    // Sort logic removed, keeping original order of PDF
    questions.forEach((q, index) => {
        const qCard = createQuestionCard(q, index + 1);
        questionsContainer.appendChild(qCard);
    });
    
    // Initialize icons if lucide is available
    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }
}

function updateStatsDisplay() {
    const weekProgress = state.progress[state.currentWeek];
    const totalQuestions = state.questionsByWeek[state.currentWeek]?.length || 0;
    
    progressDisplay.textContent = `${weekProgress.totalAnswered} / ${totalQuestions}`;
    
    if (weekProgress.totalAnswered === 0) {
        scoreDisplay.textContent = `0%`;
    } else {
        const score = Math.round((weekProgress.correct / weekProgress.totalAnswered) * 100);
        scoreDisplay.textContent = `${score}%`;
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function createQuestionCard(q, qNumber) {
    const card = document.createElement('div');
    card.className = 'question-card';
    
    // We add a random animation delay so they cascade in beautifully
    const delay = Math.min((qNumber - 1) * 0.1, 0.8);
    card.style.animationDelay = `${delay}s`;
    
    const header = document.createElement('div');
    header.className = 'question-header';
    header.innerHTML = `
        <div class="question-number">${qNumber}</div>
        <div class="question-text">${escapeHTML(q.question)}</div>
    `;
    card.appendChild(header);
    
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'options-grid';
    
    // Keep track if answered
    let isAnswered = false;
    
    const feedbackMsg = document.createElement('div');
    feedbackMsg.className = 'feedback-msg';

    q.options.forEach((opt, optIndex) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        btn.innerHTML = `
            <span>${escapeHTML(opt.text)}</span>
            <i data-lucide="check-circle-2" class="option-icon icon-correct"></i>
            <i data-lucide="x-circle" class="option-icon icon-incorrect"></i>
        `;
        
        btn.onclick = () => {
            if (isAnswered) return;
            isAnswered = true;
            
            // disable all buttons
            const allBtns = optionsGrid.querySelectorAll('.option-btn');
            allBtns.forEach(b => b.disabled = true);
            
            // update stats
            state.progress[state.currentWeek].totalAnswered++;
            
            if (opt.is_correct) {
                btn.classList.add('correct');
                state.progress[state.currentWeek].correct++;
                showFeedback(feedbackMsg, true, "Correct! Great job.");
            } else {
                btn.classList.add('incorrect');
                // Find and highlight correct one
                allBtns.forEach((b, idx) => {
                    if (q.options[idx].is_correct) {
                        b.classList.add('correct');
                    }
                });
                showFeedback(feedbackMsg, false, "Incorrect. The highlighted option is the correct answer.");
            }
            
            updateStatsDisplay();
            if (window.lucide) window.lucide.createIcons();
        };
        
        optionsGrid.appendChild(btn);
    });
    
    card.appendChild(optionsGrid);
    card.appendChild(feedbackMsg);
    
    return card;
}

function showFeedback(el, isCorrect, text) {
    el.className = `feedback-msg show ${isCorrect ? 'feedback-success' : 'feedback-error'}`;
    el.innerHTML = `
        <i data-lucide="${isCorrect ? 'check-circle' : 'alert-circle'}"></i>
        <span>${text}</span>
    `;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
