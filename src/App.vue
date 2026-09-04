<script setup>
import { ref, onMounted, watch } from 'vue'
import wordsData from './data/words.json'
import Navbar from './components/Navbar.vue'
import FlashcardMode from './components/FlashcardMode.vue'
import QuizMode from './components/QuizMode.vue'
import WordListMode from './components/WordListMode.vue'

// Current active view: 'flashcard' | 'quiz' | 'list'
const currentMode = ref('flashcard')

// Mastered words array stored in localStorage
const masteredIds = ref([])

onMounted(() => {
  try {
    const saved = localStorage.getItem('medivocab_mastered')
    if (saved) {
      masteredIds.value = JSON.parse(saved)
    }
  } catch (err) {
    console.error('Error loading mastered words from storage:', err)
  }
})

watch(masteredIds, (newVal) => {
  try {
    localStorage.setItem('medivocab_mastered', JSON.stringify(newVal))
  } catch (err) {
    console.error('Error saving mastered words to storage:', err)
  }
}, { deep: true })

function toggleMastered(id) {
  const index = masteredIds.value.indexOf(id)
  if (index === -1) {
    masteredIds.value.push(id)
  } else {
    masteredIds.value.splice(index, 1)
  }
}
</script>

<template>
  <div class="app-layout">
    <!-- Navbar Header & Mobile Bottom Dock -->
    <Navbar 
      :current-mode="currentMode" 
      :mastered-count="masteredIds.length"
      :total-words="wordsData.length"
      @change-mode="currentMode = $event"
    />

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Flashcard Mode -->
      <FlashcardMode 
        v-if="currentMode === 'flashcard'"
        :words="wordsData"
        :mastered-ids="masteredIds"
        @toggle-mastered="toggleMastered"
      />

      <!-- Quiz Mode -->
      <QuizMode 
        v-else-if="currentMode === 'quiz'"
        :words="wordsData"
      />

      <!-- Word List Mode -->
      <WordListMode 
        v-else-if="currentMode === 'list'"
        :words="wordsData"
        :mastered-ids="masteredIds"
        @toggle-mastered="toggleMastered"
      />
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p>MediVocab • Ứng dụng học 52 từ vựng tiếng Anh Y Tế & Chăm Sóc Sức Khỏe</p>
      <div class="footer-links">
        <span>Lưu trữ JSON thuần túy (Không dùng DB)</span>
        <span>•</span>
        <span>Phát Âm Chuẩn Web Speech API</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 12px 0 24px;
}

.app-footer {
  text-align: center;
  padding: 24px 16px;
  border-top: 1px solid var(--border-subtle);
  background: #ffffff;
  color: var(--text-dim);
  font-size: 0.84rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 10px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .main-content {
    padding-bottom: 80px; /* Space for mobile bottom dock */
  }
  .app-footer {
    margin-bottom: 64px; /* Ensure footer doesn't get covered */
    padding: 18px 12px;
    font-size: 0.78rem;
  }
  .footer-links {
    flex-wrap: wrap;
    gap: 6px;
  }
}
</style>
