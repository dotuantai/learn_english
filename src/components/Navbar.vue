<script setup>
import AppIcon from './AppIcon.vue'
defineProps({
  studying: Boolean,
  currentMode: { type: String, required: true },
  masteredCount: { type: Number, default: 0 },
  totalWords: { type: Number, default: 0 },
  user: { type: Object, default: null },
})
defineEmits(['change-mode', 'login', 'logout'])
const items = [
  { id: 'home', label: 'Tổng quan', icon: 'home' },
  { id: 'lessons', label: 'Bài học', icon: 'book' },
  { id: 'flashcard', label: 'Flashcards', icon: 'cards' },
  { id: 'quiz', label: 'Trắc nghiệm', icon: 'quiz' },
  { id: 'list', label: 'Từ vựng', icon: 'search' },
]
</script>
<template>
  <aside class="sidebar clay-card">
    <a class="brand" href="#home" aria-label="MyHoa — Tổng quan"
      ><span class="brand-mark"><img src="/logo.svg" alt="Logo MyHoa" width="48" height="48" /></span
      ><span
        ><strong>My<span>Hoa</span></strong
        ><small>HỌC NHẸ NHÀNG, NHỚ THẬT LÂU</small></span
      ></a
    >
    <span class="sidebar-label">GÓC HỌC TẬP</span>
    <nav class="primary-nav" aria-label="Điều hướng chính">
      <button
        v-for="item in items"
        :key="item.id"
        :id="`tab-${item.id}`"
        :class="['nav-item', { active: currentMode === item.id }]"
        :aria-current="currentMode === item.id ? 'page' : undefined"
        @click="$emit('change-mode', item.id)"
      >
        <AppIcon :name="item.icon" /><span>{{ item.label }}</span
        ><span v-if="item.id === 'list'" class="nav-count">{{
          totalWords
        }}</span>
      </button>
    </nav>
    <div class="sidebar-bottom">
      <div class="little-reminder">
        <span class="reminder-orb"><AppIcon name="leaf" :size="26" /></span>
        <h3>Chậm mà chắc.</h3>
        <p>Mỗi từ bạn học hôm nay<br />là một bước tiến nhỏ.</p>
        <span class="reminder-dots" aria-hidden="true"
          ><i></i><i></i><i></i
        ></span>
      </div>
      <div class="sidebar-progress">
        <span class="mini-avatar"><AppIcon name="book" :size="21" /></span>
        <div>
          <strong>Hành trình của bạn</strong
          ><small>{{ masteredCount }}/{{ totalWords }} từ đã thuộc</small>
        </div>
        <AppIcon name="sparkles" :size="17" />
      </div>
      <div v-if="user" class="sidebar-auth signed-in">
        <span class="account-avatar"><AppIcon name="user" :size="18" /></span>
        <div><small>ĐANG ĐỒNG BỘ</small><strong :title="user.email">{{ user.email }}</strong></div>
        <button type="button" aria-label="Đăng xuất" title="Đăng xuất" @click="$emit('logout')">
          <AppIcon name="logout" :size="18" />
        </button>
      </div>
      <button v-else class="sidebar-auth sign-in" type="button" @click="$emit('login')">
        <span class="account-avatar"><AppIcon name="user" :size="18" /></span>
        <span><strong>Đăng nhập</strong><small>Đồng bộ tiến độ học</small></span>
        <AppIcon name="arrow" :size="17" />
      </button>
    </div>
  </aside>
  <header class="mobile-header">
    <a class="brand" href="#home" aria-label="MyHoa — Tổng quan"
      ><span class="brand-mark"><img src="/logo.svg" alt="Logo MyHoa" width="48" height="48" /></span
      ><strong>My<span>Hoa</span></strong></a
    ><div class="mobile-actions">
      <span class="badge"><AppIcon name="star" :size="16" />{{ masteredCount }}/{{ totalWords }} từ</span>
      <button
        type="button"
        :aria-label="user ? 'Đăng xuất' : 'Đăng nhập'"
        class="mobile-auth-button"
        @click="$emit(user ? 'logout' : 'login')"
      ><AppIcon :name="user ? 'logout' : 'user'" :size="18" /></button>
    </div>
  </header>
  <nav v-if="!studying" class="mobile-nav clay-card" aria-label="Điều hướng di động">
    <button
      v-for="item in items"
      :key="item.id"
      :class="{ active: currentMode === item.id }"
      :aria-current="currentMode === item.id ? 'page' : undefined"
      @click="$emit('change-mode', item.id)"
    >
      <AppIcon :name="item.icon" :size="21" /><span>{{ item.label }}</span>
    </button>
  </nav>
</template>
<style scoped>
.sidebar {
  position: fixed;
  inset: 24px auto 24px 24px;
  width: 244px;
  z-index: 20;
  padding: 30px 18px 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-width: none;
}
.sidebar::-webkit-scrollbar {
  display: none;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-main);
  text-decoration: none;
}
.sidebar .brand {
  padding: 0 8px;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.brand-mark img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 3px 4px rgb(75 45 106 / 12%));
}
.brand strong {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: -0.06em;
}
.brand strong span {
  color: var(--primary);
}
.brand small {
  display: block;
  font-size: 0.44rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  margin-top: 3px;
  color: var(--text-muted);
}
.sidebar-label {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: var(--text-muted);
  margin: 45px 18px 14px;
}
.primary-nav {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  min-height: 54px;
  padding: 12px 17px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  text-align: left;
  border-radius: 20px;
}
.nav-item.active {
  color: var(--primary-dark);
  background: linear-gradient(130deg, #f2eaff, #e8dcfb);
  box-shadow:
    4px 4px 10px #dcd2ea80,
    -3px -3px 8px #ffffff,
    inset 2px 2px 3px #ffffffb3,
    inset -2px -2px 5px #bda4e930;
}
.nav-item:hover {
  background-color: var(--primary-bg);
  color: var(--primary);
}
.nav-count {
  margin-left: auto;
  padding: 3px 8px;
  background: #eae5f0;
  color: var(--text-muted);
  border-radius: 20px;
  font-size: 0.68rem;
}
.sidebar-bottom {
  margin-top: auto;
  padding-top: 42px;
}
.little-reminder {
  position: relative;
  text-align: center;
  padding: 43px 10px 20px;
  border-radius: 28px;
  background: linear-gradient(140deg, #eee7fa, #f4edf9);
  box-shadow:
    inset 2px 2px 6px #dacfea60,
    inset -3px -3px 8px #ffffff;
}
.reminder-orb {
  position: absolute;
  top: -23px;
  left: calc(50% - 26px);
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  color: #527d65;
  border-radius: 22px;
  transform: rotate(-10deg);
  background: linear-gradient(135deg, #d8f3e1, #aad6bc);
  box-shadow: var(--shadow-orb);
}
.little-reminder h3 {
  font-size: 1rem;
  margin-bottom: 5px;
}
.little-reminder p {
  font-size: 0.73rem;
  line-height: 1.8;
  color: var(--text-muted);
}
.reminder-dots {
  display: flex;
  gap: 5px;
  justify-content: center;
  margin-top: 16px;
}
.reminder-dots i {
  width: 5px;
  height: 5px;
  background: #c5b6dd;
  border-radius: 50%;
}
.reminder-dots i:first-child {
  width: 17px;
  background: #9870cb;
}
.sidebar-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 23px 2px 0;
}
.sidebar-progress strong {
  display: block;
  font-size: 0.75rem;
}
.sidebar-progress small {
  display: block;
  margin-top: 3px;
  font-size: 0.66rem;
  color: var(--text-muted);
}
.sidebar-progress > .app-icon {
  margin-left: auto;
  color: var(--primary);
}
.sidebar-auth {
  width: 100%;
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding: 9px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 19px;
  color: var(--text-main);
  background: #f8f4fb;
}
.sidebar-auth.sign-in {
  text-align: left;
}
.sidebar-auth.sign-in:hover {
  color: var(--primary-dark);
  background: var(--primary-bg);
}
.account-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: var(--primary-dark);
  background: #e8ddf7;
  border-radius: 14px;
}
.sidebar-auth div,
.sidebar-auth.sign-in > span:nth-child(2) {
  min-width: 0;
  flex: 1;
}
.sidebar-auth strong,
.sidebar-auth small {
  display: block;
}
.sidebar-auth strong {
  overflow: hidden;
  font-size: 0.7rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-auth small {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 0.53rem;
}
.sidebar-auth.signed-in small {
  color: var(--success);
  font-weight: 900;
  letter-spacing: 0.06em;
}
.sidebar-auth.signed-in > button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 0;
  border-radius: 14px;
  color: var(--text-muted);
  background: transparent;
}
.sidebar-auth.signed-in > button:hover {
  color: var(--danger);
  background: var(--danger-bg);
}
.mini-avatar {
  display: grid;
  place-items: center;
  width: 39px;
  height: 42px;
  border-radius: 17px;
  background: #e9dff8;
  color: var(--primary);
}
.mobile-header,
.mobile-nav {
  display: none;
}
.mobile-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}
.mobile-auth-button {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  color: var(--primary-dark);
  background: #f8f3ff;
  box-shadow: var(--shadow-orb);
}
@media (max-width: 1100px) and (min-width: 769px) {
  .sidebar {
    width: 210px;
    left: 16px;
    padding-inline: 12px;
  }
  .brand strong {
    font-size: 1.25rem;
  }
  .brand small {
    font-size: 0.39rem;
  }
  .sidebar-label {
    margin-top: 35px;
  }
}
@media (max-height: 750px) and (min-width: 769px) {
  .sidebar {
    padding-top: 22px;
  }
  .sidebar-label {
    margin-top: 25px;
  }
  .little-reminder {
    padding-bottom: 12px;
  }
  .reminder-dots {
    display: none;
  }
  .sidebar-bottom {
    padding-top: 35px;
  }
}
@media (max-height: 850px) and (min-width: 769px) {
  .little-reminder {
    display: none;
  }
  .sidebar-bottom {
    padding-top: 20px;
  }
}
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 21px 20px 8px;
  }
  .mobile-nav {
    position: fixed;
    display: flex;
    justify-content: space-around;
    z-index: 30;
    bottom: max(12px, env(safe-area-inset-bottom));
    left: 12px;
    right: 12px;
    padding: 8px 5px;
    background: #faf7ffed;
    border-radius: 26px;
  }
  .mobile-nav button {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    padding: 8px 2px;
    border-radius: 20px;
    font-size: 0.58rem;
  }
  .mobile-nav button.active {
    background: #eae0f9;
    color: var(--primary-dark);
  }
  .mobile-header .badge {
    font-size: 0.7rem;
  }
  .mobile-header .brand strong {
    font-size: 1.3rem;
  }
}
</style>
