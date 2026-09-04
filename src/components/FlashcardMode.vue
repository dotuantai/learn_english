<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { speakEnglish } from '../utils/speech'

const props = defineProps({
  words: {
    type: Array,
    required: true
  },
  masteredIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['toggle-mastered'])

// State
const currentIndex = ref(0)
const isFlipped = ref(false)
const filterMode = ref('all') // 'all' | 'learning' | 'mastered'
const isSpeaking = ref(false)
const isAutoPlaying = ref(false)
let autoPlayTimer = null

// Deck calculation based on filter
const activeDeck = ref([...props.words])

function updateDeck() {
  if (filterMode.value === 'mastered') {
    activeDeck.value = props.words.filter(w => props.masteredIds.includes(w.id))
  } else if (filterMode.value === 'learning') {
    activeDeck.value = props.words.filter(w => !props.masteredIds.includes(w.id))
  } else {
    activeDeck.value = [...props.words]
  }

  if (activeDeck.value.length === 0) {
    currentIndex.value = 0
  } else if (currentIndex.value >= activeDeck.value.length) {
    currentIndex.value = activeDeck.value.length - 1
  }
}

watch(() => props.masteredIds, () => {
  if (filterMode.value !== 'all') {
    updateDeck()
  }
}, { deep: true })

watch(filterMode, () => {
  isFlipped.value = false
  currentIndex.value = 0
  updateDeck()
})

const currentWord = computed(() => {
  if (activeDeck.value.length === 0) return null
  return activeDeck.value[currentIndex.value]
})

const isCurrentMastered = computed(() => {
  if (!currentWord.value) return false
  return props.masteredIds.includes(currentWord.value.id)
})

const progressPercent = computed(() => {
  if (activeDeck.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / activeDeck.value.length) * 100)
})

// Actions
function flipCard() {
  isFlipped.value = !isFlipped.value
}

function nextCard() {
  if (activeDeck.value.length <= 1) return
  isFlipped.value = false
  setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % activeDeck.value.length
  }, 120)
}

function prevCard() {
  if (activeDeck.value.length <= 1) return
  isFlipped.value = false
  setTimeout(() => {
    currentIndex.value = (currentIndex.value - 1 + activeDeck.value.length) % activeDeck.value.length
  }, 120)
}

function shuffleDeck() {
  isFlipped.value = false
  const shuffled = [...activeDeck.value]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  activeDeck.value = shuffled
  currentIndex.value = 0
}

function playAudio(e) {
  if (e) e.stopPropagation()
  if (!currentWord.value) return
  isSpeaking.value = true
  speakEnglish(currentWord.value.word)
  setTimeout(() => {
    isSpeaking.value = false
  }, 1200)
}

function toggleMastered(e) {
  if (e) e.stopPropagation()
  if (!currentWord.value) return
  emit('toggle-mastered', currentWord.value.id)
}

function toggleAutoPlay() {
  isAutoPlaying.value = !isAutoPlaying.value
  if (isAutoPlaying.value) {
    runAutoPlayStep()
  } else {
    clearInterval(autoPlayTimer)
  }
}

function runAutoPlayStep() {
  if (!isAutoPlaying.value) return
  playAudio()
  
  autoPlayTimer = setTimeout(() => {
    if (!isAutoPlaying.value) return
    isFlipped.value = true
    
    autoPlayTimer = setTimeout(() => {
      if (!isAutoPlaying.value) return
      nextCard()
      runAutoPlayStep()
    }, 2800)
  }, 1800)
}

// Touch swipe support on mobile
let touchStartX = 0
let touchEndX = 0

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX
  handleSwipeGesture()
}

function handleSwipeGesture() {
  const diff = touchEndX - touchStartX
  if (Math.abs(diff) > 50) {
    if (diff < 0) {
      // Swiped left -> next
      nextCard()
    } else {
      // Swiped right -> prev
      prevCard()
    }
  }
}

// Keyboard shortcuts
function handleKeydown(e) {
  if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return

  if (e.code === 'Space') {
    e.preventDefault()
    flipCard()
  } else if (e.code === 'ArrowRight') {
    e.preventDefault()
    nextCard()
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault()
    prevCard()
  } else if (e.key === 's' || e.key === 'S') {
    playAudio()
  } else if (e.key === 'm' || e.key === 'M') {
    toggleMastered()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (autoPlayTimer) clearTimeout(autoPlayTimer)
})
</script>

<template>
  <div class="flashcard-section animate-fade-in">
    <!-- Top Filter & Deck Actions -->
    <div class="top-controls">
      <div class="filter-pills">
        <button 
          class="pill-btn" 
          :class="{ active: filterMode === 'all' }"
          @click="filterMode = 'all'"
        >
          Tất cả ({{ words.length }})
        </button>
        <button 
          class="pill-btn" 
          :class="{ active: filterMode === 'learning' }"
          @click="filterMode = 'learning'"
        >
          Cần ôn ({{ words.length - masteredIds.length }})
        </button>
        <button 
          class="pill-btn" 
          :class="{ active: filterMode === 'mastered' }"
          @click="filterMode = 'mastered'"
        >
          Đã thuộc ({{ masteredIds.length }})
        </button>
      </div>

      <div class="deck-actions">
        <button 
          class="action-icon-btn" 
          title="Xáo trộn thẻ" 
          @click="shuffleDeck"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
            <line x1="4" y1="4" x2="9" y2="9"/>
          </svg>
          <span class="action-text">Xáo trộn</span>
        </button>

        <button 
          class="action-icon-btn" 
          :class="{ active: isAutoPlaying }"
          :title="isAutoPlaying ? 'Dừng tự động' : 'Tự động chạy'" 
          @click="toggleAutoPlay"
        >
          <svg v-if="!isAutoPlaying" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
          <span class="action-text">{{ isAutoPlaying ? 'Dừng' : 'Tự động' }}</span>
        </button>
      </div>
    </div>

    <!-- Empty deck notice -->
    <div v-if="!currentWord" class="empty-deck">
      <div class="empty-icon">🎉</div>
      <h3>Chưa có thẻ nào trong mục này!</h3>
      <p v-if="filterMode === 'mastered'">Bạn chưa đánh dấu từ nào là đã thuộc.</p>
      <p v-else>Tuyệt vời! Bạn đã thuộc hết từ vựng trong danh sách!</p>
      <button class="primary-btn" @click="filterMode = 'all'">Xem tất cả 52 từ</button>
    </div>

    <!-- Active Flashcard View -->
    <div v-else class="card-wrapper">
      <!-- Progress Bar & Indicator -->
      <div class="card-meta">
        <span class="card-counter">Thẻ {{ currentIndex + 1 }} / {{ activeDeck.length }}</span>
        <div class="card-progress">
          <div class="card-progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <span class="card-percent">{{ progressPercent }}%</span>
      </div>

      <!-- 3D Perspective Flashcard Container -->
      <div 
        id="flashcard-element"
        class="flashcard" 
        :class="{ flipped: isFlipped }"
        @click="flipCard"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
      >
        <div class="card-inner">
          <!-- FRONT FACE (English) -->
          <div class="card-face card-front">
            <div class="card-header">
              <span class="pos-badge">{{ currentWord.type }}</span>
              <button 
                class="mastered-badge" 
                :class="{ active: isCurrentMastered }" 
                :title="isCurrentMastered ? 'Bỏ đánh dấu đã thuộc' : 'Đánh dấu đã thuộc'"
                @click="toggleMastered"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>{{ isCurrentMastered ? 'Đã thuộc' : 'Thuộc từ này?' }}</span>
              </button>
            </div>

            <div class="card-body">
              <h2 class="word-text">{{ currentWord.word }}</h2>
              <div class="ipa-container">
                <span class="ipa-text">{{ currentWord.ipa }}</span>
                <button 
                  class="audio-btn" 
                  :class="{ speaking: isSpeaking }"
                  title="Nghe phát âm" 
                  @click="playAudio"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="card-footer">
              <span class="flip-hint">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                Chạm để lật xem nghĩa tiếng Việt
              </span>
            </div>
          </div>

          <!-- BACK FACE (Vietnamese) -->
          <div class="card-face card-back">
            <div class="card-header">
              <span class="back-tag">Nghĩa tiếng Việt</span>
              <button 
                class="mastered-badge" 
                :class="{ active: isCurrentMastered }" 
                @click="toggleMastered"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>{{ isCurrentMastered ? 'Đã thuộc' : 'Thuộc từ này?' }}</span>
              </button>
            </div>

            <div class="card-body">
              <div class="word-original">{{ currentWord.word }}</div>
              <h2 class="meaning-text">{{ currentWord.meaning }}</h2>
              <div class="word-type-sub">{{ currentWord.type }} • {{ currentWord.ipa }}</div>
            </div>

            <div class="card-footer">
              <span class="flip-hint">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                Chạm lại để xem từ tiếng Anh
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation & Control Bar -->
      <div class="nav-controls">
        <button 
          id="btn-prev-card"
          class="nav-btn prev-btn" 
          title="Thẻ trước [←]"
          @click="prevCard"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Trước</span>
        </button>

        <button 
          id="btn-flip-card"
          class="nav-btn flip-btn" 
          title="Lật thẻ [Space]"
          @click="flipCard"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          <span>Lật thẻ</span>
        </button>

        <button 
          id="btn-next-card"
          class="nav-btn next-btn" 
          title="Thẻ tiếp theo [→]"
          @click="nextCard"
        >
          <span>Tiếp</span>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Swipe & Keyboard Hints -->
      <div class="hints-row">
        <span class="mobile-hint">💡 Vuốt sang trái/phải trên màn hình để chuyển từ</span>
        <div class="desktop-shortcuts">
          <span><kbd>Space</kbd> Lật thẻ</span>
          <span><kbd>←</kbd> <kbd>→</kbd> Chuyển từ</span>
          <span><kbd>S</kbd> Phát âm</span>
          <span><kbd>M</kbd> Thuộc</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flashcard-section {
  max-width: 680px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-pills {
  display: flex;
  gap: 4px;
  background: #ffffff;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-xs);
}

.pill-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-btn:hover {
  color: var(--text-main);
  background: var(--bg-surface);
}

.pill-btn.active {
  background: var(--primary-bg);
  color: var(--primary-dark);
  font-weight: 700;
}

.deck-actions {
  display: flex;
  gap: 8px;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s;
}

.action-icon-btn:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.action-icon-btn.active {
  background: var(--accent-bg);
  border-color: #bae6fd;
  color: var(--accent);
}

.card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.84rem;
  color: var(--text-muted);
  padding: 0 4px;
}

.card-counter {
  font-weight: 700;
  color: var(--text-main);
  min-width: 85px;
}

.card-progress {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.card-progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  border-radius: 3px;
  transition: width 0.25s ease;
}

.card-percent {
  font-weight: 700;
  min-width: 36px;
  text-align: right;
  color: var(--primary);
}

/* 3D Flashcard Structure */
.flashcard {
  perspective: 1200px;
  min-height: 360px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  border-radius: var(--radius-xl);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flashcard.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-xl);
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-subtle);
  user-select: none;
}

.card-front {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.card-back {
  background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%);
  border: 1px solid #bbf7d0;
  transform: rotateY(180deg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pos-badge {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--primary-bg);
  color: var(--primary-dark);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.back-tag {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--secondary-bg);
  color: var(--secondary);
  border: 1px solid rgba(79, 70, 229, 0.2);
}

.mastered-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.mastered-badge:hover {
  background: #f1f5f9;
  color: var(--text-main);
}

.mastered-badge.active {
  background: var(--warning-bg);
  border-color: #fde68a;
  color: var(--warning);
}

.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px 8px;
  gap: 14px;
}

.word-text {
  font-size: clamp(1.8rem, 5vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
  line-height: 1.2;
}

.ipa-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ipa-text {
  font-size: 1.15rem;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.audio-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--primary-bg);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.audio-btn:hover {
  transform: scale(1.08);
  background: rgba(16, 185, 129, 0.2);
}

.audio-btn.speaking {
  animation: pulseGlow 0.6s infinite alternate;
}

.word-original {
  font-size: 1.05rem;
  color: var(--text-dim);
  font-weight: 600;
}

.meaning-text {
  font-size: clamp(1.6rem, 4.5vw, 2.2rem);
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
}

.word-type-sub {
  font-size: 0.9rem;
  color: var(--primary-dark);
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: center;
}

.flip-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-dim);
}

/* Nav Controls */
.nav-controls {
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr;
  gap: 10px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 18px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.18s ease;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  color: var(--text-main);
  box-shadow: var(--shadow-xs);
}

.nav-btn:hover {
  background: var(--bg-surface);
  border-color: var(--border-medium);
  transform: translateY(-1px);
}

.flip-btn {
  background: var(--accent-gradient);
  border: none;
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(5, 150, 105, 0.25);
}

.flip-btn:hover {
  opacity: 0.95;
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
  transform: translateY(-2px);
}

.hints-row {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.78rem;
  color: var(--text-dim);
  text-align: center;
  margin-top: 4px;
}

.desktop-shortcuts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.mobile-hint {
  display: none;
}

kbd {
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.empty-deck {
  text-align: center;
  padding: 48px 20px;
  background: #ffffff;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 2.8rem;
  margin-bottom: 12px;
}

.empty-deck h3 {
  font-size: 1.25rem;
  margin-bottom: 6px;
  color: var(--text-main);
}

.empty-deck p {
  color: var(--text-muted);
  margin-bottom: 18px;
}

.primary-btn {
  padding: 10px 20px;
  background: var(--accent-gradient);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 600px) {
  .flashcard-section {
    padding: 12px;
    gap: 12px;
  }

  .top-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-pills {
    justify-content: space-between;
  }

  .pill-btn {
    padding: 6px 8px;
    font-size: 0.76rem;
    flex: 1;
    text-align: center;
  }

  .deck-actions {
    justify-content: stretch;
  }

  .action-icon-btn {
    flex: 1;
    justify-content: center;
  }

  .flashcard {
    min-height: 310px;
  }

  .card-inner {
    min-height: 310px;
  }

  .card-face {
    padding: 20px 16px;
  }

  .word-text {
    font-size: 1.7rem;
  }

  .meaning-text {
    font-size: 1.4rem;
  }

  .desktop-shortcuts {
    display: none;
  }

  .mobile-hint {
    display: inline-block;
  }

  .nav-controls {
    grid-template-columns: 1fr 1.3fr 1fr;
    gap: 8px;
  }

  .nav-btn {
    padding: 12px 10px;
    font-size: 0.88rem;
  }
}
</style>
