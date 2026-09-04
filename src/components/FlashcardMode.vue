<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { speakEnglish } from '../utils/speech'

const props = defineProps({
  words: { type: Array, required: true },
  masteredIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['toggle-mastered'])

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

const sourceDeck = computed(() => {
  if (filterMode.value === 'mastered') return props.words.filter((word) => props.masteredIds.includes(word.id))
  if (filterMode.value === 'learning') return props.words.filter((word) => !props.masteredIds.includes(word.id))
  return props.words
})
const currentWord = computed(() => cards.value[currentIndex.value] ?? null)
const isFinished = computed(() => cards.value.length > 0 && currentIndex.value >= cards.value.length)
const incorrectCount = computed(() => checkedCount.value - correctCount.value)
const accuracy = computed(() => checkedCount.value === 0 ? 0 : Math.round((correctCount.value / checkedCount.value) * 100))
const progressPercent = computed(() => {
  if (isFinished.value) return 100
  return cards.value.length === 0 ? 0 : Math.round((currentIndex.value / cards.value.length) * 100)
})
const normalizedAnswer = computed(() => normalizeText(answer.value))
const isCurrentMastered = computed(() => currentWord.value ? props.masteredIds.includes(currentWord.value.id) : false)

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[’‘]/g, "'")
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function acceptedMeanings(meaning) {
  const withoutNotes = meaning.replace(/\([^)]*\)/g, ' ')
  const alternatives = withoutNotes.split(/[,;/]+/).map(normalizeText).filter(Boolean)
  return new Set(alternatives)
}

function resetAnswer() {
  clearTimeout(autoAdvanceTimer)
  isFlipped.value = false
  answer.value = ''
  answerState.value = 'idle'
  void nextTick(() => answerInput.value?.focus())
}

function startSession() {
  const nextCards = sourceDeck.value.map((word) => ({ ...word, isReview: false, isCompleted: false }))
  if (isShuffleEnabled.value) {
    for (let index = nextCards.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[nextCards[index], nextCards[randomIndex]] = [nextCards[randomIndex], nextCards[index]]
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
  cards.value.splice(Math.min(currentIndex.value + 3, cards.value.length), 0, reviewCard)
}

function checkAnswer() {
  if (!currentWord.value || !normalizedAnswer.value || answerState.value !== 'idle') return
  const isCorrect = acceptedMeanings(currentWord.value.meaning).has(normalizedAnswer.value)
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
    if (!currentWord.value.isReview && !currentWord.value.isCompleted) checkedCount.value += 1
    if (!currentWord.value.isCompleted) scheduleReview(currentWord.value)
  }
  currentWord.value.isCompleted = true
}

function goToCard(index) {
  currentIndex.value = Math.max(0, Math.min(index, cards.value.length))
  resetAnswer()
}

function nextCard() {
  if (currentWord.value && answerState.value !== 'idle') goToCard(currentIndex.value + 1)
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
  speakingTimer = setTimeout(() => { isSpeaking.value = false }, 1200)
}

function toggleMastered(event) {
  event?.stopPropagation()
  if (currentWord.value) emit('toggle-mastered', currentWord.value.id)
}

function handleKeydown(event) {
  if (['input', 'textarea'].includes(event.target.tagName.toLowerCase())) return
  if (event.code === 'Space') {
    event.preventDefault()
    flipCard()
  } else if (event.code === 'ArrowRight' && answerState.value !== 'idle') nextCard()
  else if (event.code === 'ArrowLeft') previousCard()
  else if (event.key.toLowerCase() === 's') playAudio()
  else if (event.key.toLowerCase() === 'm') toggleMastered()
}

watch(filterMode, startSession)
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
    <div class="top-controls">
      <div class="filter-pills" aria-label="Lọc bộ thẻ">
        <button class="pill-btn" :class="{ active: filterMode === 'all' }" @click="changeFilter('all')">Tất cả ({{ words.length }})</button>
        <button class="pill-btn" :class="{ active: filterMode === 'learning' }" @click="changeFilter('learning')">Cần ôn ({{ words.length - masteredIds.length }})</button>
        <button class="pill-btn" :class="{ active: filterMode === 'mastered' }" @click="changeFilter('mastered')">Đã thuộc ({{ masteredIds.length }})</button>
      </div>
      <button class="shuffle-btn" :class="{ active: isShuffleEnabled }" @click="toggleShuffle"><span aria-hidden="true">↝</span> {{ isShuffleEnabled ? 'Đang xáo trộn' : 'Xáo trộn' }}</button>
    </div>

    <div v-if="cards.length === 0" class="empty-deck">
      <div class="empty-icon">🎉</div>
      <h2>Chưa có thẻ trong mục này</h2>
      <p>{{ filterMode === 'mastered' ? 'Bạn chưa đánh dấu từ nào là đã thuộc.' : 'Bạn đã thuộc tất cả từ trong danh sách.' }}</p>
      <button class="primary-btn" @click="changeFilter('all')">Xem tất cả từ</button>
    </div>

    <div v-else-if="isFinished" class="result-box">
      <div class="result-icon">{{ accuracy >= 80 ? '🏆' : accuracy >= 50 ? '🌟' : '💪' }}</div>
      <h2>Hoàn thành!</h2>
      <p>Bạn đã học xong {{ initialCardCount }} từ và ôn lại các câu trả lời sai.</p>
      <div class="result-stats">
        <div><strong>{{ correctCount }}</strong><span>Đúng lần đầu</span></div>
        <div><strong>{{ incorrectCount }}</strong><span>Sai lần đầu</span></div>
        <div><strong>{{ accuracy }}%</strong><span>Chính xác</span></div>
      </div>
      <button class="primary-btn" @click="startSession">Học lại</button>
    </div>

    <div v-else class="study-area">
      <div class="card-meta">
        <span>Thẻ {{ currentIndex + 1 }} / {{ cards.length }}</span>
        <div class="card-progress"><div class="card-progress-fill" :style="{ width: `${progressPercent}%` }"></div></div>
        <span>Đúng {{ correctCount }}/{{ checkedCount }}</span>
      </div>

      <div class="instruction">
        <span class="instruction-icon">✦</span>
        <div><h1>Từ này có nghĩa là gì?</h1><p>Nhập một nghĩa tiếng Việt phù hợp.</p></div>
      </div>

      <button class="flashcard" :class="{ flipped: isFlipped }" type="button" @click="flipCard">
        <span class="card-inner">
          <span class="card-face card-front">
            <span class="card-header"><span class="pos-badge">{{ currentWord.type }}</span><span class="face-label">ENGLISH</span></span>
            <span class="answer-content">
              <strong class="word-text">{{ currentWord.word }}</strong>
              <span class="ipa-row"><span>{{ currentWord.ipa }}</span><span class="audio-btn" :class="{ speaking: isSpeaking }" aria-hidden="true">🔊</span></span>
            </span>
            <span class="flip-hint">Chạm để xem đáp án</span>
          </span>
          <span class="card-face card-back">
            <span class="card-header"><span class="pos-badge">{{ currentWord.type }}</span><span class="face-label">TIẾNG VIỆT</span></span>
            <strong class="meaning-text">{{ currentWord.meaning }}</strong>
            <span class="flip-hint">Chạm để quay lại</span>
          </span>
        </span>
      </button>

      <form class="answer-form" @submit.prevent="checkAnswer">
        <label for="flashcard-answer">Nhập nghĩa tiếng Việt</label>
        <div class="answer-row">
          <input id="flashcard-answer" ref="answerInput" v-model="answer" type="text" inputmode="text" enterkeyhint="next" autocomplete="off" spellcheck="false" placeholder="Ví dụ: cẩn thận" :readonly="answerState !== 'idle'" :class="{ 'input-correct': answerState === 'correct', 'input-incorrect': answerState === 'incorrect' }" />
          <button v-if="answerState === 'idle'" class="check-btn" type="submit" :disabled="!normalizedAnswer">Kiểm tra</button>
          <button v-else-if="answerState === 'incorrect'" class="next-btn" type="button" @click="nextCard">{{ currentIndex >= cards.length - 1 ? 'Xem kết quả' : 'Tiếp theo →' }}</button>
          <span v-else class="auto-status">Đang chuyển…</span>
        </div>
        <div class="feedback" aria-live="polite">
          <p v-if="answerState === 'correct'" class="feedback-correct"><span>✓</span> Chính xác!</p>
          <p v-else-if="answerState === 'incorrect'" class="feedback-incorrect"><span>×</span> Chưa đúng. Nghĩa của từ là <strong>{{ currentWord.meaning }}</strong>.</p>
          <p v-else>Nhấn Enter hoặc nút “Kiểm tra” để trả lời.</p>
        </div>
      </form>

      <div class="card-actions">
        <button type="button" class="mastered-btn" :class="{ active: isCurrentMastered }" @click="toggleMastered">★ {{ isCurrentMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc' }}</button>
        <button type="button" class="listen-btn" @click="playAudio">🔊 Nghe phát âm</button>
      </div>
      <nav class="navigation" aria-label="Điều hướng flashcard">
        <button type="button" :disabled="currentIndex === 0" @click="previousCard">← Thẻ trước</button>
        <button type="button" class="nav-primary" :disabled="answerState === 'idle'" @click="nextCard">{{ currentIndex >= cards.length - 1 ? 'Xem kết quả' : 'Thẻ sau →' }}</button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.flashcard-section { width: 100%; max-width: 680px; margin: 0 auto; padding: 16px; }
.top-controls,.card-meta,.card-header,.card-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.top-controls { margin-bottom: 16px; }
.filter-pills { display: flex; gap: 4px; padding: 4px; border: 1px solid var(--border-subtle); border-radius: 12px; background: #fff; box-shadow: var(--shadow-xs); }
.pill-btn,.shuffle-btn,.mastered-btn,.listen-btn,.navigation button { border: 1px solid var(--border-subtle); border-radius: 10px; background: #fff; color: var(--text-muted); font-family: inherit; font-weight: 700; cursor: pointer; }
.pill-btn { padding: 7px 11px; border: 0; }
.pill-btn.active { color: var(--primary-dark); background: var(--primary-bg); }
.shuffle-btn { padding: 9px 12px; }
.shuffle-btn.active { color: var(--accent); background: var(--accent-bg); border-color: #bae6fd; }
.study-area { display: flex; flex-direction: column; gap: 14px; }
.card-meta { color: var(--text-muted); font-size: .82rem; font-weight: 700; }
.card-meta > span { white-space: nowrap; }
.card-progress { flex: 1; height: 7px; overflow: hidden; border-radius: 99px; background: #e2e8f0; }
.card-progress-fill { height: 100%; border-radius: inherit; background: var(--accent-gradient); transition: width .25s; }
.instruction { display: flex; align-items: center; gap: 12px; }
.instruction-icon { display: grid; width: 38px; height: 38px; flex: 0 0 auto; place-items: center; border-radius: 12px; color: var(--primary); background: var(--primary-bg); }
.instruction h1 { font-size: 1.15rem; }
.instruction p { color: var(--text-muted); font-size: .86rem; }
.flashcard { min-height: 310px; padding: 0; border: 0; outline: 0; background: transparent; font-family: inherit; cursor: pointer; perspective: 1200px; }
.flashcard:focus-visible .card-inner { outline: 3px solid rgb(16 185 129 / 30%); outline-offset: 4px; }
.card-inner { position: relative; display: block; width: 100%; min-height: 310px; transform-style: preserve-3d; transition: transform .55s cubic-bezier(.4,0,.2,1); }
.flashcard.flipped .card-inner { transform: rotateY(180deg); }
.card-face { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 26px; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); backface-visibility: hidden; box-shadow: var(--shadow-md); }
.card-front { background: linear-gradient(145deg,#fff,#f8fafc); }
.card-back { border-color: #bbf7d0; background: linear-gradient(145deg,#fff,#f0fdf4); transform: rotateY(180deg); }
.card-header { width: 100%; }
.pos-badge,.face-label { padding: 5px 11px; border-radius: 8px; font-size: .72rem; font-weight: 800; letter-spacing: .05em; }
.pos-badge { color: var(--primary-dark); background: var(--primary-bg); }
.face-label { color: var(--secondary); background: var(--secondary-bg); }
.meaning-text,.word-text { align-self: center; color: var(--text-main); font-size: clamp(1.7rem,5vw,2.45rem); line-height: 1.3; text-align: center; }
.answer-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.ipa-row { display: flex; align-items: center; gap: 9px; color: var(--accent); font-size: 1.05rem; font-weight: 700; }
.audio-btn { display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid #a7f3d0; border-radius: 50%; background: var(--primary-bg); }
.audio-btn.speaking { animation: pulseGlow .6s infinite alternate; }
.flip-hint { color: var(--text-dim); font-size: .8rem; font-weight: 600; }
.answer-form { padding: 16px; border: 1px solid var(--border-subtle); border-radius: 20px; background: #fff; box-shadow: var(--shadow-sm); }
.answer-form label { display: block; margin-bottom: 8px; color: var(--text-muted); font-size: .78rem; font-weight: 800; }
.answer-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 9px; }
.answer-row input { width: 100%; min-width: 0; height: 50px; padding: 0 14px; border: 2px solid #e2e8f0; border-radius: 14px; outline: none; color: var(--text-main); background: #fff; font: 800 1rem var(--font-family); transition: .2s; }
.answer-row input:focus { border-color: var(--primary-light); box-shadow: 0 0 0 4px var(--primary-glow); }
.answer-row input.input-correct { color: #047857; border-color: #10b981; background: #ecfdf5; }
.answer-row input.input-incorrect { color: #be123c; border-color: #f43f5e; background: #fff1f2; }
.check-btn,.next-btn { min-width: 112px; height: 50px; padding: 0 14px; border: 0; border-radius: 14px; color: #fff; font: 800 .86rem var(--font-family); cursor: pointer; }
.check-btn { background: var(--accent-gradient); box-shadow: 0 5px 14px rgb(5 150 105 / 25%); }
.check-btn:disabled { cursor: not-allowed; opacity: .4; box-shadow: none; }
.next-btn { background: linear-gradient(135deg,#059669,#10b981); }
.auto-status { align-self: center; color: var(--primary-dark); font-size: .76rem; font-weight: 800; }
.feedback { min-height: 22px; margin-top: 9px; color: #94a3b8; font-size: .76rem; font-weight: 700; }
.feedback-correct { color: #047857; }
.feedback-incorrect { color: #be123c; }
.feedback p span { display: inline-grid; width: 19px; height: 19px; margin-right: 4px; place-items: center; border-radius: 50%; color: #fff; background: currentColor; }
.card-actions { justify-content: center; }
.mastered-btn,.listen-btn { padding: 9px 13px; }
.mastered-btn.active { color: var(--warning); border-color: #fde68a; background: var(--warning-bg); }
.navigation { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.navigation button { min-height: 48px; }
.navigation button:disabled { cursor: not-allowed; opacity: .42; }
.navigation .nav-primary { color: #fff; border: 0; background: var(--accent-gradient); }
.empty-deck,.result-box { padding: 42px 22px; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); background: #fff; box-shadow: var(--shadow-sm); text-align: center; }
.empty-icon,.result-icon { margin-bottom: 10px; font-size: 3rem; }
.empty-deck p,.result-box > p { margin: 8px 0 20px; color: var(--text-muted); }
.result-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 22px 0; }
.result-stats div { display: flex; flex-direction: column; padding: 14px 8px; border-radius: 14px; background: var(--bg-surface); }
.result-stats strong { color: var(--primary-dark); font-size: 1.45rem; }
.result-stats span { color: var(--text-muted); font-size: .72rem; font-weight: 700; }
.primary-btn { padding: 11px 22px; border: 0; border-radius: 12px; color: #fff; background: var(--accent-gradient); font-weight: 800; cursor: pointer; }
@media (max-width: 600px) {
  .flashcard-section { padding: 12px; }
  .top-controls { align-items: stretch; flex-direction: column; }
  .filter-pills { justify-content: space-between; }
  .pill-btn { flex: 1; padding: 7px 5px; font-size: .72rem; }
  .shuffle-btn { align-self: flex-end; }
  .flashcard,.card-inner { min-height: 280px; }
  .card-face { padding: 20px 17px; }
  .answer-row { grid-template-columns: 1fr; }
  .check-btn,.next-btn { width: 100%; }
  .auto-status { min-height: 32px; }
  .meaning-text,.word-text { font-size: 1.55rem; }
  .result-stats { gap: 6px; }
}
</style>
