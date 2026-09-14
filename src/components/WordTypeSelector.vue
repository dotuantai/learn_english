<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { TYPE_OPTIONS, matchesTypeFilter } from '../utils/typeFilter'

const props = defineProps({
  modelValue: { type: String, default: 'all' },
  words: { type: Array, required: true },
})
defineEmits(['update:modelValue'])
const options = computed(() => TYPE_OPTIONS.map((type) => ({
  ...type,
  count: props.words.filter((word) => matchesTypeFilter(word.type, type.value)).length,
})))
</script>

<template>
  <fieldset class="word-type-selector" aria-describedby="word-type-hint">
    <legend>Học theo từ loại</legend>
    <p class="type-description">Tập trung vào một nhóm từ, hoặc ôn tập tất cả.</p>
    <div class="type-options">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :class="['type-option', { selected: modelValue === option.value }]"
        :aria-pressed="modelValue === option.value"
        :disabled="option.count === 0 && option.value !== 'all'"
        @click="$emit('update:modelValue', option.value)"
      >
        <span class="type-option-top" aria-hidden="true">
          <span class="type-abbreviation">{{ option.abbreviation }}</span>
          <span class="type-check"><AppIcon v-if="modelValue === option.value" name="check" :size="12" /></span>
        </span>
        <strong>{{ option.title }}</strong>
        <span class="type-count">{{ option.count }} từ</span>
      </button>
    </div>
    <p id="word-type-hint" class="type-hint">
      Từ có nhiều từ loại được xếp vào các nhóm tương ứng. Cụm danh từ, động từ
      và tính từ cũng nằm trong nhóm đó.
    </p>
  </fieldset>
</template>

<style scoped>
.word-type-selector {
  min-width: 0;
  border: 0;
  margin-top: 25px;
}
legend {
  font: 800 0.95rem var(--font-heading);
}
.type-description,
.type-hint {
  font-size: 0.74rem;
  color: var(--text-muted);
  line-height: 1.7;
}
.type-description {
  margin-top: 7px;
}
.type-hint {
  margin-top: 12px;
  font-size: 0.69rem;
}
.type-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 15px;
}
.type-option {
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  text-align: left;
  background: var(--bg-card);
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.type-option:not(:disabled):hover,
.type-option:not(:disabled):active {
  transform: none;
  border-color: var(--primary-light);
  background: var(--bg-card-hover);
}
.type-option.selected {
  border-color: var(--primary-light);
  background: var(--primary-bg);
  box-shadow: inset 2px 2px 5px #d9c9eb66, inset -2px -2px 5px #fff;
}
.type-option-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}
.type-abbreviation {
  color: var(--primary-dark);
  font-size: 0.84rem;
}
.type-check {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-medium);
  border-radius: 50%;
}
.selected .type-check {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
}
.type-option strong,
.type-count {
  display: block;
}
.type-option strong {
  font-size: 0.8rem;
}
.type-count {
  margin-top: 2px;
  font: 400 0.7rem var(--font-family);
  color: var(--text-muted);
}
@media (max-width: 600px) {
  .type-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
