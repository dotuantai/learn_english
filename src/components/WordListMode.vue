<script setup>
import { ref, computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { speakEnglish } from '../utils/speech'

const props = defineProps({
  words: {
    type: Array,
    required: true,
  },
  lessons: {
    type: Array,
    default: () => [],
  },
  masteredIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['toggle-mastered'])

const searchQuery = ref('')
const selectedType = ref('all')
const selectedStatus = ref('all')
const selectedLesson = ref('all')

function resetFilters() {
  searchQuery.value = ''
  selectedType.value = 'all'
  selectedStatus.value = 'all'
  selectedLesson.value = 'all'
}

// Extract distinct types
const distinctTypes = computed(() => {
  const types = new Set()
  props.words.forEach((w) => types.add(w.type))
  return Array.from(types)
})

const lessonOptions = computed(() => {
  if (props.lessons && props.lessons.length > 0) {
    return props.lessons.map((lesson) => ({
      value: lesson.key || lesson.id,
      label: `Bài ${lesson.number}: ${lesson.title}`,
    }))
  }
  return [
    { value: 'bai1', label: 'Bài 1: Y tế & chăm sóc sức khỏe' },
    { value: 'bai2', label: 'Bài 2: Họ từ vựng Y tế & Sức khỏe' },
  ]
})

function getLessonBadge(word) {
  if (word.lessonKey === 'bai1' || word.id <= 52) {
    return { text: 'Bài 1', class: 'bai1' }
  }
  return { text: 'Bài 2', class: 'bai2' }
}

const filteredWords = computed(() => {
  return props.words.filter((word) => {
    // 1. Search Query
    const query = searchQuery.value.toLowerCase().trim()
    const matchesQuery =
      !query ||
      word.word.toLowerCase().includes(query) ||
      word.meaning.toLowerCase().includes(query) ||
      word.ipa.toLowerCase().includes(query)

    // 2. Type Filter
    const matchesType =
      selectedType.value === 'all' || word.type === selectedType.value

    // 3. Status Filter
    const isMastered = props.masteredIds.includes(word.id)
    const matchesStatus =
      selectedStatus.value === 'all' ||
      (selectedStatus.value === 'mastered' && isMastered) ||
      (selectedStatus.value === 'learning' && !isMastered)

    // 4. Lesson Filter
    const matchesLesson =
      selectedLesson.value === 'all' ||
      word.lessonKey === selectedLesson.value ||
      (selectedLesson.value === 'bai1' && (word.lessonKey === 'bai1' || word.id <= 52)) ||
      (selectedLesson.value === 'bai2' && (word.lessonKey === 'bai2' || word.id >= 53)) ||
      (selectedLesson.value === 'lesson-1' && (word.lessonKey === 'bai1' || word.id <= 52)) ||
      (selectedLesson.value === 'lesson-2' && (word.lessonKey === 'bai2' || word.id >= 53))

    return matchesQuery && matchesType && matchesStatus && matchesLesson
  })
})
</script>

<template>
  <div class="list-container animate-fade-in">
    <!-- Header & Search Controls -->
    <div class="list-controls-card">
      <div class="search-bar">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="search-icon"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <label for="search-words-input" class="sr-only">Tìm từ vựng</label>
        <input
          id="search-words-input"
          v-model="searchQuery"
          type="text"
          placeholder="Tìm từ tiếng Anh, phát âm hoặc nghĩa..."
        />
        <button
          v-if="searchQuery"
          class="clear-search-btn"
          aria-label="Xóa tìm kiếm"
          @click="searchQuery = ''"
        >
          <AppIcon name="close" :size="18" />
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <!-- Lesson Filter -->
        <div class="filter-group">
          <label for="filter-lesson-select">Bài học</label>
          <select
            id="filter-lesson-select"
            v-model="selectedLesson"
            class="select-box"
          >
            <option value="all">Tất cả bài học</option>
            <option
              v-for="l in lessonOptions"
              :key="l.value"
              :value="l.value"
            >
              {{ l.label }}
            </option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="filter-group">
          <label for="filter-type-select">Từ loại</label>
          <select
            id="filter-type-select"
            v-model="selectedType"
            class="select-box"
          >
            <option value="all">Tất cả từ loại</option>
            <option v-for="t in distinctTypes" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label for="filter-status-select">Trạng thái</label>
          <select
            id="filter-status-select"
            v-model="selectedStatus"
            class="select-box"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="learning">Cần ôn tập</option>
            <option value="mastered">Đã thuộc</option>
          </select>
        </div>

        <div class="result-count" aria-live="polite">
          <span
            >Tìm thấy <strong>{{ filteredWords.length }}</strong> /
            {{ words.length }} từ</span
          >
        </div>
      </div>
    </div>

    <!-- Word Grid -->
    <div v-if="filteredWords.length === 0" class="empty-search">
      <AppIcon name="search" :size="35" />
      <h2>Chưa tìm thấy từ phù hợp</h2>
      <p>Thử một từ khác hoặc bỏ bớt bộ lọc nhé.</p>
      <button
        class="btn btn-secondary"
        @click="resetFilters"
      >
        Xóa bộ lọc
      </button>
    </div>

    <div v-else class="words-grid">
      <div
        v-for="word in filteredWords"
        :key="word.id"
        class="word-item-card"
        :class="{ mastered: masteredIds.includes(word.id) }"
      >
        <div class="card-top">
          <div class="top-left">
            <span class="stt-badge">#{{ word.id }}</span>
            <span class="type-pill">{{ word.type }}</span>
            <span :class="['lesson-pill', getLessonBadge(word).class]">{{ getLessonBadge(word).text }}</span>
          </div>

          <button
            class="star-toggle"
            :class="{ active: masteredIds.includes(word.id) }"
            :aria-pressed="masteredIds.includes(word.id)"
            :aria-label="`${masteredIds.includes(word.id) ? 'Bỏ đánh dấu' : 'Đánh dấu đã thuộc'}: ${word.word}`"
            :title="
              masteredIds.includes(word.id)
                ? 'Đã thuộc (Nhấp để hủy)'
                : 'Đánh dấu đã thuộc'
            "
            @click="emit('toggle-mastered', word.id)"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              :fill="masteredIds.includes(word.id) ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="1.7"
              aria-hidden="true"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </button>
        </div>

        <div class="card-main">
          <h3 class="word-name">{{ word.word }}</h3>
          <div class="word-ipa-row">
            <span class="word-ipa">{{ word.ipa }}</span>
            <button
              class="audio-mini-btn"
              :aria-label="`Nghe phát âm: ${word.word}`"
              title="Phát âm"
              @click="speakEnglish(word.word)"
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
          <p class="word-meaning">{{ word.meaning }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-container {
  display: flex;
  flex-direction: column;
  gap: 27px;
}
.list-controls-card {
  background: #faf7ffcc;
  border: 1px solid #ffffffb3;
  border-radius: 30px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: var(--shadow-card);
}
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 20px;
  color: var(--text-muted);
}
.search-bar input {
  width: 100%;
  min-height: 58px;
  padding: 16px 55px 16px 50px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: var(--bg-surface);
  box-shadow: var(--shadow-pressed);
  color: var(--text-main);
  font-size: 0.86rem;
  transition: 0.2s;
}
.search-bar input::placeholder {
  color: var(--text-muted);
}
.search-bar input:focus {
  border-color: var(--primary-light);
  background: #fefaff;
}
.clear-search-btn {
  position: absolute;
  right: 8px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 20px;
  background: transparent;
  color: var(--text-muted);
}
.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.76rem;
  color: var(--text-muted);
}
.select-box {
  background: #f6f0fc;
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  min-height: 44px;
  padding: 10px 32px 10px 15px;
  border-radius: 20px;
  font-size: 0.76rem;
  cursor: pointer;
  max-width: 100%;
}
.result-count {
  font-size: 0.74rem;
  color: var(--text-muted);
}
.result-count strong {
  color: var(--primary-dark);
}
.words-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}
.word-item-card {
  background: var(--card-gradient);
  border: 1px solid #ffffffb3;
  border-radius: 28px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s;
}
.word-item-card:hover {
  box-shadow: var(--shadow-lg);
}
.word-item-card.mastered {
  background: linear-gradient(135deg, #fffcfa, #faf0df);
  border-color: #eddbb8;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stt-badge {
  font-size: 0.66rem;
  color: var(--text-muted);
  font-weight: 700;
}
.type-pill {
  font-size: 0.61rem;
  font-weight: 800;
  padding: 5px 10px;
  border-radius: 20px;
  background: var(--primary-bg);
  color: var(--primary-dark);
}
.lesson-pill {
  font-size: 0.61rem;
  font-weight: 800;
  padding: 5px 10px;
  border-radius: 20px;
  background: var(--bg-surface);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}
.lesson-pill.bai1 {
  background: #ede3fc;
  color: #7040ae;
  border-color: #e6d7fb;
}
.lesson-pill.bai2 {
  background: #e3f0fb;
  color: #286990;
  border-color: #d2e9fa;
}
.star-toggle {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: #eee6f5;
  border: 0;
  border-radius: 18px;
  color: var(--text-muted);
}
.star-toggle:hover {
  color: var(--warning);
  background: var(--warning-bg);
}
.star-toggle.active {
  color: var(--warning);
  background: #f8e4bc;
}
.card-main {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.word-name {
  font-size: 1.2rem;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}
.word-ipa-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.word-ipa {
  font-size: 0.82rem;
  color: var(--primary-dark);
  overflow-wrap: anywhere;
}
.audio-mini-btn {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: var(--primary-bg);
  color: var(--primary-dark);
  display: grid;
  place-items: center;
}
.audio-mini-btn:hover {
  background: #e1d0f6;
}
.word-meaning {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.7;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.empty-search {
  text-align: center;
  padding: 50px 24px;
  color: var(--text-muted);
  background: var(--card-gradient);
  border-radius: 32px;
  box-shadow: var(--shadow-card);
}
.empty-search > .app-icon {
  color: var(--primary);
  margin-bottom: 20px;
}
.empty-search h2 {
  color: var(--text-main);
  font-size: 1.3rem;
}
.empty-search p {
  margin: 10px 0 24px;
  font-size: 0.85rem;
}
@media (max-width: 1200px) {
  .words-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .list-controls-card {
    padding: 20px;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-group {
    justify-content: space-between;
  }
  .select-box {
    width: 68%;
  }
  .words-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .result-count {
    margin-top: 5px;
  }
  .search-bar input {
    font-size: 0.78rem;
  }
  .word-item-card {
    padding: 23px;
  }
}
</style>
