<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { buildLessons } from './utils/lessons'
import { authApi, clearAuthSession, getAuthSession, learningApi } from './services/api'
import { TYPE_OPTIONS, matchesTypeFilter } from './utils/typeFilter'
import {
  STUDY_STATUS_OPTIONS,
  filterByStudyStatus,
  isValidStudyStatus,
} from './utils/studyStatus'

import Navbar from './components/Navbar.vue'
import AppIcon from './components/AppIcon.vue'
import AppToast from './components/AppToast.vue'
import AuthPage from './components/AuthPage.vue'
import LearningDashboard from './components/LearningDashboard.vue'
import LessonDetail from './components/LessonDetail.vue'
import FlashcardMode from './components/FlashcardMode.vue'
import QuizMode from './components/QuizMode.vue'
import WordListMode from './components/WordListMode.vue'

const sourceLessons = shallowRef([])
const wordsData = computed(() =>
  sourceLessons.value.flatMap((lesson) =>
    lesson.words.map((word) => ({ ...word, lessonKey: lesson.key })),
  ),
)
const validIds = computed(() => new Set(wordsData.value.map((word) => word.id)))
const contentLoading = ref(true)
const contentError = ref('')
const currentUser = ref(null)
const authBusy = ref(false)
const authError = ref('')

const masteredIds = ref([])
const appToast = ref(null)
const TOAST_DURATION = 5000
let toastDismissTimer
let toastId = 0

function dismissToast() {
  clearTimeout(toastDismissTimer)
  toastDismissTimer = undefined
  appToast.value = null
}

function showToast(notification = {}) {
  const message = String(notification.message || '').trim()
  if (!message) return

  clearTimeout(toastDismissTimer)
  appToast.value = {
    id: ++toastId,
    message,
    title: notification.title || '',
    tone: notification.tone || 'info',
    action: notification.action || '',
    actionLabel: notification.actionLabel || '',
  }

  toastDismissTimer = window.setTimeout(() => {
    appToast.value = null
    toastDismissTimer = undefined
  }, TOAST_DURATION)
}

function handleToastAction() {
  const action = appToast.value?.action
  dismissToast()
  if (action === 'login') navigateAuth('login')
}

async function toggleMastered(id) {
  if (!validIds.value.has(id)) return
  if (!currentUser.value) {
    showToast({
      title: 'Cần đăng nhập',
      message: 'Vui lòng đăng nhập để lưu từ đã thuộc vào tài khoản.',
      tone: 'warning',
      action: 'login',
      actionLabel: 'Đăng nhập',
    })
    return
  }

  const mastered = !masteredIds.value.includes(id)
  masteredIds.value = mastered
    ? [...masteredIds.value, id]
    : masteredIds.value.filter((saved) => saved !== id)

  try {
    await learningApi.setMastered(id, mastered)
  } catch {
    masteredIds.value = mastered
      ? masteredIds.value.filter((saved) => saved !== id)
      : [...masteredIds.value, id]
    showToast({
      message: 'Chưa thể đồng bộ tiến độ lên máy chủ. Vui lòng thử lại.',
      tone: 'error',
    })
  }
}

// Keep word arrays stable when mastery changes so an active deck is not restarted.
const groupedLessons = computed(() => buildLessons(sourceLessons.value))
const lessons = computed(() => {
  const mastered = new Set(masteredIds.value)
  return groupedLessons.value.map((lesson) => {
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
    words: wordsData.value,
    masteredCount: masteredIds.value.length,
    progress: wordsData.value.length
      ? Math.round((masteredIds.value.length / wordsData.value.length) * 100)
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
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const [view = 'home', lessonId = 'all', mode = 'flashcard'] =
    path.split('/')
  const params = new URLSearchParams(query)
  const requestedType = params.get('type')
  const requestedStatus = params.get('status')
  const validView = [
    'home',
    'lessons',
    'lesson',
    'flashcard',
    'quiz',
    'list',
    'login',
    'register',
  ].includes(view)
    ? view
    : 'home'
  return {
    view: validView,
    lessonId,
    mode: mode === 'quiz' ? 'quiz' : 'flashcard',
    wordType: TYPE_OPTIONS.some((type) => type.value === requestedType) ? requestedType : 'all',
    wordStatus: isValidStudyStatus(requestedStatus) ? requestedStatus : 'all',
  }
}
const currentLesson = computed(
  () =>
    lessons.value.find((lesson) => lesson.id === route.value.lessonId) ||
    allLesson.value,
)
// Keep the type-filtered pool stable when mastery changes. Flashcards create their
// own status-filtered session from this pool, while quizzes receive filtered targets.
const currentLessonWords = computed(() => currentLesson.value.words)
const studyPoolWords = computed(() =>
  currentLessonWords.value.filter((word) => matchesTypeFilter(word.type, route.value.wordType)),
)
const studyWords = computed(() =>
  filterByStudyStatus(
    studyPoolWords.value,
    route.value.wordStatus,
    masteredIds.value,
  ),
)
const studyTypeTitle = computed(() =>
  TYPE_OPTIONS.find((type) => type.value === route.value.wordType)?.title,
)
const studyStatusTitle = computed(() =>
  STUDY_STATUS_OPTIONS.find((status) => status.value === route.value.wordStatus)?.title,
)
function withStudyFilters(
  path,
  wordType = route.value.wordType,
  wordStatus = route.value.wordStatus,
) {
  const params = new URLSearchParams()
  if (wordType !== 'all') params.set('type', wordType)
  if (wordStatus !== 'all') params.set('status', wordStatus)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
function changeWordType(wordType) {
  if (!TYPE_OPTIONS.some((type) => type.value === wordType)) return
  const path = window.location.hash.slice(1).split('?')[0]
  window.history.replaceState(null, '', `#${withStudyFilters(path, wordType)}`)
  route.value = readRoute()
}
function changeStudyStatus(wordStatus) {
  if (!isValidStudyStatus(wordStatus)) return
  const path = window.location.hash.slice(1).split('?')[0]
  window.history.replaceState(
    null,
    '',
    `#${withStudyFilters(path, route.value.wordType, wordStatus)}`,
  )
  route.value = readRoute()
}
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
const isAuthView = computed(() =>
  ['login', 'register'].includes(route.value.view),
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
      login: 'Đăng nhập',
      register: 'Đăng ký',
    })[route.value.view],
)
function navigate(view) {
  const lessonId = lessons.value.length === 1 ? lessons.value[0].id : 'all'
  window.location.hash = ['flashcard', 'quiz'].includes(view)
    ? `lesson/${lessonId}/${view}`
    : view
}
function navigateAuth(view) {
  authError.value = ''
  window.location.hash = view
}
function selectLesson(id) {
  window.location.hash = `lesson/${id}/flashcard`
}
function startLesson(options) {
  sessionOptions.value = options
  window.location.hash = withStudyFilters(
    `${options.mode}/${currentLesson.value.id}`,
    route.value.wordType,
    options.wordStatus,
  )
}
function changeStudyMode() {
  window.location.hash = withStudyFilters(
    `lesson/${currentLesson.value.id}/${route.value.view}`,
  )
}
function syncRoute() {
  route.value = readRoute()
  authError.value = ''
  window.speechSynthesis?.cancel()
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    // Flashcards focus their answer input; other views announce their new content.
    if (route.value.view !== 'flashcard')
      mainContent.value?.focus({ preventScroll: true })
  })
}

async function loadContent() {
  contentLoading.value = true
  contentError.value = ''
  try {
    const content = await learningApi.getContent()
    sourceLessons.value = Array.isArray(content?.lessons) ? content.lessons : []
  } catch {
    contentError.value =
      'Chưa thể tải dữ liệu bài học từ máy chủ. Hãy kiểm tra backend và thử lại.'
  } finally {
    contentLoading.value = false
  }
}

async function hydrateAuthenticatedUser() {
  const user = await authApi.me()
  currentUser.value = user
  try {
    const progress = await learningApi.getProgress()
    masteredIds.value = (progress?.masteredWordIds || []).filter((id) =>
      validIds.value.has(id),
    )
  } catch {
    showToast({
      message: 'Không thể tải tiến độ học tập từ máy chủ.',
      tone: 'error',
    })
  }
}

async function restoreSession() {
  if (!getAuthSession()) return
  try {
    await hydrateAuthenticatedUser()
  } catch {
    clearAuthSession()
    currentUser.value = null
  }
}

function friendlyAuthError(error, mode) {
  if (error?.status === 401)
    return 'Email hoặc mật khẩu chưa đúng. Bạn hãy kiểm tra và thử lại.'
  if (error?.status === 400) {
    const rawMessage = error.message || ''
    if (/duplicate|already|taken/i.test(rawMessage))
      return 'Email này đã được sử dụng. Bạn có thể chuyển sang đăng nhập.'
    if (/password/i.test(rawMessage))
      return 'Mật khẩu chưa đáp ứng yêu cầu bảo mật. Hãy dùng ít nhất 6 ký tự và thêm chữ hoa, chữ thường hoặc số.'
  }
  return mode === 'register'
    ? 'Chưa thể tạo tài khoản lúc này. Vui lòng thử lại.'
    : 'Chưa thể đăng nhập lúc này. Vui lòng thử lại.'
}

async function handleAuthSubmit(credentials) {
  authBusy.value = true
  authError.value = ''
  const mode = route.value.view
  try {
    await (mode === 'register'
      ? authApi.register(credentials)
      : authApi.login(credentials))
    await hydrateAuthenticatedUser()
    window.location.hash = 'home'
  } catch (error) {
    authError.value = friendlyAuthError(error, mode)
  } finally {
    authBusy.value = false
  }
}

async function logout() {
  currentUser.value = null
  masteredIds.value = []
  await authApi.logout()
  dismissToast()
}

onMounted(async () => {
  localStorage.removeItem('medivocab_mastered')
  window.addEventListener('hashchange', syncRoute)
  await loadContent()
  await restoreSession()
})
onUnmounted(() => {
  clearTimeout(toastDismissTimer)
  window.removeEventListener('hashchange', syncRoute)
})
</script>

<template>
  <AppToast
    :toast="appToast"
    @action="handleToastAction"
    @close="dismissToast"
  />
  <div v-if="isAuthView" class="auth-layout">
    <div class="ambient-background" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <AuthPage
      :mode="route.view"
      :busy="authBusy"
      :server-error="authError"
      @submit="handleAuthSubmit"
      @navigate="navigateAuth"
    />
  </div>
  <div v-else class="app-layout">
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
      :user="currentUser"
      @change-mode="navigate"
      @login="navigateAuth('login')"
      @logout="logout"
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
        <section v-if="contentLoading" class="content-state clay-card" aria-live="polite">
          <span class="state-spinner" aria-hidden="true"></span>
          <h1>Đang mở góc học tập…</h1>
          <p>MyHoa đang lấy bài học và từ vựng từ cơ sở dữ liệu.</p>
        </section>
        <section v-else-if="contentError" class="content-state clay-card" role="alert">
          <span class="clay-orb pink"><AppIcon name="alert" :size="26" /></span>
          <h1>Chưa tải được bài học</h1>
          <p>{{ contentError }}</p>
          <button class="btn btn-primary" type="button" @click="loadContent">
            <AppIcon name="arrow" :size="18" />Thử lại
          </button>
        </section>
        <LearningDashboard
          v-else-if="route.view === 'home' || route.view === 'lessons'"
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
          :word-type="route.wordType"
          :word-status="route.wordStatus"
          :mastered-ids="masteredIds"
          @change-type="changeWordType"
          @change-status="changeStudyStatus"
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
            <span v-if="route.wordType !== 'all'" class="badge session-type">
              <AppIcon name="language" :size="15" />{{ studyTypeTitle }} · {{ studyPoolWords.length }} từ
            </span>
            <span v-if="route.wordStatus !== 'all'" class="badge session-status">
              <AppIcon :name="route.wordStatus === 'mastered' ? 'star' : 'pulse'" :size="15" />
              {{ studyStatusTitle }} · {{ studyWords.length }} từ
            </span>
            <button class="text-link change-lesson" @click="changeStudyMode">
              Đổi cách học<AppIcon name="shuffle" :size="16" />
            </button>
          </div>
          <FlashcardMode
            v-if="route.view === 'flashcard'"
            :key="`flashcard-${currentLesson.id}-${route.wordType}-${route.wordStatus}`"
            :words="studyPoolWords"
            :mastered-ids="masteredIds"
            :initial-direction="sessionOptions.flashcardDirection"
            :initial-filter="route.wordStatus"
            @change-direction="sessionOptions.flashcardDirection = $event"
            @toggle-mastered="toggleMastered"
            @back-to-lessons="navigate('lessons')" /><QuizMode
            v-else
            :key="`quiz-${currentLesson.id}-${route.wordType}-${route.wordStatus}`"
            :words="studyWords"
            :distractor-words="studyPoolWords"
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
.auth-layout {
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
.content-state {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 45px 24px;
  text-align: center;
}
.content-state h1 {
  font-size: 1.55rem;
}
.content-state p {
  max-width: 530px;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.content-state .btn {
  margin-top: 8px;
}
.state-spinner {
  width: 46px;
  height: 46px;
  border: 4px solid #ded4ec;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: state-spin 0.75s linear infinite;
}
@keyframes state-spin {
  to { transform: rotate(360deg); }
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
