<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  modelValue: { type: String, default: 'en_vi' },
  sessionControl: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const directions = [
  { value: 'en_vi', label: 'Anh → Việt' },
  { value: 'vi_en', label: 'Việt → Anh' },
]
</script>

<template>
  <fieldset class="flashcard-direction">
    <legend>Chiều học flashcards</legend>
    <div class="direction-options">
      <button
        v-for="direction in directions"
        :key="direction.value"
        type="button"
        :class="[
          'direction-option',
          { selected: modelValue === direction.value },
        ]"
        :aria-pressed="modelValue === direction.value"
        @click="$emit('update:modelValue', direction.value)"
      >
        <span>{{ direction.label }}</span>
        <AppIcon
          name="check"
          :size="16"
          :class="{ 'inactive-check': modelValue !== direction.value }"
        />
      </button>
    </div>
    <p>
      {{ modelValue === 'vi_en'
        ? 'Xem nghĩa tiếng Việt, gõ từ tiếng Anh.'
        : 'Xem từ tiếng Anh, gõ nghĩa tiếng Việt.' }}
      <span v-if="sessionControl">Đổi chiều học sẽ bắt đầu lại lượt luyện tập.</span>
    </p>
  </fieldset>
</template>

<style scoped>
.flashcard-direction {
  min-width: 0;
  border: 0;
  margin-bottom: 22px;
}
.flashcard-direction legend {
  margin-bottom: 10px;
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 800;
}
.direction-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
  border-radius: 24px;
  background: var(--bg-surface);
  box-shadow: var(--shadow-pressed);
}
.direction-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 19px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.direction-option.selected {
  border-color: #d6bee9;
  background: var(--card-gradient);
  color: var(--primary-dark);
  box-shadow: var(--shadow-card);
}
.direction-option:hover {
  background: var(--primary-bg);
  transform: none;
}
.direction-option:active {
  transform: none;
}
.inactive-check {
  visibility: hidden;
}
.flashcard-direction p {
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.7;
}
.flashcard-direction p span {
  display: block;
}
</style>
