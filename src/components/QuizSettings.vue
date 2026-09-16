<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
const props = defineProps({
  quizType: { type: String, default: 'en_vi' },
  questionCount: { type: Number, default: 10 },
  wordCount: { type: Number, required: true },
})
const emit = defineEmits(['update:quizType', 'update:questionCount'])
const types = [
  {
    id: 'en_vi',
    icon: 'language',
    title: 'Anh → Việt',
    text: 'Nhìn từ, chọn nghĩa tiếng Việt',
  },
  {
    id: 'vi_en',
    icon: 'chat',
    title: 'Việt → Anh',
    text: 'Nhìn nghĩa, chọn từ tiếng Anh',
  },
  {
    id: 'listening',
    icon: 'headphones',
    title: 'Luyện nghe',
    text: 'Nghe phát âm, chọn từ đúng',
  },
  {
    id: 'mixed',
    icon: 'shuffle',
    title: 'Hỗn hợp',
    text: 'Kết hợp cả ba dạng câu hỏi',
  },
]
const minimumCount = computed(() => (props.wordCount > 0 ? 1 : 0))

function clampQuestionCount(value) {
  if (props.wordCount === 0) return 0
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return minimumCount.value
  return Math.min(
    props.wordCount,
    Math.max(minimumCount.value, Math.round(numericValue)),
  )
}

const questionCountModel = computed({
  get: () => clampQuestionCount(props.questionCount),
  set: (value) => emit('update:questionCount', clampQuestionCount(value)),
})

const sliderProgress = computed(() => {
  if (props.wordCount <= minimumCount.value) return 100
  return Math.round(
    ((questionCountModel.value - minimumCount.value) /
      (props.wordCount - minimumCount.value)) *
      100,
  )
})
</script>
<template>
  <div class="quiz-settings">
    <fieldset>
      <legend>Dạng bài trắc nghiệm</legend>
      <div class="quiz-types">
        <button
          v-for="type in types"
          :key="type.id"
          :class="['quiz-type', { selected: quizType === type.id }]"
          :aria-pressed="quizType === type.id"
          @click="$emit('update:quizType', type.id)"
        >
          <AppIcon :name="type.icon" :size="23" /><span
            ><strong>{{ type.title }}</strong
            ><small>{{ type.text }}</small></span
          ><span class="selection-dot"
            ><AppIcon v-if="quizType === type.id" name="check" :size="12"
          /></span>
        </button>
      </div>
    </fieldset>
    <fieldset aria-describedby="question-count-hint">
      <legend>Số lượng câu hỏi</legend>
      <div class="question-count-control">
        <div class="count-overview">
          <span>Điều chỉnh theo thời gian bạn có</span>
          <label class="inline-count-input" for="question-count-input">
            <span class="sr-only">Nhập số câu hỏi</span>
            <input
              id="question-count-input"
              v-model.number="questionCountModel"
              type="number"
              inputmode="numeric"
              :min="minimumCount"
              :max="wordCount"
              step="1"
              :disabled="wordCount === 0"
            />
            <span>/ {{ wordCount }} câu</span>
          </label>
        </div>

        <input
          id="question-count-range"
          v-model.number="questionCountModel"
          class="question-range"
          type="range"
          :min="minimumCount"
          :max="wordCount"
          step="1"
          :disabled="wordCount === 0"
          :style="{ '--range-progress': `${sliderProgress}%` }"
          aria-label="Chọn số lượng câu hỏi"
        />
        <div class="range-labels" aria-hidden="true">
          <span>{{ minimumCount }} câu</span>
          <span>{{ wordCount }} câu</span>
        </div>
        <p id="question-count-hint">
          {{
            questionCountModel === wordCount
              ? `Bạn sẽ làm tất cả ${wordCount} câu hỏi trong nhóm này.`
              : `Bài kiểm tra sẽ chọn ngẫu nhiên ${questionCountModel} câu trong ${wordCount} từ.`
          }}
        </p>
      </div>
    </fieldset>
  </div>
</template>
<style scoped>
.quiz-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
fieldset {
  border: 0;
  min-width: 0;
}
legend {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 0.84rem;
  margin-bottom: 13px;
}
.quiz-types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.quiz-type {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 83px;
  padding: 16px;
  text-align: left;
  background: #f8f4fc;
  border: 1px solid var(--border-subtle);
  border-radius: 22px;
  color: var(--text-muted);
}
.quiz-type.selected {
  border-color: #ae8cd9;
  background: #efe4fc;
  color: var(--primary-dark);
  box-shadow:
    inset 2px 2px 5px #d9c9eb80,
    inset -2px -2px 5px #fff;
}
.quiz-type strong {
  font-size: 0.84rem;
  display: block;
}
.quiz-type small {
  font: 400 0.68rem var(--font-family);
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
}
.selection-dot {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  margin-left: auto;
  border: 1px solid #c4b4d5;
  display: grid;
  place-items: center;
}
.selected .selection-dot {
  color: #fff;
  background: var(--primary);
  border-color: var(--primary);
}
.question-count-control {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 23px;
  background: #f8f4fc;
  box-shadow:
    inset 2px 2px 6px #ded2eb66,
    inset -2px -2px 6px #fff;
}
.count-overview,
.range-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.count-overview > span {
  color: var(--text-muted);
  font-size: 0.73rem;
}
.inline-count-input {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  flex-shrink: 0;
  min-height: 44px;
  padding: 3px 9px;
  border: 1px solid transparent;
  border-radius: 15px;
  color: var(--text-muted);
  font-size: 0.72rem;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}
.inline-count-input:hover {
  border-color: var(--border-medium);
  background: #ffffff80;
}
.inline-count-input:focus-within {
  border-color: var(--primary-light);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px #8f61c733;
}
.inline-count-input input {
  width: 56px;
  min-height: 36px;
  padding: 0;
  border: 0;
  outline: 0;
  color: var(--primary-dark);
  background: transparent;
  text-align: right;
  font: 800 1.35rem var(--font-heading);
}
.inline-count-input input::-webkit-inner-spin-button,
.inline-count-input input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}
.inline-count-input input[type='number'] {
  appearance: textfield;
}
.inline-count-input input:disabled {
  cursor: not-allowed;
}
.question-range {
  --range-progress: 0%;
  width: 100%;
  height: 10px;
  margin: 22px 0 8px;
  border: 0;
  border-radius: 999px;
  appearance: none;
  background: linear-gradient(
    to right,
    var(--primary) 0 var(--range-progress),
    #dfd5e9 var(--range-progress) 100%
  );
  box-shadow: inset 2px 2px 4px #cfc2dd;
  cursor: pointer;
}
.question-range::-webkit-slider-thumb {
  width: 28px;
  height: 28px;
  border: 4px solid #fff;
  border-radius: 50%;
  appearance: none;
  background: var(--primary);
  box-shadow: 0 4px 10px #68409f4d;
  cursor: grab;
}
.question-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: 4px solid #fff;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 4px 10px #68409f4d;
  cursor: grab;
}
.question-range:focus-visible {
  outline: 3px solid #8f61c766;
  outline-offset: 5px;
}
.question-range:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.range-labels {
  color: var(--text-muted);
  font-size: 0.65rem;
}
#question-count-hint {
  margin-top: 13px;
  color: var(--text-muted);
  font-size: 0.69rem;
  line-height: 1.6;
}
@media (max-width: 600px) {
  .quiz-types {
    grid-template-columns: 1fr;
  }
  .quiz-type {
    min-height: 77px;
  }
  .question-count-control {
    padding: 16px;
  }
  .count-overview {
    align-items: flex-start;
  }
}
@media (prefers-reduced-motion: reduce) {
  .inline-count-input {
    transition: none;
  }
}
</style>
