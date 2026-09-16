<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import {
  STUDY_STATUS_OPTIONS,
  filterByStudyStatus,
} from '../utils/studyStatus'

const props = defineProps({
  modelValue: { type: String, default: 'all' },
  words: { type: Array, required: true },
  masteredIds: { type: Array, default: () => [] },
})

defineEmits(['update:modelValue'])

const options = computed(() =>
  STUDY_STATUS_OPTIONS.map((option) => ({
    ...option,
    count: filterByStudyStatus(
      props.words,
      option.value,
      props.masteredIds,
    ).length,
  })),
)
</script>

<template>
  <fieldset class="study-status-selector">
    <legend>Nhóm từ muốn học</legend>
    <p class="status-description">
      Chọn học từ cần ôn hoặc luyện lại riêng những từ đã thuộc.
    </p>
    <div class="status-options">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :class="['status-option', { selected: modelValue === option.value }]"
        :aria-pressed="modelValue === option.value"
        :disabled="option.count === 0 && option.value !== 'all'"
        @click="$emit('update:modelValue', option.value)"
      >
        <span class="status-icon" aria-hidden="true">
          <AppIcon :name="option.icon" :size="20" />
        </span>
        <span class="status-copy">
          <strong>{{ option.title }}</strong>
          <small>{{ option.description }}</small>
        </span>
        <span class="status-count">{{ option.count }} từ</span>
        <span class="status-check" aria-hidden="true">
          <AppIcon
            v-if="modelValue === option.value"
            name="check"
            :size="12"
          />
        </span>
      </button>
    </div>
  </fieldset>
</template>

<style scoped>
.study-status-selector {
  min-width: 0;
  margin-top: 25px;
  padding-top: 25px;
  border: 0;
  border-top: 1px solid var(--border-subtle);
}
legend {
  font: 800 0.95rem var(--font-heading);
}
.status-description {
  margin-top: 7px;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.7;
}
.status-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 15px;
}
.status-option {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 5px 10px;
  min-width: 0;
  min-height: 96px;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 21px;
  color: var(--text-muted);
  background: var(--bg-card);
  text-align: left;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.status-option:not(:disabled):hover,
.status-option:not(:disabled):active {
  transform: none;
  border-color: var(--primary-light);
  background: var(--bg-card-hover);
}
.status-option.selected {
  border-color: var(--primary-light);
  color: var(--primary-dark);
  background: var(--primary-bg);
  box-shadow:
    inset 2px 2px 5px #d9c9eb66,
    inset -2px -2px 5px #fff;
}
.status-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 14px;
  color: var(--primary-dark);
  background: #eee4f8;
}
.status-copy {
  min-width: 0;
}
.status-copy strong,
.status-copy small {
  display: block;
}
.status-copy strong {
  color: var(--text-main);
  font-size: 0.8rem;
}
.status-copy small {
  margin-top: 3px;
  font: 400 0.66rem/1.45 var(--font-family);
  color: var(--text-muted);
}
.status-count {
  grid-column: 2;
  font-size: 0.69rem;
  font-weight: 800;
}
.status-check {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-medium);
  border-radius: 50%;
}
.selected .status-check {
  border-color: var(--primary);
  color: var(--text-inverse);
  background: var(--primary);
}
@media (max-width: 600px) {
  .status-options {
    grid-template-columns: 1fr;
  }
  .status-option {
    min-height: 82px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .status-option {
    transition: none;
  }
}
</style>
