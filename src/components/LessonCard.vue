<script setup>
import AppIcon from './AppIcon.vue'
defineProps({ lesson: { type: Object, required: true }, recommended: Boolean })
defineEmits(['select'])
</script>
<template>
  <button
    :class="['lesson-card clay-card', lesson.color]"
    @click="$emit('select', lesson.id)"
  >
    <div class="lesson-top">
      <span class="clay-orb"><AppIcon :name="lesson.icon" :size="28" /></span
      ><span class="lesson-number"
        >BÀI {{ String(lesson.number).padStart(2, '0') }}</span
      ><span v-if="lesson.progress === 100" class="lesson-status complete"
        ><AppIcon name="check" :size="14" />Đã thuộc</span
      ><span v-else-if="recommended" class="lesson-status">{{
        lesson.masteredCount ? 'Học tiếp' : 'Gợi ý cho bạn'
      }}</span>
    </div>
    <h3>{{ lesson.title }}</h3>
    <p class="lesson-english">{{ lesson.english }}</p>
    <div class="lesson-meta">
      <span
        ><AppIcon name="cards" :size="15" />{{ lesson.words.length }} từ
        vựng</span
      ><span
        >{{ lesson.masteredCount }}/{{ lesson.words.length }} đã thuộc</span
      >
    </div>
    <div class="lesson-bottom">
      <div class="progress-track">
        <span :style="{ width: `${lesson.progress}%` }"></span>
      </div>
      <span class="lesson-arrow"><AppIcon name="arrow" :size="18" /></span>
    </div>
  </button>
</template>
<style scoped>
.lesson-card {
  padding: 24px 25px 20px;
  text-align: left;
  width: 100%;
  min-width: 0;
  font-family: var(--font-family);
  font-weight: 400;
}
.lesson-card:hover {
  transform: translateY(-5px) !important;
  box-shadow: var(--shadow-lg);
}
.lesson-top {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 20px;
}
.clay-orb {
  width: 47px;
  height: 49px;
  border-radius: 19px;
}
.lesson-number {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  color: var(--text-muted);
}
.lesson-status {
  margin-left: auto;
  color: var(--tone-ink);
  background: var(--tone-bg);
  font: 800 0.61rem var(--font-heading);
  padding: 6px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.complete {
  color: var(--success);
  background: var(--success-bg);
}
.lesson-card h3 {
  font-size: 1.12rem;
  letter-spacing: -0.02em;
}
.lesson-english {
  font-size: 0.73rem;
  color: var(--text-muted);
  margin-top: 5px;
}
.lesson-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 22px;
}
.lesson-meta > span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.lesson-bottom {
  display: flex;
  align-items: center;
  gap: 17px;
  margin-top: 8px;
}
.progress-track {
  flex: 1;
}
.progress-track > span {
  background: var(--tone-dark);
}
.lesson-arrow {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border-radius: 50%;
  color: var(--tone-ink);
  background: var(--tone-bg);
}
@media (max-width: 450px) {
  .lesson-card {
    padding: 21px;
  }
  .lesson-top {
    margin-bottom: 16px;
  }
}
</style>
