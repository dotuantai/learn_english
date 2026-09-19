<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  toast: { type: Object, default: null },
})

defineEmits(['action', 'close'])

const tone = computed(() => ['success', 'warning', 'error', 'info'].includes(props.toast?.tone)
  ? props.toast.tone
  : 'info')

const icon = computed(() => ({
  success: 'check',
  warning: 'alert',
  error: 'alert',
  info: 'info',
})[tone.value])

const title = computed(() => props.toast?.title || ({
  success: 'Đã cập nhật',
  warning: 'Cần chú ý',
  error: 'Có lỗi xảy ra',
  info: 'Thông báo',
})[tone.value])

const liveRole = computed(() => ['warning', 'error'].includes(tone.value) ? 'alert' : 'status')
const liveMode = computed(() => liveRole.value === 'alert' ? 'assertive' : 'polite')
</script>

<template>
  <Teleport to="body">
    <div class="toast-region" aria-label="Thông báo ứng dụng">
      <Transition name="toast">
        <section
          v-if="toast"
          :key="toast.id"
          class="app-toast"
          :class="`app-toast--${tone}`"
          :role="liveRole"
          :aria-live="liveMode"
          aria-atomic="true"
        >
          <span class="toast-icon" aria-hidden="true">
            <AppIcon :name="icon" :size="20" />
          </span>

          <div class="toast-content">
            <strong>{{ title }}</strong>
            <p>{{ toast.message }}</p>
            <button
              v-if="toast.actionLabel"
              type="button"
              class="toast-action"
              @click="$emit('action')"
            >
              {{ toast.actionLabel }}
            </button>
          </div>

          <button
            type="button"
            class="toast-close"
            aria-label="Đóng thông báo"
            @click="$emit('close')"
          >
            <AppIcon name="close" :size="18" />
          </button>
        </section>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-region {
  position: fixed;
  z-index: 50;
  top: max(16px, calc(env(safe-area-inset-top) + 12px));
  right: 20px;
  width: min(420px, calc(100vw - 40px));
  pointer-events: none;
}

.app-toast {
  --toast-accent: var(--primary-dark);
  --toast-background: #fbf8ff;
  --toast-border: #ded1ee;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 44px;
  gap: 12px;
  align-items: start;
  padding: 14px 12px 14px 14px;
  border: 1px solid var(--toast-border);
  border-radius: 24px;
  background: var(--toast-background);
  color: var(--text-main);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.app-toast--success {
  --toast-accent: #347a58;
  --toast-background: #f1fbf6;
  --toast-border: #bfe4ce;
}

.app-toast--warning {
  --toast-accent: #936520;
  --toast-background: #fff8e8;
  --toast-border: #ecd5a4;
}

.app-toast--error {
  --toast-accent: #a23f54;
  --toast-background: #fff3f5;
  --toast-border: #efc4cd;
}

.toast-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: #ffffffb8;
  color: var(--toast-accent);
  box-shadow: var(--shadow-orb);
}

.toast-content {
  min-width: 0;
  padding-top: 2px;
}

.toast-content strong {
  display: block;
  color: var(--toast-accent);
  font-family: var(--font-heading);
  font-size: 0.82rem;
  line-height: 1.35;
}

.toast-content p {
  margin-top: 4px;
  color: var(--text-main);
  font-size: 0.76rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.toast-action {
  min-height: 44px;
  margin-top: 10px;
  padding: 9px 16px;
  border: 1px solid color-mix(in srgb, var(--toast-accent) 30%, transparent);
  border-radius: 16px;
  background: #ffffffc9;
  color: var(--toast-accent);
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.toast-action:hover {
  background: #fff;
  box-shadow: var(--shadow-sm);
}

.toast-close {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.toast-close:hover {
  background: #ffffffb8;
  color: var(--text-main);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .toast-region {
    top: max(12px, calc(env(safe-area-inset-top) + 10px));
    right: 12px;
    width: calc(100vw - 24px);
  }

  .app-toast {
    grid-template-columns: 40px minmax(0, 1fr) 44px;
    gap: 10px;
    border-radius: 22px;
  }

  .toast-icon {
    width: 40px;
    height: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
