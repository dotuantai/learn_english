<script setup>
import { ref, computed } from 'vue'
import { speakEnglish } from '../utils/speech'

const props = defineProps({
  words: {
    type: Array,
    required: true
  }
})

// Quiz States: 'setup' | 'playing' | 'completed'
const quizState = ref('setup')

// Settings
const quizType = ref('en_vi') // 'en_vi' | 'vi_en' | 'listening' | 'mixed'
const questionCount = ref(10) // 10 | 20 | 52

// Runtime Quiz Data
const questions = ref([])
const currentQuestionIndex = ref(0)
const selectedOptionIndex = ref(null)
const isAnswered = ref(false)
const score = ref(0)
const streak = ref(0)
const maxStreak = ref(0)
const incorrectAnswers = ref([])

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || null
})

const quizProgress = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentQuestionIndex.value) / questions.value.length) * 100)
})

// Generate Quiz Questions
function startQuiz() {
  if (props.words.length < 4) return

  // 1. Shuffle word list
  const shuffledWords = [...props.words].sort(() => 0.5 - Math.random())
  const selectedWords = shuffledWords.slice(0, Math.min(questionCount.value, props.words.length))

  // 2. Build questions
  questions.value = selectedWords.map((targetWord) => {
    let mode = quizType.value
    if (mode === 'mixed') {
      const modes = ['en_vi', 'vi_en', 'listening']
      mode = modes[Math.floor(Math.random() * modes.length)]
    }

    // Pick 3 distractors
    const otherWords = props.words.filter(w => w.id !== targetWord.id)
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random())
    const distractors = shuffledOthers.slice(0, 3)

    // Build 4 options
    const rawOptions = [targetWord, ...distractors]
    const randomizedOptions = [...rawOptions].sort(() => 0.5 - Math.random())
    const correctIndex = randomizedOptions.findIndex(o => o.id === targetWord.id)

    return {
      target: targetWord,
      mode: mode,
      options: randomizedOptions,
      correctIndex: correctIndex
    }
  })

  // Reset counters
  currentQuestionIndex.value = 0
  selectedOptionIndex.value = null
  isAnswered.value = false
  score.value = 0
  streak.value = 0
  maxStreak.value = 0
  incorrectAnswers.value = []
  quizState.value = 'playing'

  playQuestionAudioIfNeeded()
}

function playQuestionAudioIfNeeded() {
  setTimeout(() => {
    if (currentQuestion.value && currentQuestion.value.mode === 'listening') {
      speakEnglish(currentQuestion.value.target.word)
    }
  }, 300)
}

function selectOption(index) {
  if (isAnswered.value) return

  selectedOptionIndex.value = index
  isAnswered.value = true

  const isCorrect = (index === currentQuestion.value.correctIndex)
  if (isCorrect) {
    score.value += 100 + (streak.value * 15)
    streak.value += 1
    if (streak.value > maxStreak.value) {
      maxStreak.value = streak.value
    }
  } else {
    streak.value = 0
    incorrectAnswers.value.push({
      target: currentQuestion.value.target,
      userChoice: currentQuestion.value.options[index],
      correctOption: currentQuestion.value.options[currentQuestion.value.correctIndex]
    })
  }

  speakEnglish(currentQuestion.value.target.word)
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.length - 1) {
    currentQuestionIndex.value += 1
    selectedOptionIndex.value = null
    isAnswered.value = false
    playQuestionAudioIfNeeded()
  } else {
    quizState.value = 'completed'
  }
}

function retryWrongQuestions() {
  if (incorrectAnswers.value.length === 0) return

  const wrongTargets = incorrectAnswers.value.map(item => item.target)
  questions.value = wrongTargets.map((targetWord) => {
    let mode = quizType.value === 'mixed' ? 'en_vi' : quizType.value
    const otherWords = props.words.filter(w => w.id !== targetWord.id)
    const distractors = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3)
    const options = [targetWord, ...distractors].sort(() => 0.5 - Math.random())

    return {
      target: targetWord,
      mode: mode,
      options: options,
      correctIndex: options.findIndex(o => o.id === targetWord.id)
    }
  })

  currentQuestionIndex.value = 0
  selectedOptionIndex.value = null
  isAnswered.value = false
  score.value = 0
  streak.value = 0
  incorrectAnswers.value = []
  quizState.value = 'playing'
  playQuestionAudioIfNeeded()
}

const resultEvaluation = computed(() => {
  const total = questions.value.length
  const correctCount = total - incorrectAnswers.value.length
  const percentage = Math.round((correctCount / total) * 100)

  if (percentage === 100) {
    return { title: 'Tuyệt đỉnh! 🏆', desc: 'Bạn đã trả lời chính xác 100% câu hỏi!', color: '#059669' }
  } else if (percentage >= 80) {
    return { title: 'Rất xuất sắc! 🌟', desc: 'Kiến thức từ vựng y tế của bạn rất vững chắc!', color: '#0284c7' }
  } else if (percentage >= 50) {
    return { title: 'Khá tốt! 👍', desc: 'Hãy ôn lại một vài từ chưa chuẩn để ghi nhớ lâu hơn!', color: '#d97706' }
  } else {
    return { title: 'Cần cố gắng thêm! 💪', desc: 'Hãy xem lại các câu sai bên dưới và làm lại nhé!', color: '#dc2626' }
  }
})
</script>

<template>
  <div class="quiz-container animate-fade-in">
    <!-- 1. QUIZ SETUP SCREEN -->
    <div v-if="quizState === 'setup'" class="setup-card">
      <div class="setup-header">
        <div class="quiz-icon-badge">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="m9 15 2 2 4-4"/>
          </svg>
        </div>
        <h2 class="setup-title">Kiểm Tra Trắc Nghiệm</h2>
        <p class="setup-subtitle">52 thuật ngữ Y tế & Chăm sóc sức khỏe</p>
      </div>

      <!-- Quiz Form -->
      <div class="setup-form">
        <!-- Choose Type -->
        <div class="form-group">
          <label class="form-label">Dạng bài trắc nghiệm:</label>
          <div class="options-grid">
            <button 
              class="type-choice-btn" 
              :class="{ active: quizType === 'en_vi' }"
              @click="quizType = 'en_vi'"
            >
              <span class="type-icon">🔤</span>
              <div class="type-text">
                <strong>Anh ➔ Việt</strong>
                <small>Nhìn từ tiếng Anh, chọn nghĩa tiếng Việt</small>
              </div>
            </button>

            <button 
              class="type-choice-btn" 
              :class="{ active: quizType === 'vi_en' }"
              @click="quizType = 'vi_en'"
            >
              <span class="type-icon">🇻🇳</span>
              <div class="type-text">
                <strong>Việt ➔ Anh</strong>
                <small>Nhìn nghĩa tiếng Việt, chọn từ tiếng Anh</small>
              </div>
            </button>

            <button 
              class="type-choice-btn" 
              :class="{ active: quizType === 'listening' }"
              @click="quizType = 'listening'"
            >
              <span class="type-icon">🎧</span>
              <div class="type-text">
                <strong>Luyện nghe phát âm</strong>
                <small>Nghe giọng đọc, chọn từ chính xác</small>
              </div>
            </button>

            <button 
              class="type-choice-btn" 
              :class="{ active: quizType === 'mixed' }"
              @click="quizType = 'mixed'"
            >
              <span class="type-icon">🎲</span>
              <div class="type-text">
                <strong>Hỗn hợp tất cả dạng</strong>
                <small>Xáo trộn kết hợp cả 3 dạng trên</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Choose Count -->
        <div class="form-group">
          <label class="form-label">Số lượng câu hỏi:</label>
          <div class="count-selector">
            <button 
              class="count-btn" 
              :class="{ active: questionCount === 10 }"
              @click="questionCount = 10"
            >
              10 Câu
            </button>
            <button 
              class="count-btn" 
              :class="{ active: questionCount === 20 }"
              @click="questionCount = 20"
            >
              20 Câu
            </button>
            <button 
              class="count-btn" 
              :class="{ active: questionCount === 52 }"
              @click="questionCount = 52"
            >
              Tất cả 52 Câu
            </button>
          </div>
        </div>

        <!-- Start Button -->
        <button id="btn-start-quiz" class="start-quiz-btn" @click="startQuiz">
          <span>Bắt đầu làm bài</span>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 2. ACTIVE QUIZ PLAYING SCREEN -->
    <div v-else-if="quizState === 'playing' && currentQuestion" class="game-wrapper">
      <!-- Quiz Header: Score, Streak, Progress -->
      <div class="game-meta">
        <div class="meta-item">
          <span class="meta-label">Câu hỏi</span>
          <span class="meta-val"><strong>{{ currentQuestionIndex + 1 }}</strong> / {{ questions.length }}</span>
        </div>

        <div class="meta-streak" v-if="streak > 1">
          <span>🔥 Chuỗi đúng: <strong>{{ streak }}</strong></span>
        </div>

        <div class="meta-item">
          <span class="meta-label">Điểm số</span>
          <span class="meta-val score-val">{{ score }}</span>
        </div>
      </div>

      <!-- Top Bar -->
      <div class="quiz-bar">
        <div class="quiz-bar-fill" :style="{ width: `${quizProgress}%` }"></div>
      </div>

      <!-- Question Card -->
      <div class="question-card animate-pop-in" :key="currentQuestionIndex">
        <div class="question-badge-row">
          <span class="mode-tag">
            <template v-if="currentQuestion.mode === 'en_vi'">Anh ➔ Việt</template>
            <template v-else-if="currentQuestion.mode === 'vi_en'">Việt ➔ Anh</template>
            <template v-else>🎧 Luyện Nghe</template>
          </span>
          <span class="pos-tag">{{ currentQuestion.target.type }}</span>
        </div>

        <!-- Target Presentation based on mode -->
        <div class="target-box">
          <!-- Case 1: English -> Vietnamese -->
          <div v-if="currentQuestion.mode === 'en_vi'" class="target-en">
            <h3 class="target-word">{{ currentQuestion.target.word }}</h3>
            <div class="target-ipa-row">
              <span class="target-ipa">{{ currentQuestion.target.ipa }}</span>
              <button 
                class="target-audio-btn" 
                title="Nghe phát âm" 
                @click="speakEnglish(currentQuestion.target.word)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </button>
            </div>
            <p class="target-prompt">Chọn nghĩa tiếng Việt đúng:</p>
          </div>

          <!-- Case 2: Vietnamese -> English -->
          <div v-else-if="currentQuestion.mode === 'vi_en'" class="target-vi">
            <p class="target-prompt">Chọn từ tiếng Anh phù hợp với nghĩa:</p>
            <h3 class="target-meaning">"{{ currentQuestion.target.meaning }}"</h3>
          </div>

          <!-- Case 3: Listening -->
          <div v-else class="target-listening">
            <p class="target-prompt">Nghe âm thanh và chọn từ tương ứng:</p>
            <button 
              class="listen-big-btn" 
              @click="speakEnglish(currentQuestion.target.word)"
            >
              <div class="sound-wave-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              </div>
              <span>Chạm để nghe lại phát âm</span>
            </button>
          </div>
        </div>

        <!-- 4 Options Grid -->
        <div class="options-container">
          <button
            v-for="(option, idx) in currentQuestion.options"
            :key="option.id"
            class="quiz-option"
            :class="{
              'correct': isAnswered && idx === currentQuestion.correctIndex,
              'wrong': isAnswered && selectedOptionIndex === idx && idx !== currentQuestion.correctIndex,
              'disabled': isAnswered
            }"
            @click="selectOption(idx)"
          >
            <span class="option-key">{{ ['A', 'B', 'C', 'D'][idx] }}</span>
            <div class="option-content">
              <template v-if="currentQuestion.mode === 'en_vi'">
                <span class="option-title">{{ option.meaning }}</span>
              </template>
              <template v-else>
                <span class="option-title">{{ option.word }}</span>
                <span class="option-sub">{{ option.ipa }} • {{ option.type }}</span>
              </template>
            </div>

            <!-- Feedback indicator icons -->
            <div v-if="isAnswered" class="option-feedback">
              <svg v-if="idx === currentQuestion.correctIndex" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#16a34a" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else-if="selectedOptionIndex === idx" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#dc2626" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
          </button>
        </div>

        <!-- Explanation & Next Action -->
        <div v-if="isAnswered" class="answer-feedback animate-fade-in">
          <div class="feedback-text">
            <div class="feedback-tag" :class="selectedOptionIndex === currentQuestion.correctIndex ? 'tag-correct' : 'tag-wrong'">
              {{ selectedOptionIndex === currentQuestion.correctIndex ? '✓ Chính xác!' : '✕ Chưa đúng!' }}
            </div>
            <div class="correct-detail">
              <strong>{{ currentQuestion.target.word }}</strong>
              <span>{{ currentQuestion.target.ipa }}</span>
              <span>➔ {{ currentQuestion.target.meaning }}</span>
            </div>
          </div>

          <button id="btn-next-question" class="next-question-btn" @click="nextQuestion">
            <span>{{ currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả' }}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 3. QUIZ COMPLETED SUMMARY SCREEN -->
    <div v-else-if="quizState === 'completed'" class="results-card animate-fade-in">
      <div class="results-banner">
        <div class="result-badge-icon" :style="{ color: resultEvaluation.color }">
          <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="7"/>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
          </svg>
        </div>
        <h2 class="result-title">{{ resultEvaluation.title }}</h2>
        <p class="result-desc">{{ resultEvaluation.desc }}</p>

        <!-- Stats Grid -->
        <div class="result-stats">
          <div class="res-stat-box">
            <span class="res-stat-val text-success">{{ questions.length - incorrectAnswers.length }} / {{ questions.length }}</span>
            <span class="res-stat-label">Số câu đúng</span>
          </div>
          <div class="res-stat-box">
            <span class="res-stat-val text-primary">{{ Math.round(((questions.length - incorrectAnswers.length) / questions.length) * 100) }}%</span>
            <span class="res-stat-label">Độ chính xác</span>
          </div>
          <div class="res-stat-box">
            <span class="res-stat-val text-accent">{{ score }}</span>
            <span class="res-stat-label">Tổng điểm</span>
          </div>
          <div class="res-stat-box">
            <span class="res-stat-val text-warning">{{ maxStreak }} 🔥</span>
            <span class="res-stat-label">Chuỗi cao nhất</span>
          </div>
        </div>
      </div>

      <!-- Incorrect answers review list -->
      <div v-if="incorrectAnswers.length > 0" class="wrong-review-section">
        <h4 class="wrong-title">Các câu cần lưu ý ({{ incorrectAnswers.length }} câu):</h4>
        <div class="wrong-list">
          <div v-for="(item, idx) in incorrectAnswers" :key="idx" class="wrong-item">
            <div class="wrong-item-left">
              <span class="wrong-word">{{ item.target.word }}</span>
              <span class="wrong-ipa">{{ item.target.ipa }}</span>
              <span class="wrong-type">({{ item.target.type }})</span>
            </div>
            <div class="wrong-item-right">
              <span class="correct-meaning">Nghĩa đúng: <strong>{{ item.target.meaning }}</strong></span>
            </div>
            <button class="wrong-audio-btn" @click="speakEnglish(item.target.word)" title="Nghe lại">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="results-actions">
        <button 
          v-if="incorrectAnswers.length > 0" 
          class="retry-wrong-btn"
          @click="retryWrongQuestions"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          <span>Luyện lại {{ incorrectAnswers.length }} câu sai</span>
        </button>

        <button class="restart-btn" @click="quizState = 'setup'">
          <span>Làm bài kiểm tra mới</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}

/* 1. Setup Card */
.setup-card {
  background: #ffffff;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-subtle);
  padding: 32px 28px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setup-header {
  text-align: center;
}

.quiz-icon-badge {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--primary-bg);
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  margin: 0 auto 12px;
}

.setup-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 4px;
}

.setup-subtitle {
  color: var(--text-muted);
  font-size: 0.92rem;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-main);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.type-choice-btn {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  box-shadow: var(--shadow-xs);
}

.type-choice-btn:hover {
  background: var(--bg-surface);
  border-color: var(--border-medium);
}

.type-choice-btn.active {
  background: var(--primary-bg);
  border: 1px solid var(--primary);
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.15);
}

.type-icon {
  font-size: 1.4rem;
}

.type-text strong {
  display: block;
  font-size: 0.92rem;
  color: var(--text-main);
  margin-bottom: 2px;
}

.type-text small {
  color: var(--text-muted);
  font-size: 0.76rem;
  line-height: 1.3;
  display: block;
}

.count-selector {
  display: flex;
  gap: 8px;
}

.count-btn {
  flex: 1;
  padding: 11px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s;
}

.count-btn:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.count-btn.active {
  color: var(--accent);
  background: var(--accent-bg);
  border-color: #bae6fd;
}

.start-quiz-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  border-radius: 12px;
  background: var(--accent-gradient);
  border: none;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(5, 150, 105, 0.25);
  margin-top: 6px;
}

.start-quiz-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
}

/* 2. Game Screen */
.game-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.meta-label {
  font-size: 0.72rem;
  color: var(--text-dim);
  text-transform: uppercase;
  font-weight: 600;
}

.meta-val {
  font-size: 0.92rem;
  color: var(--text-muted);
}

.meta-val strong {
  color: var(--text-main);
}

.score-val {
  color: var(--primary);
  font-weight: 800;
  font-size: 1.05rem;
}

.meta-streak {
  background: var(--warning-bg);
  border: 1px solid #fde68a;
  color: var(--warning);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
}

.quiz-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.quiz-bar-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.3s ease;
}

.question-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mode-tag {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--secondary-bg);
  color: var(--secondary);
  border: 1px solid rgba(79, 70, 229, 0.2);
}

.pos-tag {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--text-dim);
}

.target-box {
  text-align: center;
  padding: 10px 0;
}

.target-word {
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 6px;
}

.target-ipa-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
}

.target-ipa {
  font-size: 1.1rem;
  color: var(--accent);
  font-weight: 600;
}

.target-audio-btn {
  background: var(--primary-bg);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--primary);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.target-audio-btn:hover {
  transform: scale(1.1);
}

.target-meaning {
  font-size: clamp(1.5rem, 4.5vw, 2rem);
  font-weight: 800;
  color: var(--text-main);
  margin: 10px 0;
}

.target-prompt {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.listen-big-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: var(--accent-bg);
  border: 1px solid #bae6fd;
  border-radius: 14px;
  padding: 20px;
  margin: 12px auto;
  color: var(--accent);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.listen-big-btn:hover {
  background: #e0f2fe;
}

.sound-wave-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
  width: 100%;
  box-shadow: var(--shadow-xs);
}

.quiz-option:hover:not(.disabled) {
  background: var(--bg-surface);
  border-color: var(--border-medium);
  transform: translateX(3px);
}

.option-key {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--text-dim);
  flex-shrink: 0;
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
}

.option-sub {
  font-size: 0.78rem;
  color: var(--text-dim);
}

.quiz-option.correct {
  background: var(--success-bg) !important;
  border: 1px solid var(--success-border) !important;
}

.quiz-option.correct .option-key {
  background: var(--success);
  color: #fff;
}

.quiz-option.correct .option-title {
  color: #15803d;
  font-weight: 700;
}

.quiz-option.wrong {
  background: var(--danger-bg) !important;
  border: 1px solid var(--danger-border) !important;
}

.quiz-option.wrong .option-key {
  background: var(--danger);
  color: #fff;
}

.quiz-option.wrong .option-title {
  color: #991b1b;
}

.quiz-option.disabled {
  cursor: default;
}

.answer-feedback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}

.feedback-tag {
  font-weight: 800;
  font-size: 0.92rem;
  margin-bottom: 2px;
}

.tag-correct {
  color: var(--success);
}

.tag-wrong {
  color: var(--danger);
}

.correct-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.correct-detail strong {
  color: var(--text-main);
}

.next-question-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 10px;
  background: var(--accent-gradient);
  border: none;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.next-question-btn:hover {
  transform: translateY(-2px);
}

/* 3. Results Screen */
.results-card {
  background: #ffffff;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-subtle);
  padding: 32px 24px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.results-banner {
  text-align: center;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 24px;
}

.result-badge-icon {
  margin-bottom: 8px;
}

.result-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 6px;
}

.result-desc {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 20px;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.res-stat-box {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.res-stat-val {
  font-size: 1.35rem;
  font-weight: 800;
}

.text-success { color: #16a34a; }
.text-primary { color: #0284c7; }
.text-accent { color: #4f46e5; }
.text-warning { color: #d97706; }

.res-stat-label {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.wrong-review-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wrong-title {
  font-size: 0.92rem;
  color: var(--danger);
  font-weight: 700;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.wrong-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  gap: 10px;
}

.wrong-item-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wrong-word {
  font-weight: 700;
  color: #991b1b;
}

.wrong-ipa {
  font-size: 0.8rem;
  color: var(--accent);
}

.wrong-type {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.wrong-item-right {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.wrong-audio-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.results-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.retry-wrong-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  color: var(--danger);
  font-weight: 700;
  cursor: pointer;
}

.restart-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  background: var(--accent-gradient);
  border: none;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 600px) {
  .quiz-container {
    padding: 12px;
  }
  .setup-card, .question-card, .results-card {
    padding: 18px 14px;
  }
  .options-grid {
    grid-template-columns: 1fr;
  }
  .result-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .answer-feedback {
    flex-direction: column;
    align-items: stretch;
  }
  .next-question-btn {
    justify-content: center;
  }
  .results-actions {
    flex-direction: column;
  }
  .retry-wrong-btn, .restart-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
