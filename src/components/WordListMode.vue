<script setup>
import { ref, computed } from 'vue'
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

const searchQuery = ref('')
const selectedType = ref('all')
const selectedStatus = ref('all')

// Extract distinct types
const distinctTypes = computed(() => {
  const types = new Set()
  props.words.forEach(w => types.add(w.type))
  return Array.from(types)
})

const filteredWords = computed(() => {
  return props.words.filter(word => {
    // 1. Search Query
    const query = searchQuery.value.toLowerCase().trim()
    const matchesQuery = !query || 
      word.word.toLowerCase().includes(query) ||
      word.meaning.toLowerCase().includes(query) ||
      word.ipa.toLowerCase().includes(query)

    // 2. Type Filter
    const matchesType = selectedType.value === 'all' || word.type === selectedType.value

    // 3. Status Filter
    const isMastered = props.masteredIds.includes(word.id)
    const matchesStatus = selectedStatus.value === 'all' || 
      (selectedStatus.value === 'mastered' && isMastered) ||
      (selectedStatus.value === 'learning' && !isMastered)

    return matchesQuery && matchesType && matchesStatus
  })
})
</script>

<template>
  <div class="list-container animate-fade-in">
    <!-- Header & Search Controls -->
    <div class="list-controls-card">
      <div class="search-bar">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          id="search-words-input"
          v-model="searchQuery" 
          type="text" 
          placeholder="Tìm từ tiếng Anh, phát âm hoặc nghĩa..." 
        />
        <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">✕</button>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <!-- Type Filter -->
        <div class="filter-group">
          <label>Từ loại:</label>
          <select id="filter-type-select" v-model="selectedType" class="select-box">
            <option value="all">Tất cả từ loại</option>
            <option v-for="t in distinctTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label>Trạng thái:</label>
          <select id="filter-status-select" v-model="selectedStatus" class="select-box">
            <option value="all">Tất cả trạng thái</option>
            <option value="learning">Cần ôn tập</option>
            <option value="mastered">Đã thuộc</option>
          </select>
        </div>

        <div class="result-count">
          <span>Tìm thấy <strong>{{ filteredWords.length }}</strong> / {{ words.length }} từ</span>
        </div>
      </div>
    </div>

    <!-- Word Grid -->
    <div v-if="filteredWords.length === 0" class="empty-search">
      <p>Không tìm thấy từ nào phù hợp với điều kiện tìm kiếm.</p>
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
          </div>

          <button 
            class="star-toggle"
            :class="{ active: masteredIds.includes(word.id) }"
            :title="masteredIds.includes(word.id) ? 'Đã thuộc (Nhấp để hủy)' : 'Đánh dấu đã thuộc'"
            @click="emit('toggle-mastered', word.id)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        </div>

        <div class="card-main">
          <h3 class="word-name">{{ word.word }}</h3>
          <div class="word-ipa-row">
            <span class="word-ipa">{{ word.ipa }}</span>
            <button 
              class="audio-mini-btn" 
              title="Phát âm" 
              @click="speakEnglish(word.word)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
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
  max-width: 1040px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-controls-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-sm);
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-dim);
}

.search-bar input {
  width: 100%;
  padding: 12px 38px 12px 42px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  font-family: inherit;
  font-size: 0.92rem;
  outline: none;
  transition: all 0.2s;
}

.search-bar input:focus {
  border-color: var(--primary);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 0.9rem;
  cursor: pointer;
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: var(--text-muted);
}

.select-box {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  padding: 7px 12px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.84rem;
  outline: none;
  cursor: pointer;
}

.result-count {
  font-size: 0.84rem;
  color: var(--text-dim);
}

.result-count strong {
  color: var(--primary);
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.word-item-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.18s ease;
  box-shadow: var(--shadow-xs);
}

.word-item-card:hover {
  transform: translateY(-2px);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: var(--shadow-sm);
}

.word-item-card.mastered {
  border-color: #fde68a;
  background: linear-gradient(145deg, #ffffff 0%, #fffbeb 100%);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stt-badge {
  font-size: 0.72rem;
  color: var(--text-dim);
  font-weight: 700;
}

.type-pill {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--primary-bg);
  color: var(--primary-dark);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.star-toggle {
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.star-toggle:hover {
  color: #f59e0b;
}

.star-toggle.active {
  color: #f59e0b;
}

.card-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.word-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
}

.word-ipa-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.word-ipa {
  font-size: 0.85rem;
  color: var(--accent);
  font-weight: 600;
}

.audio-mini-btn {
  background: var(--primary-bg);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: var(--primary);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.audio-mini-btn:hover {
  transform: scale(1.1);
  background: rgba(16, 185, 129, 0.2);
}

.word-meaning {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 2px;
}

.empty-search {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

@media (max-width: 600px) {
  .list-container {
    padding: 12px;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-group {
    justify-content: space-between;
  }
  .select-box {
    flex: 1;
    text-align: right;
  }
  .words-grid {
    grid-template-columns: 1fr;
  }
}
</style>
