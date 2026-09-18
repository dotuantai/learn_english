<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  mode: { type: String, required: true },
  busy: Boolean,
  serverError: { type: String, default: '' },
})
const emit = defineEmits(['submit', 'navigate'])

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const touched = ref({ email: false, password: false, confirmPassword: false })
const errorSummary = ref(null)

const isRegister = computed(() => props.mode === 'register')
const title = computed(() =>
  isRegister.value ? 'Bắt đầu hành trình của bạn' : 'Chào mừng bạn trở lại',
)
const emailError = computed(() => {
  if (!touched.value.email) return ''
  if (!email.value.trim()) return 'Vui lòng nhập email.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    ? ''
    : 'Email chưa đúng định dạng.'
})
const passwordError = computed(() => {
  if (!touched.value.password) return ''
  if (!password.value) return 'Vui lòng nhập mật khẩu.'
  if (isRegister.value && password.value.length < 6)
    return 'Mật khẩu cần ít nhất 6 ký tự.'
  if (
    isRegister.value &&
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password.value)
  )
    return 'Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt.'
  return ''
})
const confirmError = computed(() => {
  if (!isRegister.value || !touched.value.confirmPassword) return ''
  if (!confirmPassword.value) return 'Vui lòng nhập lại mật khẩu.'
  return confirmPassword.value === password.value
    ? ''
    : 'Mật khẩu nhập lại chưa khớp.'
})

watch(
  () => props.mode,
  () => {
    password.value = ''
    confirmPassword.value = ''
    touched.value = { email: false, password: false, confirmPassword: false }
  },
)

async function submit() {
  touched.value = { email: true, password: true, confirmPassword: true }
  if (emailError.value || passwordError.value || confirmError.value) {
    await nextTick()
    errorSummary.value?.focus()
    return
  }

  emit('submit', { email: email.value.trim(), password: password.value })
}
</script>

<template>
  <main class="auth-page">
    <a class="auth-home-link" href="#home">
      <AppIcon name="back" :size="18" />Về không gian học
    </a>
    <section class="auth-card clay-card" aria-labelledby="auth-title">
      <div class="auth-story">
        <a class="auth-brand" href="#home" aria-label="MyHoa — Trang tổng quan">
          <img src="/logo.svg" alt="" width="62" height="62" />
          <span><strong>My<span>Hoa</span></strong><small>HỌC NHẸ NHÀNG, NHỚ THẬT LÂU</small></span>
        </a>
        <div class="auth-story-copy">
          <span class="eyebrow">MỖI NGÀY MỘT CHÚT</span>
          <h2>Ghi nhớ từ mới.<br />Giữ trọn nhịp học.</h2>
          <p>
            Đăng nhập để đồng bộ những từ đã thuộc và tiếp tục hành trình trên
            bất kỳ thiết bị nào.
          </p>
          <ul>
            <li><span><AppIcon name="check" :size="16" /></span>Tiến độ được lưu theo tài khoản</li>
            <li><span><AppIcon name="cards" :size="16" /></span>Flashcards và quiz luôn sẵn sàng</li>
            <li><span><AppIcon name="shield" :size="16" /></span>Mật khẩu được bảo vệ an toàn</li>
          </ul>
        </div>
        <div class="auth-decoration" aria-hidden="true"><i></i><i></i><i></i></div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-heading">
          <span class="clay-orb violet"><AppIcon name="user" :size="26" /></span>
          <div>
            <span class="eyebrow">{{ isRegister ? 'TẠO TÀI KHOẢN' : 'ĐĂNG NHẬP' }}</span>
            <h1 id="auth-title">{{ title }}</h1>
          </div>
        </div>
        <p class="auth-intro">
          {{ isRegister
            ? 'Chỉ cần email và mật khẩu để lưu lại tiến độ học.'
            : 'Tiếp tục đúng nơi bạn đã dừng lại.' }}
        </p>

        <p
          v-if="serverError"
          ref="errorSummary"
          class="auth-alert"
          role="alert"
          tabindex="-1"
        >
          <AppIcon name="alert" :size="18" />{{ serverError }}
        </p>

        <form novalidate @submit.prevent="submit">
          <div class="form-field">
            <label for="auth-email">Email <span aria-hidden="true">*</span></label>
            <div class="input-shell" :class="{ invalid: emailError }">
              <AppIcon name="mail" :size="19" />
              <input
                id="auth-email"
                v-model="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="ban@example.com"
                :aria-invalid="Boolean(emailError)"
                :aria-describedby="emailError ? 'email-error' : undefined"
                :disabled="busy"
                @blur="touched.email = true"
              />
            </div>
            <small v-if="emailError" id="email-error" class="field-error">{{ emailError }}</small>
          </div>

          <div class="form-field">
            <label for="auth-password">Mật khẩu <span aria-hidden="true">*</span></label>
            <div class="input-shell" :class="{ invalid: passwordError }">
              <AppIcon name="lock" :size="19" />
              <input
                id="auth-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="isRegister ? 'new-password' : 'current-password'"
                :placeholder="isRegister ? 'Ví dụ: MyHoa1!' : 'Nhập mật khẩu'"
                :aria-invalid="Boolean(passwordError)"
                :aria-describedby="passwordError ? 'password-error' : undefined"
                :disabled="busy"
                @blur="touched.password = true"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                :aria-pressed="showPassword"
                :disabled="busy"
                @click="showPassword = !showPassword"
              >
                <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="19" />
              </button>
            </div>
            <small v-if="passwordError" id="password-error" class="field-error">{{ passwordError }}</small>
            <small v-else-if="isRegister" class="field-hint">Ít nhất 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</small>
          </div>

          <div v-if="isRegister" class="form-field">
            <label for="auth-confirm">Nhập lại mật khẩu <span aria-hidden="true">*</span></label>
            <div class="input-shell" :class="{ invalid: confirmError }">
              <AppIcon name="lock" :size="19" />
              <input
                id="auth-confirm"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Nhập lại mật khẩu"
                :aria-invalid="Boolean(confirmError)"
                :aria-describedby="confirmError ? 'confirm-error' : undefined"
                :disabled="busy"
                @blur="touched.confirmPassword = true"
              />
            </div>
            <small v-if="confirmError" id="confirm-error" class="field-error">{{ confirmError }}</small>
          </div>

          <button class="btn btn-primary auth-submit" type="submit" :disabled="busy">
            <span v-if="busy" class="button-spinner" aria-hidden="true"></span>
            <AppIcon v-else :name="isRegister ? 'sparkles' : 'arrow'" :size="19" />
            {{ busy ? 'Đang xử lý…' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập' }}
          </button>
        </form>

        <p class="auth-switch">
          {{ isRegister ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?' }}
          <button type="button" @click="emit('navigate', isRegister ? 'login' : 'register')">
            {{ isRegister ? 'Đăng nhập' : 'Đăng ký miễn phí' }}
          </button>
        </p>
        <p class="auth-note"><AppIcon name="shield" :size="15" />Bạn vẫn có thể học mà không cần đăng nhập.</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 70px 28px 40px;
  position: relative;
}
.auth-home-link {
  position: absolute;
  top: 24px;
  left: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  color: var(--text-muted);
  font-family: var(--font-heading);
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
  border-radius: 16px;
}
.auth-home-link:hover { color: var(--primary); background: var(--primary-bg); }
.auth-card {
  width: min(1040px, 100%);
  min-height: 650px;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(300px, 0.9fr) minmax(420px, 1.1fr);
  border-radius: 40px;
}
.auth-story {
  position: relative;
  overflow: hidden;
  padding: 45px 48px;
  background:
    radial-gradient(circle at 12% 12%, #ffffffb8 0 8%, transparent 9%),
    linear-gradient(145deg, #eee5fc, #e5d6f7 55%, #d9eaf4);
  border-right: 1px solid #ffffffc7;
}
.auth-brand { display: inline-flex; align-items: center; gap: 12px; color: var(--text-main); text-decoration: none; }
.auth-brand img { filter: drop-shadow(0 5px 7px rgb(75 45 106 / 14%)); }
.auth-brand strong { display: block; font-size: 1.55rem; font-weight: 900; letter-spacing: -0.06em; }
.auth-brand strong span { color: var(--primary); }
.auth-brand small { display: block; margin-top: 2px; color: var(--text-muted); font-size: 0.46rem; font-weight: 900; letter-spacing: 0.08em; }
.auth-story-copy { position: relative; z-index: 1; margin-top: 92px; }
.auth-story-copy h2 { margin-top: 12px; font-size: clamp(2rem, 3.4vw, 2.7rem); letter-spacing: -0.055em; }
.auth-story-copy > p { max-width: 360px; margin-top: 20px; color: var(--text-muted); font-size: 0.88rem; line-height: 1.85; }
.auth-story-copy ul { list-style: none; display: grid; gap: 14px; margin-top: 34px; }
.auth-story-copy li { display: flex; align-items: center; gap: 12px; color: #4d4655; font-size: 0.8rem; font-weight: 700; }
.auth-story-copy li > span { width: 34px; height: 34px; display: grid; place-items: center; flex: 0 0 auto; color: var(--primary-dark); background: #f8f3ffb8; border-radius: 14px; box-shadow: var(--shadow-orb); }
.auth-decoration i { position: absolute; border-radius: 50%; filter: blur(1px); background: #fff6; }
.auth-decoration i:first-child { width: 190px; height: 190px; right: -75px; bottom: -60px; }
.auth-decoration i:nth-child(2) { width: 85px; height: 85px; right: 35px; bottom: 75px; background: #8b5cf61c; }
.auth-decoration i:last-child { width: 18px; height: 18px; right: 78px; top: 160px; background: #ec489944; }
.auth-form-panel { padding: 64px clamp(40px, 6vw, 78px) 45px; background: #fcfaffd9; }
.auth-heading { display: flex; align-items: center; gap: 16px; }
.auth-heading .clay-orb { width: 56px; height: 56px; border-radius: 21px; }
.auth-heading h1 { margin-top: 4px; font-size: clamp(1.7rem, 2.7vw, 2.2rem); letter-spacing: -0.04em; }
.auth-intro { margin: 18px 0 25px; color: var(--text-muted); font-size: 0.82rem; }
.auth-alert { display: flex; align-items: flex-start; gap: 9px; padding: 12px 15px; margin-bottom: 18px; color: var(--danger); background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius: 16px; font-size: 0.76rem; }
form { display: grid; gap: 18px; }
.form-field { display: grid; gap: 7px; }
.form-field label { font-size: 0.75rem; color: #4a4450; }
.form-field label span { color: var(--danger); }
.input-shell { display: flex; align-items: center; gap: 11px; min-height: 54px; padding: 0 15px; color: #756c7e; background: #f5f1f8; border: 1px solid var(--border-subtle); border-radius: 18px; box-shadow: inset 3px 3px 8px #d9d2df8c, inset -3px -3px 8px #fff; transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease; }
.input-shell:focus-within { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 3px var(--primary-glow), inset 2px 2px 5px #e7e0ed; }
.input-shell.invalid { border-color: var(--danger); background: var(--danger-bg); }
.input-shell input { min-width: 0; flex: 1; height: 50px; border: 0; outline: 0; background: transparent; color: var(--text-main); font-size: 0.86rem; }
.input-shell input::placeholder { color: #827a89; opacity: 1; }
.password-toggle { width: 42px; height: 42px; display: grid; place-items: center; flex: 0 0 auto; border: 0; border-radius: 14px; background: transparent; color: var(--text-muted); }
.password-toggle:hover { background: var(--primary-bg); color: var(--primary); }
.field-error { color: var(--danger); font-size: 0.7rem; font-weight: 700; }
.field-hint { color: var(--text-muted); font-size: 0.66rem; }
.auth-submit { width: 100%; margin-top: 3px; }
.button-spinner { width: 18px; height: 18px; border: 2px solid #ffffff66; border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
.auth-switch { margin-top: 24px; text-align: center; color: var(--text-muted); font-size: 0.76rem; }
.auth-switch button { min-height: 44px; padding: 5px; border: 0; background: transparent; color: var(--primary-dark); font-size: inherit; }
.auth-note { display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-muted); font-size: 0.68rem; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 800px) {
  .auth-page { padding: 72px 18px 30px; place-items: start center; }
  .auth-home-link { top: 14px; left: 16px; }
  .auth-card { min-height: 0; grid-template-columns: 1fr; border-radius: 32px; }
  .auth-story { padding: 26px 30px; border-right: 0; border-bottom: 1px solid #ffffffc7; }
  .auth-story-copy { margin-top: 34px; }
  .auth-story-copy h2 { font-size: 1.8rem; }
  .auth-story-copy > p, .auth-story-copy ul { display: none; }
  .auth-form-panel { padding: 34px 28px 30px; }
}
@media (max-width: 420px) {
  .auth-page { padding-inline: 12px; }
  .auth-story { padding: 22px; }
  .auth-story-copy { margin-top: 24px; }
  .auth-brand small { display: none; }
  .auth-form-panel { padding: 28px 20px 25px; }
  .auth-heading h1 { font-size: 1.55rem; }
}
</style>
