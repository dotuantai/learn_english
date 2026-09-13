<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import rawWordsData from './data/words.json'
import { buildLessons } from './data/lessons'

const wordsData = Array.isArray(rawWordsData)
  ? rawWordsData
  : Object.entries(rawWordsData).flatMap(([lessonKey, list]) =>
      list.map((item) => ({ ...item, lessonKey })),
    )
import Navbar from './components/Navbar.vue'
import AppIcon from './components/AppIcon.vue'
import LearningDashboard from './components/LearningDashboard.vue'
import LessonDetail from './components/LessonDetail.vue'
import FlashcardMode from './components/FlashcardMode.vue'
import QuizMode from './components/QuizMode.vue'
import WordListMode from './components/WordListMode.vue'

const validIds = new Set(wordsData.map((word) => word.id))
function loadMastered() {
  try {
    const saved = JSON.parse(localStorage.getItem('medivocab_mastered') || '[]')
    return Array.isArray(saved)
      ? [...new Set(saved.filter((id) => validIds.has(id)))]
      : []
  } catch {
    return []
  }
}
const masteredIds = ref(loadMastered())
const storageMessage = ref('')
watch(
  masteredIds,
  (ids) => {
    try {
      localStorage.setItem('medivocab_mastered', JSON.stringify(ids))
      storageMessage.value = ''
    } catch {
      storageMessage.value =
        'Tiến độ vẫn được giữ trong phiên này. Trình duyệt hiện chưa cho phép lưu để dùng lần sau.'
    }
  },
  { deep: true },
)
function toggleMastered(id) {
  if (!validIds.has(id)) return
  masteredIds.value = masteredIds.value.includes(id)
    ? masteredIds.value.filter((saved) => saved !== id)
    : [...masteredIds.value, id]
}

// Keep word arrays stable when mastery changes so an active deck is not restarted.
const groupedLessons = buildLessons(wordsData)
const lessons = computed(() => {
  const mastered = new Set(masteredIds.value)
  return groupedLessons.map((lesson) => {
    const masteredCount = lesson.words.filter((word) => mastered.has(word.id)).length
    return {
      ...lesson,
      masteredCount,
      progress: lesson.words.length ? Math.round(masteredCount / lesson.words.length * 100) : 0,
    }
  })
})
const allLesson = computed(() => {
  if (lessons.value.length === 1) return lessons.value[0]
  return {
    id: 'all',
    title: 'Toàn bộ từ vựng',
    english: 'Medical & healthcare English',
    description:
      'Ôn luyện trọn bộ từ vựng tiếng Anh trong một buổi học.',
    words: wordsData,
    masteredCount: masteredIds.value.length,
    progress: wordsData.length
      ? Math.round((masteredIds.value.length / wordsData.length) * 100)
      : 0,
    color: 'violet',
    icon: 'book',
  }
})
const route = ref(readRoute())
const mainContent = ref(null)
const sessionOptions = ref({
  quizType: 'en_vi',
  questionCount: 10,
  flashcardDirection: 'en_vi',
})
function readRoute() {
  const [view = 'home', lessonId = 'all', mode = 'flashcard'] =
    window.location.hash.replace(/^#\/?/, '').split('/')
  const validView = [
    'home',
    'lessons',
    'lesson',
    'flashcard',
    'quiz',
    'list',
  ].includes(view)
    ? view
    : 'home'
  return {
    view: validView,
    lessonId,
    mode: mode === 'quiz' ? 'quiz' : 'flashcard',
  }
}
const currentLesson = computed(
  () =>
    lessons.value.find((lesson) => lesson.id === route.value.lessonId) ||
    allLesson.value,
)
const activeNavigation = computed(() =>
  route.value.view === 'lesson'
    ? route.value.lessonId === 'all'
      ? route.value.mode
      : 'lessons'
    : route.value.view,
)
const isSession = computed(() =>
  ['flashcard', 'quiz'].includes(route.value.view),
)
const pageLabel = computed(
  () =>
    ({
      home: 'Tổng quan',
      lessons: 'Bài học',
      lesson: 'Chuẩn bị bài học',
      flashcard: 'Luyện tập flashcards',
      quiz: 'Thử sức trắc nghiệm',
      list: 'Thư viện từ vựng',
    })[route.value.view],
)
function navigate(view) {
  const lessonId = lessons.value.length === 1 ? lessons.value[0].id : 'all'
  window.location.hash = ['flashcard', 'quiz'].includes(view)
    ? `lesson/${lessonId}/${view}`
    : view
}
function selectLesson(id) {
  window.location.hash = `lesson/${id}/flashcard`
}
function startLesson(options) {
  sessionOptions.value = options
  window.location.hash = `${options.mode}/${currentLesson.value.id}`
}
function changeStudyMode() {
  window.location.hash = `lesson/${currentLesson.value.id}/${route.value.view}`
}
function syncRoute() {
  route.value = readRoute()
  window.speechSynthesis?.cancel()
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    // Flashcards focus their answer input; other views announce their new content.
    if (route.value.view !== 'flashcard')
      mainContent.value?.focus({ preventScroll: true })
  })
}
onMounted(() => window.addEventListener('hashchange', syncRoute))
onUnmounted(() => window.removeEventListener('hashchange', syncRoute))
</script>

<template>
  <div class="app-layout">
    <a
      class="skip-link"
      href="#main-content"
      @click.prevent="mainContent?.focus()"
      >Đến nội dung chính</a
    >
    <div class="ambient-background" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <Navbar
      :studying="isSession"
      :current-mode="activeNavigation"
      :mastered-count="masteredIds.length"
      :total-words="wordsData.length"
      @change-mode="navigate"
    />
    <div class="workspace" :class="{ studying: isSession }">
      <header class="workspace-header">
        <div>
          <AppIcon name="book" :size="16" /><span>Không gian học tập</span
          ><span class="breadcrumb-divider">/</span
          ><strong>{{ pageLabel }}</strong>
        </div>
        <span class="pace-note"><span></span>Học theo nhịp của bạn</span>
      </header>
      <main
        id="main-content"
        ref="mainContent"
        class="main-content"
        tabindex="-1"
      >
        <p v-if="storageMessage" class="storage-message" role="status">
          {{ storageMessage }}
        </p>
        <LearningDashboard
          v-if="route.view === 'home' || route.view === 'lessons'"
          :lessons="lessons"
          :total-words="wordsData.length"
          :mastered-count="masteredIds.length"
          :lessons-only="route.view === 'lessons'"
          @select-lesson="selectLesson"
          @navigate="navigate"
        />
        <LessonDetail
          v-else-if="route.view === 'lesson'"
          :key="`${currentLesson.id}-${route.mode}`"
          :lesson="currentLesson"
          :initial-mode="route.mode"
          :initial-direction="sessionOptions.flashcardDirection"
          @back="navigate('lessons')"
          @start="startLesson"
        />
        <template v-else-if="isSession"
          ><div class="session-heading">
            <button class="text-link" @click="navigate('lessons')">
              <AppIcon name="back" :size="18" />Bài học</button
            ><span class="badge">{{
              route.view === 'quiz' ? 'TRẮC NGHIỆM' : 'FLASHCARDS'
            }}</span>
            <h1>{{ currentLesson.title }}</h1>
            <button class="text-link change-lesson" @click="changeStudyMode">
              Đổi cách học<AppIcon name="shuffle" :size="16" />
            </button>
          </div>
          <FlashcardMode
            v-if="route.view === 'flashcard'"
            :key="`flashcard-${currentLesson.id}`"
            :words="currentLesson.words"
            :mastered-ids="masteredIds"
            :initial-direction="sessionOptions.flashcardDirection"
            @change-direction="sessionOptions.flashcardDirection = $event"
            @toggle-mastered="toggleMastered"
            @back-to-lessons="navigate('lessons')" /><QuizMode
            v-else
            :key="`quiz-${currentLesson.id}`"
            :words="currentLesson.words"
            :initial-options="sessionOptions"
            auto-start
            @back-to-lessons="navigate('lessons')"
        /></template>
        <template v-else-if="route.view === 'list'"
          ><div class="page-heading">
            <div>
              <h1>Góc nhỏ, nhiều từ hay.</h1>
              <p>Tra cứu, nghe phát âm và đánh dấu những từ bạn đã thuộc.</p>
            </div>
            <span class="badge"
              ><AppIcon name="book" :size="16" />{{ wordsData.length }} từ
              vựng</span
            >
          </div>
          <WordListMode
            :words="wordsData"
            :lessons="lessons"
            :mastered-ids="masteredIds"
            @toggle-mastered="toggleMastered"
        /></template>
      </main>
      <footer class="app-footer">
        <span
          >MyHoa<span class="footer-dot">·</span>Mỗi ngày một chút, mỗi ngày
          tiến bộ.</span
        ><span
          >Made for your learning journey <AppIcon name="heart" :size="13"
        /></span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  isolation: isolate;
}
.ambient-background {
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: -1;
  pointer-events: none;
}
.ambient-background span {
  position: absolute;
  width: 55vh;
  height: 55vh;
  border-radius: 50%;
  filter: blur(70px);
  background: #a78bfa14;
  top: -20%;
  left: 15%;
  animation: clay-blob 12s ease-in-out infinite;
}
.ambient-background span:nth-child(2) {
  left: auto;
  right: -15%;
  top: 15%;
  background: #ec489913;
  animation-delay: -4s;
}
.ambient-background span:nth-child(3) {
  top: auto;
  bottom: -25%;
  left: 25%;
  background: #0ea5e912;
  animation-delay: -8s;
}
.workspace {
  margin-left: 268px;
  padding: 0 40px;
  max-width: 1720px;
}
.workspace-header {
  height: 101px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  font-size: 0.68rem;
  color: var(--text-muted);
}
.workspace-header > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.workspace-header strong {
  color: var(--text-main);
  font-size: 0.72rem;
}
.breadcrumb-divider {
  color: #776c82;
  margin-inline: 2px;
}
.pace-note {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.65rem;
}
.pace-note > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #599f7b;
}
.main-content {
  min-height: calc(100vh - 180px);
  outline: none;
}
.main-content:focus {
  outline: none;
}
.app-footer {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  align-items: center;
  padding: 26px 0 25px;
  margin-top: 20px;
  border-top: 1px solid #ded5e77a;
  font-size: 0.6rem;
  color: var(--text-muted);
}
.app-footer > span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.footer-dot {
  padding: 0 3px;
}
.session-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 27px;
}
.session-heading h1 {
  font-size: 1.5rem;
  letter-spacing: -0.025em;
}
.session-heading .badge {
  font-size: 0.59rem;
}
.change-lesson {
  margin-left: auto;
}
.storage-message {
  padding: 14px 20px;
  color: var(--warning);
  background: var(--warning-bg);
  border-radius: 20px;
  margin-bottom: 20px;
  font-size: 0.8rem;
}
.skip-link {
  position: fixed;
  left: 30px;
  top: -100px;
  z-index: 100;
  padding: 14px 20px;
  border-radius: 20px;
  background: var(--primary);
  color: #fff;
}
.skip-link:focus {
  top: 15px;
}
@media (min-width: 1720px) {
  .workspace {
    margin-inline: auto;
    padding-left: 306px;
  }
}
@media (max-width: 1100px) {
  .workspace {
    margin-left: 226px;
    padding-inline: 28px;
  }
  .workspace-header {
    height: 90px;
  }
  .pace-note {
    display: none;
  }
  .session-heading {
    gap: 10px;
  }
  .session-heading h1 {
    width: 100%;
    order: 3;
  }
}
@media (max-width: 768px) {
  .workspace.studying {
    padding-bottom: 20px;
  }
  .workspace {
    margin: 0;
    padding: 0 20px 94px;
  }
  .workspace-header {
    height: 59px;
    font-size: 0.61rem;
  }
  .workspace-header strong {
    font-size: 0.65rem;
  }
  .app-footer {
    flex-direction: column;
    gap: 8px;
    font-size: 0.6rem;
  }
  .session-heading {
    margin-bottom: 20px;
  }
  .session-heading h1 {
    font-size: 1.4rem;
  }
}
</style>
