<script setup>
defineProps({
  currentMode: {
    type: String,
    required: true
  },
  masteredCount: {
    type: Number,
    default: 0
  },
  totalWords: {
    type: Number,
    default: 52
  }
})

defineEmits(['change-mode'])
</script>

<template>
  <div>
    <!-- Desktop & Mobile Top Header -->
    <header class="navbar">
      <div class="nav-container">
        <!-- Brand -->
        <div class="nav-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div class="brand-text">
            <h1 class="brand-title">Medi<span>Vocab</span></h1>
            <span class="brand-badge">52 Từ Y Tế</span>
          </div>
        </div>

        <!-- Desktop Navigation Tabs (Hidden on mobile) -->
        <nav class="nav-tabs-desktop" aria-label="Chế độ học">
          <button
            id="tab-flashcard"
            class="tab-btn"
            :class="{ active: currentMode === 'flashcard' }"
            @click="$emit('change-mode', 'flashcard')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
            </svg>
            <span>Flashcards</span>
          </button>

          <button
            id="tab-quiz"
            class="tab-btn"
            :class="{ active: currentMode === 'quiz' }"
            @click="$emit('change-mode', 'quiz')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Trắc Nghiệm</span>
          </button>

          <button
            id="tab-list"
            class="tab-btn"
            :class="{ active: currentMode === 'list' }"
            @click="$emit('change-mode', 'list')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>Từ Vựng ({{ totalWords }})</span>
          </button>
        </nav>

        <!-- Mastery Pill -->
        <div class="nav-stat">
          <div class="stat-info">
            <span class="stat-label">Đã thuộc:</span>
            <span class="stat-value"><strong>{{ masteredCount }}</strong>/{{ totalWords }}</span>
          </div>
          <div class="stat-bar">
            <div 
              class="stat-bar-fill" 
              :style="{ width: `${(masteredCount / totalWords) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Bottom Navigation Dock (Native App Experience) -->
    <nav class="mobile-bottom-nav" aria-label="Thanh điều hướng di động">
      <button 
        class="mobile-tab-btn" 
        :class="{ active: currentMode === 'flashcard' }"
        @click="$emit('change-mode', 'flashcard')"
      >
        <div class="tab-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
          </svg>
        </div>
        <span class="tab-title">Flashcard</span>
      </button>

      <button 
        class="mobile-tab-btn" 
        :class="{ active: currentMode === 'quiz' }"
        @click="$emit('change-mode', 'quiz')"
      >
        <div class="tab-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <span class="tab-title">Trắc Nghiệm</span>
      </button>

      <button 
        class="mobile-tab-btn" 
        :class="{ active: currentMode === 'list' }"
        @click="$emit('change-mode', 'list')"
      >
        <div class="tab-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </div>
        <span class="tab-title">Từ Vựng ({{ totalWords }})</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid var(--border-subtle);
  padding: 12px 20px;
  box-shadow: var(--shadow-xs);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary-bg);
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
  margin: 0;
  line-height: 1.1;
}

.brand-title span {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary);
  background: var(--primary-bg);
  padding: 1px 8px;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

/* Desktop Navigation */
.nav-tabs-desktop {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  gap: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.6);
}

.tab-btn.active {
  color: var(--primary-dark);
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-weight: 700;
}

.nav-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
}

.stat-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-info strong {
  color: var(--primary);
  font-size: 0.92rem;
}

.stat-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #0284c7);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Mobile Bottom Navigation (Hidden on Desktop) */
.mobile-bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .nav-tabs-desktop {
    display: none;
  }

  .navbar {
    padding: 10px 16px;
  }

  .nav-stat {
    min-width: 100px;
  }

  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 999;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border-subtle);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
    padding: 6px 12px calc(6px + env(safe-area-inset-bottom, 0px));
    justify-content: space-around;
  }

  .mobile-tab-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 6px 4px;
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.2s;
  }

  .mobile-tab-btn.active {
    color: var(--primary);
  }

  .mobile-tab-btn .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 30px;
    border-radius: 16px;
    transition: background 0.2s;
  }

  .mobile-tab-btn.active .tab-icon {
    background: var(--primary-bg);
  }

  .mobile-tab-btn .tab-title {
    font-size: 0.72rem;
    font-weight: 700;
  }
}
</style>
