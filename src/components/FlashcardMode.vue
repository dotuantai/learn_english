<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import FlashcardDirection from './FlashcardDirection.vue'
import { speakEnglish } from '../utils/speech'
import {
  isFlashcardAnswerCorrect,
  normalizeAnswer,
} from '../utils/flashcardAnswers'

const props = defineProps({
  words: { type: Array, required: true },
  masteredIds: { type: Array, default: () => [] },
  initialDirection: { type: String, default: 'en_vi' },
})
const emit = defineEmits([
  'toggle-mastered',
  'back-to-lessons',
  'change-direction',
])

const studyDirection = ref(props.initialDirection === 'vi_en' ? 'vi_en' : 'en_vi')
const isReverse = computed(() => studyDirection.value === 'vi_en')
const answerLabel = computed(() =>
  isReverse.value ? 'Nhập từ tiếng Anh' : 'Nhập nghĩa tiếng Việt',
)
const answerLanguage = computed(() =>
  isReverse.value ? 'từ tiếng Anh' : 'nghĩa tiếng Việt',
)
const filterMode = ref('all')
const isShuffleEnabled = ref(false)
const cards = ref([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const answer = ref('')
const answerState = ref('idle')
const correctCount = ref(0)
const checkedCount = ref(0)
const initialCardCount = ref(0)
const answerInput = ref(null)
const isSpeaking = ref(false)
let autoAdvanceTimer
let speakingTimer

const masteredCount = computed(
  () =>
    props.words.filter((word) => props.masteredIds.includes(word.id)).length,
)

const sourceDeck = computed(() => {
  if (filterMode.value === 'mastered')
    return props.words.filter((word) => props.masteredIds.includes(word.id))
  if (filterMode.value === 'learning')
    return props.words.filter((word) => !props.masteredIds.includes(word.id))
  return props.words
})
const currentWord = computed(() => cards.value[currentIndex.value] ?? null)
const isFinished = computed(
  () => cards.value.length > 0 && currentIndex.value >= cards.value.length,
)
const incorrectCount = computed(() => checkedCount.value - correctCount.value)
const accuracy = computed(() =>
  checkedCount.value === 0
    ? 0
    : Math.round((correctCount.value / checkedCount.value) * 100),
)
const progressPercent = computed(() => {
  if (isFinished.value) return 100
  return cards.value.length === 0
    ? 0
    : Math.round((currentIndex.value / cards.value.length) * 100)
})
const normalizedAnswer = computed(() =>
  normalizeAnswer(answer.value, studyDirection.value),
)
const isCurrentMastered = computed(() =>
  currentWord.value ? props.masteredIds.includes(currentWord.value.id) : false,
)

function resetAnswer() {
  clearTimeout(autoAdvanceTimer)
  isFlipped.value = false
  answer.value = ''
  answerState.value = 'idle'
  void nextTick(() => answerInput.value?.focus({ preventScroll: true }))
}

function startSession() {
  const nextCards = sourceDeck.value.map((word) => ({
    ...word,
    isReview: false,
    isCompleted: false,
  }))
  if (isShuffleEnabled.value) {
    for (let index = nextCards.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[nextCards[index], nextCards[randomIndex]] = [
        nextCards[randomIndex],
        nextCards[index],
      ]
    }
  }
  cards.value = nextCards
  initialCardCount.value = nextCards.length
  currentIndex.value = 0
  correctCount.value = 0
  checkedCount.value = 0
  resetAnswer()
}

function changeFilter(mode) {
  if (filterMode.value !== mode) filterMode.value = mode
}

function toggleShuffle() {
  isShuffleEnabled.value = !isShuffleEnabled.value
  startSession()
}

function flipCard() {
  if (currentWord.value) isFlipped.value = !isFlipped.value
}

function scheduleReview(card) {
  const reviewCard = { ...card, isReview: true, isCompleted: false }
  cards.value.splice(
    Math.min(currentIndex.value + 3, cards.value.length),
    0,
    reviewCard,
  )
}

function checkAnswer() {
  if (
    !currentWord.value ||
    !normalizedAnswer.value ||
    answerState.value !== 'idle'
  )
    return
  const isCorrect = isFlashcardAnswerCorrect(
    answer.value,
    currentWord.value,
    studyDirection.value,
  )
  if (isCorrect) {
    answerState.value = 'correct'
    if (!currentWord.value.isReview && !currentWord.value.isCompleted) {
      checkedCount.value += 1
      correctCount.value += 1
    }
    autoAdvanceTimer = setTimeout(nextCard, 650)
  } else {
    answerState.value = 'incorrect'
    isFlipped.value = true
    if (!currentWord.value.isReview && !currentWord.value.isCompleted)
      checkedCount.value += 1
    if (!currentWord.value.isCompleted) scheduleReview(currentWord.value)
  }
  currentWord.value.isCompleted = true
}

function goToCard(index) {
  currentIndex.value = Math.max(0, Math.min(index, cards.value.length))
  resetAnswer()
}

function nextCard() {
  if (currentWord.value && answerState.value !== 'idle')
    goToCard(currentIndex.value + 1)
}

function previousCard() {
  if (currentIndex.value > 0) goToCard(currentIndex.value - 1)
}

function playAudio(event) {
  event?.stopPropagation()
  if (!currentWord.value) return
  clearTimeout(speakingTimer)
  isSpeaking.value = true
  speakEnglish(currentWord.value.word.replace(' / ', ', '))
  speakingTimer = setTimeout(() => {
    isSpeaking.value = false
  }, 1200)
}

function toggleMastered(event) {
  event?.stopPropagation()
  if (currentWord.value) emit('toggle-mastered', currentWord.value.id)
}

function handleKeydown(event) {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.target.isContentEditable ||
    ['input', 'textarea', 'button', 'select', 'a'].includes(
      event.target.tagName.toLowerCase(),
    )
  )
    return
  if (event.code === 'Space') {
    event.preventDefault()
    flipCard()
  } else if (event.code === 'ArrowRight' && answerState.value !== 'idle')
    nextCard()
  else if (event.code === 'ArrowLeft') previousCard()
  else if (event.key.toLowerCase() === 's') playAudio()
  else if (event.key.toLowerCase() === 'm') toggleMastered()
}

watch(filterMode, startSession)
watch(studyDirection, (direction) => {
  window.speechSynthesis?.cancel()
  clearTimeout(speakingTimer)
  isSpeaking.value = false
  startSession()
  emit('change-direction', direction)
})
watch(() => props.words, startSession, { deep: true })
onMounted(() => {
  startSession()
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  clearTimeout(autoAdvanceTimer)
  clearTimeout(speakingTimer)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="flashcard-section animate-fade-in">
    <FlashcardDirection v-model="studyDirection" session-control />
    <div class="top-controls">
      <div class="filter-pills" aria-label="Lọc bộ thẻ">
        <button
          class="pill-btn"
          :class="{ active: filterMode === 'all' }"
          :aria-pressed="filterMode === 'all'"
          @click="changeFilter('all')"
        >
          Tất cả ({{ words.length }})
        </button>
        <button
          class="pill-btn"
          :class="{ active: filterMode === 'learning' }"
          :aria-pressed="filterMode === 'learning'"
          @click="changeFilter('learning')"
        >
          Cần ôn ({{ words.length - masteredCount }})
        </button>
        <button
          class="pill-btn"
          :class="{ active: filterMode === 'mastered' }"
          :aria-pressed="filterMode === 'mastered'"
          @click="changeFilter('mastered')"
        >
          Đã thuộc ({{ masteredCount }})
        </button>
      </div>
      <button
        class="shuffle-btn"
        :class="{ active: isShuffleEnabled }"
        :aria-pressed="isShuffleEnabled"
        @click="toggleShuffle"
      >
        <AppIcon name="shuffle" :size="17" />
        {{ isShuffleEnabled ? 'Đang xáo trộn' : 'Xáo trộn' }}
      </button>
    </div>

    <div v-if="cards.length === 0" class="empty-deck">
      <div class="empty-icon"><AppIcon name="book" :size="40" /></div>
      <h2>Chưa có thẻ trong mục này</h2>
      <p>
        {{
          filterMode === 'mastered'
            ? 'Bạn chưa đánh dấu từ nào là đã thuộc.'
            : 'Bạn đã thuộc tất cả từ trong danh sách.'
        }}
      </p>
      <button class="primary-btn" @click="changeFilter('all')">
        Xem tất cả từ
      </button>
    </div>

    <div v-else-if="isFinished" class="result-box">
      <div class="result-icon"><AppIcon name="trophy" :size="44" /></div>
      <h2>Hoàn thành!</h2>
      <p>
        Bạn đã học xong {{ initialCardCount }} từ và ôn lại các câu trả lời sai.
      </p>
      <div class="result-stats">
        <div>
          <strong>{{ correctCount }}</strong
          ><span>Đúng lần đầu</span>
        </div>
        <div>
          <strong>{{ incorrectCount }}</strong
          ><span>Sai lần đầu</span>
        </div>
        <div>
          <strong>{{ accuracy }}%</strong><span>Chính xác</span>
        </div>
      </div>
      <div class="result-actions">
        <button class="primary-btn" @click="startSession">Học lại</button
        ><button class="btn btn-secondary" @click="$emit('back-to-lessons')">
          Chọn bài học tiếp theo<AppIcon name="arrow" :size="18" />
        </button>
      </div>
    </div>

    <div v-else class="study-area">
      <div class="card-meta">
        <span>Thẻ {{ currentIndex + 1 }} / {{ cards.length }}</span>
        <div class="card-progress">
          <div
            class="card-progress-fill"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <span>Đúng {{ correctCount }}/{{ checkedCount }}</span>
      </div>

      <div class="instruction">
        <span class="instruction-icon"
          ><AppIcon name="sparkles" :size="22"
        /></span>
        <div>
          <h2>{{ isReverse ? 'Tiếng Anh của nghĩa này là gì?' : 'Từ này có nghĩa là gì?' }}</h2>
          <p>
            {{ isReverse
              ? 'Nhớ và gõ từ hoặc cụm từ tiếng Anh tương ứng.'
              : 'Nhập một nghĩa tiếng Việt phù hợp.' }}
          </p>
        </div>
      </div>

      <button
        class="flashcard"
        :class="{ flipped: isFlipped }"
        :aria-label="
          isFlipped ? `Ẩn ${answerLanguage}` : `Lật thẻ để xem ${answerLanguage}`
        "
        :aria-pressed="isFlipped"
        type="button"
        @click="flipCard"
      >
        <span class="card-inner">
          <span class="card-face card-front" :aria-hidden="isFlipped">
            <span class="card-header"
              ><span class="pos-badge">{{ currentWord.type }}</span
              ><span class="face-label">{{ isReverse ? 'TIẾNG VIỆT' : 'ENGLISH' }}</span></span
            >
            <span class="answer-content">
              <strong
                :class="isReverse ? 'meaning-text' : 'word-text'"
                :lang="isReverse ? 'vi' : 'en'"
              >{{ isReverse ? currentWord.meaning : currentWord.word }}</strong>
              <span v-if="!isReverse" class="ipa-row"
                ><span>{{ currentWord.ipa }}</span
                ><span
                  class="audio-btn"
                  :class="{ speaking: isSpeaking }"
                  aria-hidden="true"
                  ><AppIcon name="sound" :size="20" /></span
              ></span>
            </span>
            <span class="flip-hint">Chạm để xem đáp án</span>
          </span>
          <span class="card-face card-back" :aria-hidden="!isFlipped">
            <span class="card-header"
              ><span class="pos-badge">{{ currentWord.type }}</span
              ><span class="face-label">{{ isReverse ? 'ENGLISH' : 'TIẾNG VIỆT' }}</span></span
            >
            <span class="answer-content">
              <strong
                :class="isReverse ? 'word-text' : 'meaning-text'"
                :lang="isReverse ? 'en' : 'vi'"
              >{{ isReverse ? currentWord.word : currentWord.meaning }}</strong>
              <span v-if="isReverse" class="ipa-row">{{ currentWord.ipa }}</span>
            </span>
            <span class="flip-hint">Chạm để quay lại</span>
          </span>
        </span>
      </button>

      <form class="answer-form" @submit.prevent="checkAnswer">
        <label for="flashcard-answer">{{ answerLabel }}</label>
        <div class="answer-row">
          <input
            id="flashcard-answer"
            ref="answerInput"
            v-model="answer"
            type="text"
            inputmode="text"
            enterkeyhint="next"
            autocomplete="off"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
            :lang="isReverse ? 'en' : 'vi'"
            :placeholder="isReverse ? 'Gõ đáp án tiếng Anh…' : 'Ví dụ: cẩn thận'"
            aria-describedby="flashcard-feedback"
            :aria-invalid="answerState === 'incorrect'"
            :readonly="answerState !== 'idle'"
            :class="{
              'input-correct': answerState === 'correct',
              'input-incorrect': answerState === 'incorrect',
            }"
          />
          <button
            v-if="answerState === 'idle'"
            class="check-btn"
            type="submit"
            :disabled="!normalizedAnswer"
          >
            Kiểm tra
          </button>
          <button
            v-else-if="answerState === 'incorrect'"
            class="next-btn"
            type="button"
            @click="nextCard"
          >
            {{
              currentIndex >= cards.length - 1 ? 'Xem kết quả' : 'Tiếp theo →'
            }}
          </button>
          <span v-else class="auto-status">Đang chuyển…</span>
        </div>
        <div id="flashcard-feedback" class="feedback" aria-live="polite">
          <p v-if="answerState === 'correct'" class="feedback-correct">
            <span>✓</span> Chính xác!
          </p>
          <p v-else-if="answerState === 'incorrect'" class="feedback-incorrect">
            <span>×</span> Chưa đúng. {{ isReverse ? 'Từ tiếng Anh là' : 'Nghĩa của từ là' }}
            <strong>{{ isReverse ? currentWord.word : currentWord.meaning }}</strong
            >.
          </p>
          <p v-else>Nhấn Enter hoặc nút “Kiểm tra” để trả lời.</p>
        </div>
      </form>

      <div class="card-actions">
        <button
          type="button"
          class="mastered-btn"
          :class="{ active: isCurrentMastered }"
          :aria-pressed="isCurrentMastered"
          @click="toggleMastered"
        >
          <AppIcon name="star" :size="18" />
          {{ isCurrentMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc' }}
        </button>
        <button type="button" class="listen-btn" @click="playAudio">
          <AppIcon name="sound" :size="18" /> Nghe phát âm
        </button>
      </div>
      <nav class="navigation" aria-label="Điều hướng flashcard">
        <button
          type="button"
          :disabled="currentIndex === 0"
          @click="previousCard"
        >
          ← Thẻ trước
        </button>
        <button
          type="button"
          class="nav-primary"
          :disabled="answerState === 'idle'"
          @click="nextCard"
        >
          {{ currentIndex >= cards.length - 1 ? 'Xem kết quả' : 'Thẻ sau →' }}
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.flashcard-section {
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
}
.top-controls,
.card-meta,
.card-header,
.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.top-controls {
  margin-bottom: 26px;
}
.filter-pills {
  display: flex;
  gap: 5px;
  padding: 5px;
  border-radius: 23px;
  background: var(--bg-surface);
  box-shadow: var(--shadow-pressed);
}
.pill-btn,
.shuffle-btn,
.mastered-btn,
.listen-btn,
.navigation button {
  min-height: 44px;
  border: 0;
  border-radius: 20px;
  background: var(--card-gradient);
  color: var(--text-muted);
  font-size: 0.76rem;
}
.pill-btn {
  padding: 9px 15px;
  background: transparent;
}
.pill-btn.active {
  color: var(--primary-dark);
  background: #faf6ff;
  box-shadow: var(--shadow-card);
}
.shuffle-btn {
  padding: 10px 15px;
  display: inline-flex;
  gap: 7px;
  align-items: center;
  box-shadow: var(--shadow-card);
}
.shuffle-btn.active {
  color: var(--primary-dark);
  background: var(--primary-bg);
}
.study-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card-meta {
  color: var(--text-muted);
  font-size: 0.74rem;
  font-weight: 700;
}
.card-meta > span {
  white-space: nowrap;
}
.card-progress {
  flex: 1;
  height: 7px;
  border-radius: 20px;
  overflow: hidden;
  background: #e6ddec;
  box-shadow: inset 1px 2px 4px #b6a7c630;
}
.card-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--accent-gradient);
  transition: width 0.25s;
}
.instruction {
  text-align: center;
  margin: 5px 0;
}
.instruction-icon {
  display: none;
}
.instruction h2 {
  font-size: 1.55rem;
  letter-spacing: -0.03em;
}
.instruction p {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.8rem;
}
.flashcard {
  min-height: 295px;
  padding: 0;
  border: 0;
  background: transparent;
  perspective: 1200px;
  border-radius: 36px;
}
.flashcard:not(:disabled):hover {
  transform: translateY(-4px);
}
.flashcard:not(:disabled):active {
  transform: scale(0.99);
}
.card-inner {
  position: relative;
  display: block;
  width: 100%;
  min-height: 295px;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.flashcard.flipped .card-inner {
  transform: rotateY(180deg);
}
.card-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 27px 32px;
  border: 1px solid #ffffffab;
  border-radius: 36px;
  backface-visibility: hidden;
  box-shadow: var(--shadow-card);
}
.card-front {
  background: linear-gradient(130deg, #fffcff, #f2eafa);
}
.card-back {
  background: linear-gradient(135deg, #fcfffd, #e4f2e9);
  transform: rotateY(180deg);
}
.card-header {
  width: 100%;
}
.pos-badge,
.face-label {
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.09em;
}
.pos-badge {
  color: var(--primary-dark);
  background: var(--primary-bg);
}
.face-label {
  color: var(--text-muted);
  background: #ffffff90;
}
.meaning-text,
.word-text {
  align-self: center;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  line-height: 1.3;
  text-align: center;
  overflow-wrap: anywhere;
}
.answer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.ipa-row {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--primary-dark);
  font-size: 1rem;
  font-weight: 600;
}
.audio-btn {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 50%;
  background: var(--primary-bg);
}
.audio-btn.speaking {
  animation: pulseGlow 0.6s infinite alternate;
}
.flip-hint {
  color: var(--text-muted);
  font-size: 0.73rem;
  font-weight: 600;
}
.answer-form {
  padding: 23px;
  border: 1px solid #ffffffa0;
  border-radius: 28px;
  background: #faf7fdd9;
  box-shadow: var(--shadow-card);
}
.answer-form label {
  display: block;
  margin-bottom: 10px;
  font-size: 0.8rem;
  font-weight: 800;
}
.answer-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 13px;
}
.answer-row input {
  width: 100%;
  min-width: 0;
  height: 56px;
  padding: 0 19px;
  border: 1px solid transparent;
  border-radius: 20px;
  color: var(--text-main);
  background: var(--bg-surface);
  box-shadow: var(--shadow-pressed);
  font-size: 0.94rem;
  transition: 0.2s;
}
.answer-row input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}
.answer-row input:focus {
  border-color: var(--primary-light);
  background: #fefbff;
}
.answer-row input.input-correct {
  color: var(--success);
  border-color: var(--success-border);
  background: var(--success-bg);
}
.answer-row input.input-incorrect {
  color: var(--danger);
  border-color: var(--danger-border);
  background: var(--danger-bg);
}
.check-btn,
.next-btn {
  min-width: 120px;
  min-height: 56px;
  padding: 10px 20px;
  border: 0;
  border-radius: 20px;
  color: #fff;
  font-size: 0.85rem;
  background: var(--accent-gradient);
  box-shadow: var(--shadow-button);
}
.check-btn:active,
.next-btn:active {
  box-shadow: var(--shadow-pressed);
}
.auto-status {
  align-self: center;
  color: var(--success);
  font-size: 0.76rem;
  font-weight: 800;
}
.feedback {
  min-height: 23px;
  margin-top: 11px;
  color: var(--text-muted);
  font-size: 0.73rem;
}
.feedback-correct {
  color: var(--success);
}
.feedback-incorrect {
  color: var(--danger);
}
.feedback p > span {
  font-weight: 900;
  margin-right: 4px;
}
.card-actions {
  justify-content: center;
  gap: 17px;
}
.mastered-btn,
.listen-btn {
  padding: 11px 17px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-card);
}
.mastered-btn.active {
  color: var(--warning);
  background: var(--warning-bg);
}
.mastered-btn.active .app-icon {
  fill: #ecc47e;
}
.navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.navigation button {
  min-height: 49px;
  background: transparent;
  border: 1px solid var(--border-medium);
}
.navigation .nav-primary {
  color: var(--primary-dark);
  border-color: #d6bee9;
  background: var(--primary-bg);
}
.empty-deck,
.result-box {
  padding: 44px 30px;
  border: 1px solid #fff;
  border-radius: 36px;
  background: var(--card-gradient);
  box-shadow: var(--shadow-card);
  text-align: center;
}
.empty-icon,
.result-icon {
  display: grid;
  place-items: center;
  width: 85px;
  height: 85px;
  margin: 0 auto 24px;
  border-radius: 30px;
  background: linear-gradient(135deg, #ead9fc, #c9a7eb);
  box-shadow: var(--shadow-orb);
  color: var(--primary-dark);
}
.empty-deck h2,
.result-box h2 {
  font-size: 1.8rem;
}
.empty-deck p,
.result-box > p {
  margin: 12px 0 24px;
  color: var(--text-muted);
  font-size: 0.86rem;
}
.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 28px 0;
}
.result-stats div {
  display: flex;
  flex-direction: column;
  padding: 20px 8px;
  border-radius: 23px;
  background: var(--bg-surface);
  box-shadow: var(--shadow-pressed);
}
.result-stats strong {
  color: var(--primary-dark);
  font-size: 1.7rem;
}
.result-stats span {
  color: var(--text-muted);
  font-size: 0.72rem;
}
.primary-btn {
  min-height: 52px;
  padding: 12px 25px;
  border: 0;
  border-radius: 20px;
  color: #fff;
  background: var(--accent-gradient);
  box-shadow: var(--shadow-button);
}
.result-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}
@media (max-width: 600px) {
  .top-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 13px;
    margin-bottom: 22px;
  }
  .filter-pills {
    justify-content: space-between;
  }
  .pill-btn {
    padding: 9px;
    flex: 1;
    font-size: 0.7rem;
  }
  .shuffle-btn {
    align-self: flex-end;
  }
  .instruction h2 {
    font-size: 1.35rem;
  }
  .flashcard,
  .card-inner {
    min-height: 280px;
  }
  .card-face {
    padding: 24px 20px;
  }
  .answer-form {
    padding: 20px;
  }
  .answer-row {
    grid-template-columns: 1fr;
  }
  .check-btn,
  .next-btn {
    width: 100%;
  }
  .card-actions {
    gap: 10px;
    flex-wrap: wrap;
  }
  .mastered-btn,
  .listen-btn {
    font-size: 0.72rem;
    padding-inline: 13px;
  }
  .meaning-text {
    font-size: 1.65rem;
  }
  .result-stats {
    gap: 9px;
  }
  .result-stats span {
    font-size: 0.65rem;
  }
  .empty-deck,
  .result-box {
    padding: 35px 20px;
  }
}
</style>
