<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import FlashcardDirection from './FlashcardDirection.vue'
import QuizSettings from './QuizSettings.vue'
import StudyStatusSelector from './StudyStatusSelector.vue'
import WordTypeSelector from './WordTypeSelector.vue'
import { TYPE_OPTIONS, matchesTypeFilter } from '../utils/typeFilter'
import {
  STUDY_STATUS_OPTIONS,
  filterByStudyStatus,
} from '../utils/studyStatus'
const props = defineProps({
  lesson: { type: Object, required: true },
  initialMode: { type: String, default: 'flashcard' },
  initialDirection: { type: String, default: 'en_vi' },
  wordType: { type: String, default: 'all' },
  wordStatus: { type: String, default: 'all' },
  masteredIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['start', 'back', 'change-type', 'change-status'])
const mode = ref(props.initialMode)
const flashcardDirection = ref(props.initialDirection)
const quizType = ref('en_vi')
const typeFilteredWords = computed(() =>
  props.lesson.words.filter((word) => matchesTypeFilter(word.type, props.wordType)),
)
const selectedWords = computed(() =>
  filterByStudyStatus(
    typeFilteredWords.value,
    props.wordStatus,
    props.masteredIds,
  ),
)
const typeTitle = computed(() =>
  TYPE_OPTIONS.find((type) => type.value === props.wordType)?.title || 'Tất cả từ loại',
)
const statusTitle = computed(() =>
  STUDY_STATUS_OPTIONS.find((status) => status.value === props.wordStatus)?.title || 'Tất cả',
)
const questionCount = ref(Math.min(10, selectedWords.value.length))
const canStart = computed(() => {
  if (selectedWords.value.length === 0) return false
  return mode.value !== 'quiz' || typeFilteredWords.value.length >= 4
})
watch(() => selectedWords.value.length, (count, previousCount) => {
  // Keep "all questions" selected as the group changes; otherwise retain a valid preset.
  if (questionCount.value === previousCount) questionCount.value = count
  else if (![10, 20, count].includes(questionCount.value) || questionCount.value > count)
    questionCount.value = Math.min(10, count)
})
function start() {
  if (!canStart.value) return
  emit('start', {
    mode: mode.value,
    flashcardDirection: flashcardDirection.value,
    quizType: quizType.value,
    questionCount: questionCount.value,
    wordStatus: props.wordStatus,
  })
}
</script>
<template>
  <div class="lesson-detail animate-fade-in">
    <button class="text-link back-link" @click="$emit('back')">
      <AppIcon name="back" :size="18" />Quay lại bài học
    </button>
    <ol class="flow-steps" aria-label="Các bước vào bài học">
      <li class="done">
        <span><AppIcon name="check" :size="14" /></span>Chọn bài học
      </li>
      <li class="current" aria-current="step"><span>2</span>Chọn cách học</li>
      <li><span>3</span>Bắt đầu luyện tập</li>
    </ol>
    <div class="detail-grid">
      <section :class="['lesson-summary clay-card', lesson.color]">
        <span class="clay-orb"><AppIcon :name="lesson.icon" :size="35" /></span
        ><span class="eyebrow"
          >{{
            lesson.number
              ? `BÀI ${String(lesson.number).padStart(2, '0')}`
              : 'BỘ TỪ VỰNG ĐẦY ĐỦ'
          }}
          · {{ lesson.words.length }} TỪ VỰNG</span
        >
        <h1>{{ lesson.title }}</h1>
        <p class="summary-english">{{ lesson.english }}</p>
        <p class="summary-description">{{ lesson.description }}</p>
        <div class="summary-progress">
          <span
            >{{ lesson.masteredCount }}/{{ lesson.words.length }} từ đã
            thuộc</span
          ><strong>{{ lesson.progress }}%</strong>
        </div>
        <div class="progress-track">
          <span :style="{ width: `${lesson.progress}%` }"></span>
        </div>
        <div class="preview-words">
          <h2>Những từ bạn sẽ học…</h2>
          <div>
            <span v-for="word in selectedWords.slice(0, 5)" :key="word.id">{{
              word.word
            }}</span
            ><span v-if="selectedWords.length > 5"
              >+{{ selectedWords.length - 5 }} từ</span
            >
          </div>
        </div>
        <div class="summary-tip">
          <AppIcon name="leaf" :size="20" /><span
            >Cứ học theo nhịp của bạn.<br />Từ chưa nhớ sẽ được ôn lại.</span
          >
        </div>
      </section>
      <section class="mode-setup clay-card">
        <span class="eyebrow">BƯỚC 02</span>
        <h2>Bạn muốn học thế nào?</h2>
        <p class="setup-description">Chọn cách học phù hợp với bạn hôm nay.</p>
        <WordTypeSelector
          :model-value="wordType"
          :words="lesson.words"
          @update:model-value="emit('change-type', $event)"
        />
        <StudyStatusSelector
          :model-value="wordStatus"
          :words="typeFilteredWords"
          :mastered-ids="masteredIds"
          @update:model-value="emit('change-status', $event)"
        />
        <fieldset class="study-mode-options">
          <legend class="sr-only">Cách học</legend>
          <button
            :class="['study-mode-option', { selected: mode === 'flashcard' }]"
            :aria-pressed="mode === 'flashcard'"
            @click="mode = 'flashcard'"
          >
            <span class="clay-orb violet"
              ><AppIcon name="cards" :size="24" /></span
            ><span
              ><strong>Flashcards</strong
              ><small>Lật thẻ và luyện gõ đáp án theo hai chiều Anh – Việt.</small></span
            ><span class="mode-radio"
              ><AppIcon v-if="mode === 'flashcard'" name="check" :size="13"
            /></span></button
          ><button
            :class="['study-mode-option', { selected: mode === 'quiz' }]"
            :aria-pressed="mode === 'quiz'"
            @click="mode = 'quiz'"
          >
            <span class="clay-orb pink"><AppIcon name="quiz" :size="24" /></span
            ><span
              ><strong>Trắc nghiệm</strong
              ><small>Thử sức với bốn đáp án và luyện nghe.</small></span
            ><span class="mode-radio"
              ><AppIcon v-if="mode === 'quiz'" name="check" :size="13"
            /></span>
          </button>
        </fieldset>
        <QuizSettings
          v-if="mode === 'quiz'"
          v-model:quiz-type="quizType"
          v-model:question-count="questionCount"
          :word-count="selectedWords.length"
        />
        <template v-else>
          <FlashcardDirection v-model="flashcardDirection" />
          <div class="flashcard-explainer">
            <AppIcon name="sparkles" :size="23" />
            <div>
              <strong>Học để nhớ lâu hơn</strong>
              <p>
                Thử nhớ và gõ đáp án trước khi lật thẻ. Những từ trả lời sai sẽ
                tự xuất hiện lại trong buổi học.
              </p>
            </div>
          </div>
        </template>
        <div class="start-area">
          <p class="study-scope" role="status">
            {{ typeTitle }}{{ wordStatus === 'all' ? '' : ` · ${statusTitle}` }} ·
            {{ selectedWords.length }}/{{ lesson.words.length }} từ trong bài
          </p>
          <p v-if="!canStart" id="study-unavailable" class="study-unavailable" role="status">
            {{ selectedWords.length === 0
              ? wordStatus === 'mastered'
                ? 'Bạn chưa đánh dấu từ nào là đã thuộc trong nhóm này.'
                : 'Chưa có từ thuộc nhóm này. Hãy chọn nhóm khác để bắt đầu.'
              : 'Trắc nghiệm cần ít nhất 4 từ trong nhóm từ loại để tạo các phương án trả lời. Bạn có thể học nhóm này bằng flashcards hoặc chọn từ loại khác.' }}
          </p>
          <span
            ><AppIcon name="book" :size="16" />{{
              mode === 'quiz'
                ? `${questionCount} câu hỏi`
                : `${selectedWords.length} từ vựng`
            }}<span>·</span
            >{{
              mode === 'quiz' ? 'Kiểm tra & luyện lại' : 'Học & ôn tập'
            }}</span
          ><button
            id="start-lesson"
            class="btn btn-primary"
            :disabled="!canStart"
            :aria-describedby="!canStart ? 'study-unavailable' : undefined"
            @click="start"
          >
            Bắt đầu {{ mode === 'quiz' ? 'trắc nghiệm' : 'học flashcards'
            }}<AppIcon name="arrow" :size="19" />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
<style scoped>
.back-link {
  margin-bottom: 18px;
}
.flow-steps {
  display: flex;
  list-style: none;
  align-items: center;
  justify-content: center;
  gap: 22px;
  margin: 0 0 30px;
  color: var(--text-muted);
  font-size: 0.73rem;
}
.flow-steps li {
  display: flex;
  gap: 8px;
  align-items: center;
}
.flow-steps li + li::before {
  content: '';
  height: 1px;
  width: 35px;
  background: #d8cce6;
  margin-right: 12px;
}
.flow-steps li > span {
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: #e9e2f2;
  font-weight: 800;
}
.flow-steps .current {
  color: var(--primary-dark);
  font-weight: 800;
}
.flow-steps .current > span {
  background: var(--accent-gradient);
  color: white;
  box-shadow: var(--shadow-button);
}
.flow-steps .done > span {
  color: var(--success);
  background: var(--success-bg);
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.3fr);
  gap: 28px;
  align-items: start;
}
.lesson-summary {
  padding: 33px;
  background: linear-gradient(135deg, #fcfaff, var(--tone-bg));
}
.lesson-summary > .clay-orb {
  width: 75px;
  height: 79px;
  border-radius: 27px;
  margin: 5px 0 29px;
  transform: rotate(-7deg);
}
.lesson-summary h1 {
  font-size: 2rem;
  letter-spacing: -0.035em;
  margin-top: 12px;
}
.summary-english {
  color: var(--tone-ink);
  font-size: 0.84rem;
  margin-top: 7px;
}
.summary-description {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.8;
  margin-top: 21px;
}
.summary-progress {
  display: flex;
  justify-content: space-between;
  font-size: 0.76rem;
  color: var(--text-muted);
  margin: 27px 0 9px;
}
.summary-progress strong {
  color: var(--tone-ink);
}
.preview-words {
  margin-top: 29px;
}
.preview-words h2 {
  font-size: 0.82rem;
  margin-bottom: 14px;
}
.preview-words > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.preview-words span {
  padding: 7px 12px;
  font-size: 0.74rem;
  background: #fcfaffb3;
  border: 1px solid #fff;
  border-radius: 20px;
  overflow-wrap: anywhere;
}
.summary-tip {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--tone-ink);
  border-top: 1px solid #d8cee4;
  padding-top: 23px;
  margin-top: 30px;
  font-size: 0.73rem;
}
.mode-setup {
  padding: 33px;
}
.mode-setup > h2 {
  font-size: 1.6rem;
  letter-spacing: -0.025em;
  margin-top: 9px;
}
.setup-description {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 8px;
}
.study-mode-options {
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 25px 0;
  padding-top: 25px;
  border-top: 1px solid var(--border-subtle);
}
.study-mode-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  text-align: left;
  border: 1.5px solid var(--border-subtle);
  border-radius: 25px;
  background: #f8f5fc;
}
.study-mode-option.selected {
  border-color: #ae8cd9;
  background: #f0e7fb;
  box-shadow:
    inset 3px 3px 7px #ddd0ed77,
    inset -3px -3px 7px #fff;
}
.study-mode-option .clay-orb {
  width: 44px;
  height: 47px;
  border-radius: 18px;
}
.study-mode-option strong {
  display: block;
  font-size: 0.95rem;
  color: var(--text-main);
}
.study-mode-option small {
  display: block;
  font: 400 0.74rem/1.6 var(--font-family);
  color: var(--text-muted);
  margin-top: 4px;
}
.mode-radio {
  display: grid;
  place-items: center;
  margin-left: auto;
  width: 21px;
  height: 21px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--border-medium);
}
.selected .mode-radio {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.flashcard-explainer {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  background: #f0eaf7;
  color: #73528f;
  padding: 21px;
  border-radius: 23px;
}
.flashcard-explainer strong {
  font-size: 0.83rem;
}
.flashcard-explainer p {
  font-size: 0.76rem;
  line-height: 1.8;
  color: var(--text-muted);
  margin-top: 4px;
}
.start-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 27px;
}
.start-area > span {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.72rem;
}
.study-scope {
  text-align: center;
  color: var(--primary-dark);
  font-size: 0.78rem;
  font-weight: 700;
}
.study-unavailable {
  padding: 14px 17px;
  border-radius: 18px;
  color: var(--warning);
  background: var(--warning-bg);
  font-size: 0.78rem;
}
.start-area .btn {
  width: 100%;
  min-height: 56px;
}
@media (max-width: 1100px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .lesson-summary {
    display: grid;
    grid-template-columns: 80px 1fr;
    column-gap: 24px;
  }
  .lesson-summary > .clay-orb {
    grid-row: span 4;
    margin: 0;
  }
  .lesson-summary .summary-description {
    grid-column: 1 / -1;
  }
  .lesson-summary .summary-progress,
  .lesson-summary .progress-track,
  .preview-words,
  .summary-tip {
    grid-column: 1 / -1;
  }
  .summary-tip {
    display: none;
  }
  .lesson-summary h1 {
    font-size: 1.7rem;
  }
}
@media (max-width: 600px) {
  .lesson-summary .summary-description,
  .lesson-summary .preview-words {
    display: none;
  }
  .flow-steps {
    gap: 12px;
    font-size: 0.57rem;
    justify-content: space-between;
  }
  .flow-steps li {
    flex-direction: column;
    gap: 7px;
  }
  .flow-steps li + li::before {
    display: none;
  }
  .detail-grid {
    gap: 21px;
  }
  .lesson-summary,
  .mode-setup {
    padding: 25px 22px;
  }
  .lesson-summary {
    column-gap: 17px;
    grid-template-columns: 55px 1fr;
  }
  .lesson-summary > .clay-orb {
    width: 53px;
    height: 58px;
    border-radius: 21px;
  }
  .lesson-summary h1 {
    font-size: 1.45rem;
  }
  .lesson-summary .eyebrow {
    font-size: 0.53rem;
  }
  .mode-setup > h2 {
    font-size: 1.4rem;
  }
  .study-mode-option {
    padding: 17px 13px;
    gap: 12px;
  }
  .study-mode-option small {
    font-size: 0.68rem;
  }
  .study-mode-option .clay-orb {
    width: 37px;
    height: 42px;
  }
}
</style>
