<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import ClayIllustration from './ClayIllustration.vue'
import LessonCard from './LessonCard.vue'
const props = defineProps({
  lessons: { type: Array, required: true },
  totalWords: { type: Number, required: true },
  masteredCount: { type: Number, required: true },
  lessonsOnly: Boolean,
})
defineEmits(['select-lesson', 'navigate'])
const recommended = computed(
  () =>
    props.lessons.find((lesson) => lesson.progress < 100) || props.lessons[0],
)
const progress = computed(() =>
  props.totalWords
    ? Math.round((props.masteredCount / props.totalWords) * 100)
    : 0,
)
const modes = [
  {
    id: 'flashcard',
    title: 'Học với flashcards',
    description: 'Lật thẻ, nhớ từ từng chút một',
    icon: 'cards',
    color: 'violet',
  },
  {
    id: 'quiz',
    title: 'Thử sức trắc nghiệm',
    description: 'Kiểm tra những điều bạn đã học',
    icon: 'quiz',
    color: 'pink',
  },
  {
    id: 'list',
    title: 'Khám phá từ vựng',
    description: 'Tra nghĩa, nghe và lưu từ đã thuộc',
    icon: 'book',
    color: 'mint',
  },
]
</script>
<template>
  <div class="animate-fade-in">
    <div class="page-heading">
      <div>
        <h1>
          {{
            lessonsOnly ? 'Từng bài nhỏ, tiến bộ lớn.' : 'Hôm nay, mình học gì?'
          }}
        </h1>
        <p>
          {{
            lessonsOnly
              ? 'Chọn bài học, từ loại và cách luyện tập phù hợp với bạn.'
              : 'Một chút mỗi ngày. Thêm một bước tự tin với tiếng Anh.'
          }}
        </p>
      </div>
      <button class="btn btn-secondary" @click="$emit('navigate', 'list')">
        <AppIcon name="search" :size="18" />Tra cứu từ vựng
      </button>
    </div>
    <div v-if="!lessonsOnly" class="dashboard-bento">
      <section class="welcome-card clay-card">
        <div class="welcome-copy">
          <span class="hero-kicker"
            ><span></span>TIẾNG ANH Y TẾ & SỨC KHỎE</span
          >
          <h2>Chăm chút vốn từ.<br /><span>Tự tin chăm sóc.</span></h2>
          <p>
            Những từ vựng gần gũi, những bài học nhỏ.<br
              class="desktop-break"
            />
            Cùng xây nền tảng tiếng Anh vững vàng.
          </p>
          <button
            class="btn btn-primary"
            @click="$emit('select-lesson', recommended.id)"
          >
            {{ masteredCount ? 'Tiếp tục học' : 'Bắt đầu học'
            }}<AppIcon name="arrow" :size="18" /></button
          ><span class="hero-note"
            ><AppIcon name="book" :size="14" />{{ lessons.length }} bài học<span
              >·</span
            >{{ totalWords }} từ vựng<span>·</span>Theo nhịp của bạn</span
          >
        </div>
        <ClayIllustration />
      </section>
      <section class="progress-card clay-card">
        <div class="progress-heading">
          <h2>Tiến độ của bạn</h2>
          <AppIcon name="sparkles" :size="19" />
        </div>
        <div
          class="progress-ring"
          :style="{ '--progress': `${progress}%` }"
          role="progressbar"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Tỷ lệ từ đã thuộc"
        >
          <div>
            <span class="ring-icon"><AppIcon name="leaf" :size="19" /></span
            ><strong>{{ progress }}<small>%</small></strong
            ><span>đã chinh phục</span>
          </div>
        </div>
        <p>
          <strong>{{ masteredCount }}</strong> / {{ totalWords }} từ đã thuộc
        </p>
        <div class="progress-message">
          {{
            progress === 100
              ? 'Bạn đã đi thật xa. Cùng ôn lại nhé!'
              : masteredCount
                ? 'Từng bước nhỏ đang tạo nên khác biệt.'
                : 'Hành trình mới bắt đầu. Bạn làm được!'
          }}
        </div>
      </section>
      <button
        v-for="mode in modes"
        :key="mode.id"
        :class="['mode-card clay-card', mode.color]"
        @click="$emit('navigate', mode.id)"
      >
        <span class="clay-orb"><AppIcon :name="mode.icon" :size="25" /></span
        ><span class="mode-copy"
          ><strong>{{ mode.title }}</strong
          ><small>{{ mode.description }}</small></span
        ><AppIcon name="chevron" :size="17" />
      </button>
    </div>
    <div class="section-heading">
      <div>
        <h2>
          {{ lessonsOnly ? 'Bài học của bạn' : 'Bài học dành cho bạn' }}
          <span class="section-count">{{ lessons.length }}</span>
        </h2>
        <p>{{ lessons.length === 1 ? 'Học và ôn tập trọn bộ từ vựng của Bài 1.' : 'Chọn một bài học để bắt đầu.' }}</p>
      </div>
      <button
        v-if="!lessonsOnly"
        class="text-link"
        @click="$emit('navigate', 'lessons')"
      >
        Tất cả bài học<AppIcon name="arrow" :size="16" /></button
      ><button v-else-if="lessons.length > 1" class="text-link" @click="$emit('select-lesson', 'all')">
        Học toàn bộ {{ totalWords }} từ<AppIcon name="arrow" :size="16" />
      </button>
    </div>
    <div class="lesson-grid" :class="{ 'single-lesson': lessons.length === 1 }">
      <LessonCard
        v-for="lesson in lessons"
        :key="lesson.id"
        :lesson="lesson"
        :recommended="lesson.id === recommended.id"
        @select="$emit('select-lesson', $event)"
      />
    </div>
    <div class="learning-note">
      <AppIcon name="heart" :size="15" /><span
        >Không cần học thật nhiều. Chỉ cần hôm nay học thêm một chút.</span
      >
    </div>
  </div>
</template>
<style scoped>
.dashboard-bento {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 22px;
}
.welcome-card {
  grid-column: span 4;
  position: relative;
  display: flex;
  align-items: center;
  min-height: 312px;
  padding: 31px 32px;
  overflow: hidden;
  border-radius: 36px;
  background: linear-gradient(115deg, #ede3fa 0%, #eee2f6 50%, #f5e2e9 100%);
  box-shadow:
    12px 12px 30px #ad91b626,
    -8px -8px 24px #ffffffcf,
    inset 4px 4px 10px #ffffff88,
    inset -5px -5px 10px #c8acd722;
}
.welcome-copy {
  position: relative;
  z-index: 2;
}
.hero-kicker {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.54rem;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: #6c488b;
}
.hero-kicker > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8b5cc1;
}
.welcome-card h2 {
  font-size: clamp(1.65rem, 2.65vw, 2.6rem);
  letter-spacing: -0.04em;
  line-height: 1.22;
  margin-top: 18px;
}
.welcome-card h2 span {
  color: #8150b7;
}
.welcome-card p {
  font-size: 0.77rem;
  line-height: 1.8;
  color: #665473;
  margin-top: 13px;
}
.welcome-card .btn {
  margin-top: 22px;
  min-height: 49px;
  font-size: 0.8rem;
  padding-inline: 20px;
}
.hero-note {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-top: 18px;
  font-size: 0.58rem;
  color: #665473;
}
.welcome-card :deep(.clay-illustration) {
  position: absolute;
  right: -5px;
  top: calc(50% - 145px);
  transform: scale(0.85);
  transform-origin: right center;
}
.progress-card {
  grid-column: span 2;
  padding: 25px 23px 20px;
  text-align: center;
}
.progress-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.progress-heading h2 {
  font-size: 0.97rem;
}
.progress-heading .app-icon {
  color: #a781c7;
}
.progress-ring {
  width: 151px;
  height: 151px;
  margin: 21px auto 14px;
  border: 6px solid #f6f1fc;
  padding: 10px;
  border-radius: 50%;
  background: conic-gradient(#ac86dc var(--progress), #e9e0f2 0);
  box-shadow:
    5px 7px 13px #c6b9d344,
    -5px -5px 12px #fff,
    inset 2px 2px 4px #c3b2d133,
    inset -2px -2px 4px #fff;
}
.progress-ring > div {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #fffcff, #f3edf9);
  box-shadow:
    inset 3px 4px 8px #bda6d027,
    inset -3px -3px 8px white;
}
.ring-icon {
  color: #9568be;
}
.progress-ring strong {
  font-size: 2.1rem;
  font-weight: 900;
  line-height: 1.2;
}
.progress-ring strong small {
  font-size: 1rem;
}
.progress-ring > div > span:last-child {
  font-size: 0.6rem;
  color: var(--text-muted);
}
.progress-card > p {
  font-size: 0.77rem;
  color: var(--text-muted);
}
.progress-card > p strong {
  font-size: 0.95rem;
  color: var(--primary-dark);
}
.progress-message {
  margin-top: 16px;
  padding: 10px 5px 0;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.61rem;
  color: var(--text-muted);
}
.mode-card {
  grid-column: span 2;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 19px 18px;
  text-align: left;
  border-radius: 26px;
}
.mode-card .clay-orb {
  width: 44px;
  height: 47px;
  border-radius: 18px;
}
.mode-copy {
  flex: 1;
  min-width: 0;
}
.mode-copy strong {
  font-size: 0.8rem;
  font-weight: 900;
  display: block;
}
.mode-copy small {
  font-family: var(--font-family);
  font-weight: 400;
  display: block;
  margin-top: 4px;
  font-size: 0.62rem;
  color: var(--text-muted);
}
.mode-card > .app-icon {
  color: var(--text-muted);
}
.lesson-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}
.lesson-grid.single-lesson {
  grid-template-columns: minmax(0, 1fr);
}
.lesson-grid :deep(.lesson-card) {
  padding: 21px 20px 17px;
}
.lesson-grid :deep(.lesson-top) {
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 11px;
}
.lesson-grid :deep(.lesson-status) {
  margin-left: 0;
}
.lesson-grid :deep(.lesson-card h3) {
  font-size: 1rem;
}
.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  margin-left: 6px;
  vertical-align: middle;
  font-size: 0.72rem;
  background: #e9e0f4;
  color: var(--primary-dark);
  border-radius: 50%;
}
.learning-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 29px 0 0;
  color: var(--text-muted);
  font-size: 0.69rem;
}
@media (min-width: 1600px) {
  .welcome-card :deep(.clay-illustration) {
    right: 20px;
    transform: scale(1);
  }
}
@media (max-width: 1350px) {
  .lesson-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lesson-grid :deep(.lesson-status) {
    margin-left: auto;
  }
  .welcome-card :deep(.clay-illustration) {
    right: -22px;
    transform: scale(0.67);
  }
  .welcome-card {
    padding-inline: 25px;
  }
  .mode-card {
    gap: 10px;
    padding: 17px 13px;
  }
  .mode-card > .app-icon {
    display: none;
  }
  .mode-copy strong {
    font-size: 0.76rem;
  }
  .mode-copy small {
    font-size: 0.59rem;
  }
}
@media (max-width: 1100px) {
  .dashboard-bento {
    gap: 18px;
  }
  .welcome-card {
    grid-column: span 6;
  }
  .welcome-card h2 {
    font-size: 2.4rem;
  }
  .welcome-card :deep(.clay-illustration) {
    right: 15px;
    transform: scale(0.95);
  }
  .progress-card {
    grid-column: span 6;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 14px;
    padding: 18px 24px;
  }
  .progress-ring {
    width: 80px;
    height: 80px;
    padding: 5px;
    border-width: 3px;
    margin: 0;
    order: -1;
  }
  .progress-ring strong {
    font-size: 1.5rem;
  }
  .progress-ring strong small {
    font-size: 0.8rem;
  }
  .ring-icon,
  .progress-ring > div > span:last-child {
    display: none;
  }
  .progress-heading {
    flex: 1;
  }
  .progress-heading > .app-icon {
    display: none;
  }
  .progress-message {
    display: none;
  }
  .mode-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 13px;
    padding: 20px;
  }
  .mode-copy strong {
    font-size: 0.81rem;
  }
}
@media (max-width: 768px) {
  .welcome-card {
    min-height: 308px;
  }
  .welcome-card h2 {
    font-size: 2.1rem;
  }
  .welcome-card :deep(.clay-illustration) {
    right: 5px;
    transform: scale(0.9);
  }
  .mode-card {
    padding: 17px 14px;
  }
  .mode-copy strong {
    font-size: 0.76rem;
  }
  .learning-note {
    font-size: 0.63rem;
    text-align: center;
  }
  .lesson-grid {
    gap: 18px;
  }
}
@media (max-width: 520px) {
  .dashboard-bento {
    gap: 16px;
  }
  .welcome-card {
    padding: 25px;
    min-height: 475px;
    align-items: flex-start;
  }
  .welcome-card h2 {
    font-size: 2.03rem;
  }
  .welcome-card p {
    max-width: 250px;
  }
  .welcome-card :deep(.clay-illustration) {
    top: auto;
    bottom: -8px;
    right: 9px;
    transform: scale(0.63);
    transform-origin: bottom right;
  }
  .hero-note {
    flex-wrap: wrap;
    max-width: 145px;
    line-height: 1.8;
    margin-top: 30px;
  }
  .welcome-card .btn {
    margin-top: 20px;
  }
  .progress-card {
    padding: 17px;
    gap: 12px;
  }
  .progress-heading h2 {
    font-size: 0.87rem;
  }
  .progress-card > p {
    font-size: 0.67rem;
  }
  .progress-ring {
    width: 64px;
    height: 64px;
  }
  .progress-ring strong {
    font-size: 1.18rem;
  }
  .mode-card {
    grid-column: span 6;
    flex-direction: row;
    align-items: center;
    padding: 17px 20px;
  }
  .mode-copy strong {
    font-size: 0.88rem;
  }
  .mode-copy small {
    font-size: 0.69rem;
  }
  .mode-card > .app-icon {
    display: block;
  }
  .lesson-grid {
    grid-template-columns: 1fr;
  }
  .lesson-grid :deep(.lesson-card) {
    padding: 24px;
  }
  .lesson-grid :deep(.lesson-card h3) {
    font-size: 1.14rem;
  }
  .section-heading {
    align-items: flex-start;
  }
  .section-heading p {
    max-width: 210px;
    font-size: 0.71rem;
  }
}
</style>
