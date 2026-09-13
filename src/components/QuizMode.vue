<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import AppIcon from './AppIcon.vue'
import QuizSettings from './QuizSettings.vue'
import { speakEnglish } from '../utils/speech'

defineEmits(['back-to-lessons'])
const nextButton = ref(null)
let audioTimer
const props = defineProps({
  autoStart: Boolean,
  initialOptions: { type: Object, default: () => ({}) },
  words: {
    type: Array,
    required: true,
  },
})

// Quiz States: 'setup' | 'playing' | 'completed'
const quizState = ref('setup')

// Settings
const quizType = ref(
  ['en_vi', 'vi_en', 'listening', 'mixed'].includes(
    props.initialOptions.quizType,
  )
    ? props.initialOptions.quizType
    : 'en_vi',
) // 'en_vi' | 'vi_en' | 'listening' | 'mixed'
const questionCount = ref(
  Math.min(props.words.length, props.initialOptions.questionCount || 10),
) // Count is capped to the selected lesson.

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
  return Math.round((currentQuestionIndex.value / questions.value.length) * 100)
})

// Generate Quiz Questions
function startQuiz() {
  if (props.words.length < 4) return

  // 1. Shuffle word list
  const shuffledWords = [...props.words].sort(() => 0.5 - Math.random())
  const selectedWords = shuffledWords.slice(
    0,
    Math.min(questionCount.value, props.words.length),
  )

  // 2. Build questions
  questions.value = selectedWords.map((targetWord) => {
    let mode = quizType.value
    if (mode === 'mixed') {
      const modes = ['en_vi', 'vi_en', 'listening']
      mode = modes[Math.floor(Math.random() * modes.length)]
    }

    // Pick 3 distractors
    const otherWords = props.words.filter((w) => w.id !== targetWord.id)
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random())
    const distractors = shuffledOthers.slice(0, 3)

    // Build 4 options
    const rawOptions = [targetWord, ...distractors]
    const randomizedOptions = [...rawOptions].sort(() => 0.5 - Math.random())
    const correctIndex = randomizedOptions.findIndex(
      (o) => o.id === targetWord.id,
    )

    return {
      target: targetWord,
      mode: mode,
      options: randomizedOptions,
      correctIndex: correctIndex,
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
  clearTimeout(audioTimer)
  audioTimer = setTimeout(() => {
    if (currentQuestion.value && currentQuestion.value.mode === 'listening') {
      speakEnglish(currentQuestion.value.target.word)
    }
  }, 300)
}

function selectOption(index) {
  if (isAnswered.value) return

  selectedOptionIndex.value = index
  isAnswered.value = true

  const isCorrect = index === currentQuestion.value.correctIndex
  if (isCorrect) {
    score.value += 100 + streak.value * 15
    streak.value += 1
    if (streak.value > maxStreak.value) {
      maxStreak.value = streak.value
    }
  } else {
    streak.value = 0
    incorrectAnswers.value.push({
      target: currentQuestion.value.target,
      userChoice: currentQuestion.value.options[index],
      correctOption:
        currentQuestion.value.options[currentQuestion.value.correctIndex],
    })
  }

  clearTimeout(audioTimer)
  speakEnglish(currentQuestion.value.target.word)
  nextTick(() => nextButton.value?.focus({ preventScroll: true }))
}

function nextQuestion() {
  if (!isAnswered.value) return
  if (currentQuestionIndex.value < questions.value.length - 1) {
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

  const wrongTargets = incorrectAnswers.value.map((item) => item.target)
  questions.value = wrongTargets.map((targetWord) => {
    let mode = quizType.value === 'mixed' ? 'en_vi' : quizType.value
    const otherWords = props.words.filter((w) => w.id !== targetWord.id)
    const distractors = [...otherWords]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
    const options = [targetWord, ...distractors].sort(() => 0.5 - Math.random())

    return {
      target: targetWord,
      mode: mode,
      options: options,
      correctIndex: options.findIndex((o) => o.id === targetWord.id),
    }
  })

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

onMounted(() => {
  if (props.autoStart) startQuiz()
})
onUnmounted(() => {
  clearTimeout(audioTimer)
  window.speechSynthesis?.cancel()
})

const resultEvaluation = computed(() => {
  const total = questions.value.length
  const correctCount = total - incorrectAnswers.value.length
  const percentage = Math.round((correctCount / total) * 100)

  if (percentage === 100) {
    return {
      title: 'Tuyệt đỉnh!',
      desc: 'Bạn đã trả lời chính xác 100% câu hỏi!',
      color: '#059669',
    }
  } else if (percentage >= 80) {
    return {
      title: 'Rất xuất sắc!',
      desc: 'Kiến thức từ vựng y tế của bạn rất vững chắc!',
      color: '#0284c7',
    }
  } else if (percentage >= 50) {
    return {
      title: 'Khá tốt!',
      desc: 'Hãy ôn lại một vài từ chưa chuẩn để ghi nhớ lâu hơn!',
      color: '#d97706',
    }
  } else {
    return {
      title: 'Mỗi lần thử, thêm tiến bộ!',
      desc: 'Hãy xem lại các câu sai bên dưới và làm lại nhé!',
      color: '#dc2626',
    }
  }
})
</script>

<template>
  <div class="quiz-container animate-fade-in">
    <!-- 1. QUIZ SETUP SCREEN -->
    <div v-if="quizState === 'setup'" class="setup-card">
      <div class="setup-header">
        <div class="quiz-icon-badge">
          <svg
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14 2 14 8 20 8" />
            <path d="m9 15 2 2 4-4" />
          </svg>
        </div>
        <h2 class="setup-title">Kiểm Tra Trắc Nghiệm</h2>
        <p class="setup-subtitle">
          {{ words.length }} từ vựng trong bài học này
        </p>
      </div>

      <!-- Quiz Form -->
      <div class="setup-form">
        <QuizSettings
          v-model:quiz-type="quizType"
          v-model:question-count="questionCount"
          :word-count="words.length"
        />

        <!-- Start Button -->
        <button
          id="btn-start-quiz"
          class="start-quiz-btn"
          :disabled="words.length < 4"
          @click="startQuiz"
        >
          <span>Bắt đầu làm bài</span>
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 2. ACTIVE QUIZ PLAYING SCREEN -->
    <div
      v-else-if="quizState === 'playing' && currentQuestion"
      class="game-wrapper"
    >
      <!-- Quiz Header: Score, Streak, Progress -->
      <div class="game-meta">
        <div class="meta-item">
          <span class="meta-label">Câu hỏi</span>
          <span class="meta-val"
            ><strong>{{ currentQuestionIndex + 1 }}</strong> /
            {{ questions.length }}</span
          >
        </div>

        <div class="meta-streak" v-if="streak > 1">
          <span
            >Chuỗi đúng: <strong>{{ streak }}</strong></span
          >
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
            <template v-if="currentQuestion.mode === 'en_vi'"
              >Anh ➔ Việt</template
            >
            <template v-else-if="currentQuestion.mode === 'vi_en'"
              >Việt ➔ Anh</template
            >
            <template v-else>Luyện nghe</template>
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
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
            </div>
            <p class="target-prompt">Chọn nghĩa tiếng Việt đúng:</p>
          </div>

          <!-- Case 2: Vietnamese -> English -->
          <div v-else-if="currentQuestion.mode === 'vi_en'" class="target-vi">
            <p class="target-prompt">Chọn từ tiếng Anh phù hợp với nghĩa:</p>
            <h3 class="target-meaning">
              "{{ currentQuestion.target.meaning }}"
            </h3>
          </div>

          <!-- Case 3: Listening -->
          <div v-else class="target-listening">
            <p class="target-prompt">Nghe âm thanh và chọn từ tương ứng:</p>
            <button
              class="listen-big-btn"
              @click="speakEnglish(currentQuestion.target.word)"
            >
              <div class="sound-wave-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
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
              correct: isAnswered && idx === currentQuestion.correctIndex,
              wrong:
                isAnswered &&
                selectedOptionIndex === idx &&
                idx !== currentQuestion.correctIndex,
              disabled: isAnswered,
            }"
            :disabled="isAnswered"
            @click="selectOption(idx)"
          >
            <span class="option-key">{{ ['A', 'B', 'C', 'D'][idx] }}</span>
            <div class="option-content">
              <template v-if="currentQuestion.mode === 'en_vi'">
                <span class="option-title">{{ option.meaning }}</span>
              </template>
              <template v-else>
                <span class="option-title">{{ option.word }}</span>
                <span class="option-sub"
                  >{{ option.ipa }} • {{ option.type }}</span
                >
              </template>
            </div>

            <!-- Feedback indicator icons -->
            <div v-if="isAnswered" class="option-feedback">
              <svg
                v-if="idx === currentQuestion.correctIndex"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#16a34a"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg
                v-else-if="selectedOptionIndex === idx"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#dc2626"
                stroke-width="3"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </button>
        </div>

        <!-- Explanation & Next Action -->
        <div
          v-if="isAnswered"
          class="answer-feedback animate-fade-in"
          role="status"
        >
          <div class="feedback-text">
            <div
              class="feedback-tag"
              :class="
                selectedOptionIndex === currentQuestion.correctIndex
                  ? 'tag-correct'
                  : 'tag-wrong'
              "
            >
              {{
                selectedOptionIndex === currentQuestion.correctIndex
                  ? '✓ Chính xác!'
                  : '✕ Chưa đúng!'
              }}
            </div>
            <div class="correct-detail">
              <strong>{{ currentQuestion.target.word }}</strong>
              <span>{{ currentQuestion.target.ipa }}</span>
              <span>➔ {{ currentQuestion.target.meaning }}</span>
            </div>
          </div>

          <button
            id="btn-next-question"
            ref="nextButton"
            class="next-question-btn"
            @click="nextQuestion"
          >
            <span>{{
              currentQuestionIndex < questions.length - 1
                ? 'Câu tiếp theo'
                : 'Xem kết quả'
            }}</span>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 3. QUIZ COMPLETED SUMMARY SCREEN -->
    <div
      v-else-if="quizState === 'completed'"
      class="results-card animate-fade-in"
    >
      <div class="results-banner">
        <div
          class="result-badge-icon"
          :style="{ color: resultEvaluation.color }"
        >
          <svg
            viewBox="0 0 24 24"
            width="46"
            height="46"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
        </div>
        <h2 class="result-title">{{ resultEvaluation.title }}</h2>
        <p class="result-desc">{{ resultEvaluation.desc }}</p>

        <!-- Stats Grid -->
        <div class="result-stats">
          <div class="res-stat-box">
            <span class="res-stat-val text-success"
              >{{ questions.length - incorrectAnswers.length }} /
              {{ questions.length }}</span
            >
            <span class="res-stat-label">Số câu đúng</span>
          </div>
          <div class="res-stat-box">
            <span class="res-stat-val text-primary"
              >{{
                Math.round(
                  ((questions.length - incorrectAnswers.length) /
                    questions.length) *
                    100,
                )
              }}%</span
            >
            <span class="res-stat-label">Độ chính xác</span>
          </div>
          <div class="res-stat-box">
            <span class="res-stat-val text-accent">{{ score }}</span>
            <span class="res-stat-label">Tổng điểm</span>
          </div>
          <div class="res-stat-box">
            <span class="res-stat-val text-warning">{{ maxStreak }}</span>
            <span class="res-stat-label">Chuỗi cao nhất</span>
          </div>
        </div>
      </div>

      <!-- Incorrect answers review list -->
      <div v-if="incorrectAnswers.length > 0" class="wrong-review-section">
        <h4 class="wrong-title">
          Các câu cần lưu ý ({{ incorrectAnswers.length }} câu):
        </h4>
        <div class="wrong-list">
          <div
            v-for="(item, idx) in incorrectAnswers"
            :key="idx"
            class="wrong-item"
          >
            <div class="wrong-item-left">
              <span class="wrong-word">{{ item.target.word }}</span>
              <span class="wrong-ipa">{{ item.target.ipa }}</span>
              <span class="wrong-type">({{ item.target.type }})</span>
            </div>
            <div class="wrong-item-right">
              <span class="correct-meaning"
                >Nghĩa đúng: <strong>{{ item.target.meaning }}</strong></span
              >
            </div>
            <button
              class="wrong-audio-btn"
              @click="speakEnglish(item.target.word)"
              title="Nghe lại"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="results-actions">
        <button class="btn btn-secondary" @click="$emit('back-to-lessons')">
          Chọn bài học tiếp theo<AppIcon name="arrow" :size="18" />
        </button>
        <button
          v-if="incorrectAnswers.length > 0"
          class="retry-wrong-btn"
          @click="retryWrongQuestions"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
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
  max-width: 780px;
  width: 100%;
  margin: 0 auto;
}
.setup-card,
.question-card,
.results-card {
  background: var(--card-gradient);
  border: 1px solid #ffffffb3;
  border-radius: 36px;
  padding: 32px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.setup-header {
  text-align: center;
}
.quiz-icon-badge {
  width: 66px;
  height: 68px;
  border-radius: 24px;
  background: linear-gradient(135deg, #edd7f5, #ceace4);
  box-shadow: var(--shadow-orb);
  display: grid;
  place-items: center;
  color: var(--primary-dark);
  margin: 0 auto 22px;
}
.setup-title {
  font-size: 1.65rem;
}
.setup-subtitle {
  color: var(--text-muted);
  font-size: 0.84rem;
  margin-top: 8px;
}
.setup-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.start-quiz-btn,
.next-question-btn,
.restart-btn {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 23px;
  border-radius: 20px;
  background: var(--accent-gradient);
  border: 0;
  color: #fff;
  font-size: 0.86rem;
  font-weight: 900;
  box-shadow: var(--shadow-button);
}
.start-quiz-btn:active,
.next-question-btn:active,
.restart-btn:active {
  box-shadow: var(--shadow-pressed);
}
.game-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.game-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 0 5px;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.meta-label {
  font-size: 0.64rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}
.meta-val {
  font-size: 0.9rem;
  color: var(--text-muted);
}
.meta-val strong {
  color: var(--text-main);
  font-size: 1.1rem;
}
.score-val {
  color: var(--primary-dark);
  font-weight: 900;
  font-size: 1.15rem;
}
.meta-streak {
  background: var(--warning-bg);
  color: var(--warning);
  padding: 8px 13px;
  border-radius: 20px;
  font-size: 0.75rem;
}
.quiz-bar {
  height: 8px;
  background: #e6dcec;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 1px 2px 4px #c2b2d040;
}
.quiz-bar-fill {
  height: 100%;
  background: var(--accent-gradient);
  border-radius: inherit;
  transition: width 0.3s;
}
.question-badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.mode-tag {
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 7px 14px;
  border-radius: 20px;
  background: var(--primary-bg);
  color: var(--primary-dark);
}
.pos-tag {
  font-size: 0.73rem;
  color: var(--text-muted);
  background: #efe9f5;
  padding: 6px 13px;
  border-radius: 20px;
}
.target-box {
  text-align: center;
  padding: 10px 0;
}
.target-word {
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  letter-spacing: -0.03em;
  overflow-wrap: anywhere;
}
.target-ipa-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  margin-top: 13px;
}
.target-ipa {
  font-size: 1rem;
  color: var(--primary-dark);
}
.target-audio-btn,
.wrong-audio-btn {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--primary-bg);
  color: var(--primary-dark);
}
.target-prompt {
  color: var(--text-muted);
  font-size: 0.84rem;
  margin-top: 19px;
}
.target-meaning {
  font-size: 1.65rem;
  line-height: 1.5;
  margin-top: 15px;
}
.listen-big-btn {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 15px;
  margin: 23px auto 0;
  padding: 18px 25px;
  min-height: 44px;
  border: 0;
  border-radius: 26px;
  background: transparent;
  color: var(--primary-dark);
}
.sound-wave-icon {
  width: 80px;
  height: 80px;
  border-radius: 29px;
  background: linear-gradient(135deg, #dac3f5, #bb96e2);
  box-shadow: var(--shadow-orb);
  display: grid;
  place-items: center;
}
.listen-big-btn > span {
  font-size: 0.77rem;
}
.options-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.quiz-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 94px;
  padding: 18px;
  text-align: left;
  border: 1.5px solid #e0d4ec;
  border-radius: 23px;
  background: #f6f0fb;
  color: var(--text-main);
}
.quiz-option:not(:disabled):hover {
  background: #eee1fc;
  border-color: #b190d4;
}
.option-key {
  display: grid;
  place-items: center;
  width: 33px;
  height: 35px;
  flex-shrink: 0;
  font-size: 0.76rem;
  color: var(--text-muted);
  background: #e9e0f1;
  border-radius: 13px;
  box-shadow:
    inset 2px 2px 3px #d6c9e4,
    inset -2px -2px 3px #fff;
}
.option-content {
  flex: 1;
  min-width: 0;
}
.option-title {
  font-family: var(--font-family);
  font-size: 0.85rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.option-sub {
  display: block;
  margin-top: 5px;
  font-size: 0.67rem;
  color: var(--text-muted);
}
.option-feedback {
  display: grid;
  place-items: center;
}
.quiz-option:disabled {
  opacity: 1;
  cursor: default;
}
.quiz-option.correct {
  background: var(--success-bg);
  border-color: var(--success-border);
  color: var(--success);
}
.quiz-option.wrong {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger);
}
.quiz-option.correct .option-key {
  color: var(--success);
  background: #c8e7d5;
  box-shadow: none;
}
.quiz-option.wrong .option-key {
  color: var(--danger);
  background: #f4d3df;
  box-shadow: none;
}
.answer-feedback {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 19px;
  padding: 20px;
  background: #eee7f5;
  border-radius: 24px;
}
.feedback-text {
  flex: 1;
  min-width: 0;
}
.feedback-tag {
  font-size: 0.83rem;
  font-weight: 800;
  margin-bottom: 6px;
}
.tag-correct {
  color: var(--success);
}
.tag-wrong {
  color: var(--danger);
}
.correct-detail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 10px;
  font-size: 0.76rem;
  color: var(--text-muted);
}
.correct-detail > strong {
  color: var(--text-main);
}
.next-question-btn {
  white-space: nowrap;
  font-size: 0.77rem;
}
.results-banner {
  text-align: center;
  padding-bottom: 26px;
  border-bottom: 1px solid var(--border-subtle);
}
.result-badge-icon {
  display: grid;
  place-items: center;
  width: 89px;
  height: 89px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #f9dfb8, #e8bd81);
  border-radius: 30px;
  box-shadow: var(--shadow-orb);
}
.result-title {
  font-size: 1.9rem;
}
.result-desc {
  color: var(--text-muted);
  font-size: 0.84rem;
  margin-top: 10px;
}
.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 13px;
  margin-top: 26px;
}
.res-stat-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 19px 8px;
  background: var(--bg-surface);
  border-radius: 23px;
  box-shadow: var(--shadow-pressed);
}
.res-stat-val {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 900;
}
.text-success {
  color: var(--success);
}
.text-primary {
  color: var(--primary-dark);
}
.text-accent {
  color: var(--accent);
}
.text-warning {
  color: var(--warning);
}
.res-stat-label {
  color: var(--text-muted);
  font-size: 0.66rem;
}
.wrong-review-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.wrong-title {
  font-size: 0.92rem;
  color: var(--danger);
}
.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 340px;
  overflow-y: auto;
}
.wrong-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 17px;
  border-radius: 22px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  gap: 12px;
}
.wrong-item-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.wrong-word {
  font-weight: 800;
  color: var(--danger);
}
.wrong-ipa,
.wrong-type {
  font-size: 0.72rem;
  color: var(--text-muted);
}
.wrong-item-right {
  font-size: 0.78rem;
  color: var(--text-muted);
  flex: 1;
  min-width: 130px;
}
.results-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}
.retry-wrong-btn {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 23px;
  border-radius: 20px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  color: var(--danger);
  font-size: 0.83rem;
}
@media (max-width: 600px) {
  .setup-card,
  .question-card,
  .results-card {
    padding: 24px 20px;
    gap: 22px;
  }
  .options-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .quiz-option {
    min-height: 78px;
    padding: 16px;
  }
  .result-stats {
    grid-template-columns: 1fr 1fr;
  }
  .answer-feedback {
    flex-direction: column;
    align-items: stretch;
    padding: 17px;
  }
  .next-question-btn {
    width: 100%;
  }
  .results-actions {
    flex-direction: column;
  }
  .target-word {
    font-size: 2rem;
  }
  .target-meaning {
    font-size: 1.35rem;
  }
  .meta-streak {
    font-size: 0.66rem;
  }
}
</style>
