<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
const props = defineProps({
  quizType: { type: String, default: 'en_vi' },
  questionCount: { type: Number, default: 10 },
  wordCount: { type: Number, required: true },
})
defineEmits(['update:quizType', 'update:questionCount'])
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
const counts = computed(() => [
  ...new Set(
    [10, 20].filter((count) => count < props.wordCount).concat(props.wordCount),
  ),
])
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
    <fieldset>
      <legend>Số lượng câu hỏi</legend>
      <div class="quiz-counts">
        <button
          v-for="count in counts"
          :key="count"
          :class="{ selected: questionCount === count }"
          :aria-pressed="questionCount === count"
          @click="$emit('update:questionCount', count)"
        >
          {{ count === wordCount ? `Tất cả ${count} câu` : `${count} câu` }}
        </button>
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
.quiz-type.selected,
.quiz-counts .selected {
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
.quiz-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.quiz-counts button {
  min-height: 46px;
  padding: 9px 22px;
  font-size: 0.82rem;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  background: #f8f4fc;
  color: var(--text-muted);
}
@media (max-width: 600px) {
  .quiz-types {
    grid-template-columns: 1fr;
  }
  .quiz-type {
    min-height: 77px;
  }
}
</style>
