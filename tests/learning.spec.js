import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { buildLessons } from '../src/data/lessons.js'

const rawWords = JSON.parse(
  readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'),
)
const words = Array.isArray(rawWords) ? rawWords : Object.values(rawWords).flat()
const lesson1Words = buildLessons(words).find((l) => l.id === 'lesson-1').words

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.testSpoken = []
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel() {},
        getVoices() {
          return []
        },
        speak(utterance) {
          window.testSpoken.push(utterance.text)
        },
      },
    })
  })
})

test('every vocabulary entry belongs to one lesson and mastery stays scoped', () => {
  const lessons = buildLessons(words, [1, 31])
  const ids = lessons.flatMap((lesson) => lesson.words.map((word) => word.id))
  expect(ids.sort((a, b) => a - b)).toEqual(
    words.map((word) => word.id).sort((a, b) => a - b),
  )
  expect(new Set(ids).size).toBe(words.length)
  expect(lessons).toHaveLength(2)
  expect(lessons[0].id).toBe('lesson-1')
  expect(lessons[0].masteredCount).toBe(2)
  expect(lessons[1].id).toBe('lesson-2')
  expect(lessons[1].masteredCount).toBe(0)
})


test('lessons are shown and study shortcuts preserve the lesson context', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.lesson-card')).toHaveCount(2)
  await expect(page.locator('.lesson-card').first()).toContainText('BÀI 01')
  await expect(page.locator('.lesson-card').first()).toContainText(`${lesson1Words.length} từ vựng`)
  await expect(page.locator('.lesson-card').nth(1)).toContainText('BÀI 02')
  await page.getByRole('navigation', { name: 'Điều hướng chính', exact: true })
    .getByRole('button', { name: 'Bài học', exact: true }).click()
  await expect(page.locator('.lesson-card')).toHaveCount(2)
  await expect(page.getByRole('button', { name: `Học toàn bộ ${words.length} từ` })).toBeVisible()
  for (const [label, mode] of [['Flashcards', 'flashcard'], ['Trắc nghiệm', 'quiz']]) {
    await page.getByRole('navigation', { name: 'Điều hướng chính', exact: true })
      .getByRole('button', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`#lesson/all/${mode}$`))
    await expect(page.locator('.summary-progress')).toContainText(`0/${words.length}`)
  }
  // Existing bookmarks now resolve to the all-words view.
  for (const previousId of ['everyday-health', 'treatment', 'consultation', 'dental-care', 'all']) {
    await page.goto(`/#lesson/${previousId}/flashcard`)
    await expect(page.getByRole('heading', { name: 'Toàn bộ từ vựng', exact: true })).toBeVisible()
    await expect(page.locator('.summary-progress')).toContainText(`0/${words.length}`)
  }
})

test('lesson entry, flashcard review, pronunciation, completion and saved mastery', async ({
  page,
}) => {
  test.setTimeout(90000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Bắt đầu học', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Y tế & chăm sóc sức khỏe', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.summary-progress')).toContainText(`0/${lesson1Words.length}`)
  await page.getByRole('button', { name: 'Bắt đầu học flashcards' }).click()
  await expect(page.locator('.word-text')).toHaveText('careful')
  await page.getByRole('button', { name: 'Nghe phát âm', exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => window.testSpoken))
    .toContain('careful')
  await page
    .getByRole('button', { name: 'Đánh dấu đã thuộc', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Đã thuộc (1)', exact: true }),
  ).toBeVisible()
  await page.getByLabel('Nhập nghĩa tiếng Việt').fill('không đúng')
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
  await expect(page.locator('.feedback')).toContainText('Chưa đúng')
  await expect(page.locator('.card-meta')).toContainText(`1 / ${lesson1Words.length + 1}`)
  await page.getByRole('button', { name: 'Tiếp theo →', exact: true }).click()
  await expect(page.locator('.word-text')).toHaveText('carefully')
  await page.getByRole('button', { name: 'Đánh dấu đã thuộc', exact: true }).click()
  await expect(page.locator('.word-text')).toHaveText('carefully')
  await expect(page.locator('.card-meta')).toContainText(`2 / ${lesson1Words.length + 1}`)
  for (let index = 0; index < lesson1Words.length; index += 1) {
    const wordText = await page.locator('.word-text').innerText()
    const word = lesson1Words.find((entry) => entry.word === wordText)
    const meaning = word.meaning
      .replace(/\([^)]*\)/g, ' ')
      .split(/[,;/]+/)[0]
      .trim()
    await page.getByLabel('Nhập nghĩa tiếng Việt').fill(meaning)
    await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
    await expect(page.locator('.feedback')).toContainText('Chính xác!')
    if (index < lesson1Words.length - 1)
      await expect(page.getByLabel('Nhập nghĩa tiếng Việt')).toHaveValue('')
  }
  await expect(
    page.getByRole('heading', { name: 'Hoàn thành!', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.result-stats')).toContainText(`${Math.round((lesson1Words.length - 1) / lesson1Words.length * 100)}%`)
  await page.getByRole('button', { name: 'Chọn bài học tiếp theo' }).click()
  await page.reload()
  await expect(page.locator('.sidebar-progress')).toContainText(`2/${words.length}`)
  await expect(page.locator('.lesson-card').first()).toContainText(
    `2/${lesson1Words.length} đã thuộc`,
  )
  expect(errors).toEqual([])
})

test('quiz scoring, wrong-answer review, replay and return to lessons', async ({
  page,
}) => {
  await page.goto('/#lesson/lesson-1/quiz')
  await expect(
    page.getByRole('button', { name: `Tất cả ${lesson1Words.length} câu`, exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Bắt đầu trắc nghiệm' }).click()
  for (let index = 0; index < 10; index += 1) {
    // Resolve each randomized question through its visible prompt.
    const wordText = await page.locator('.target-word').innerText()
    const meaning = words.find((word) => word.word === wordText).meaning
    const options = page.locator('.quiz-option')
    const correct = options.filter({
      has: page.getByText(meaning, { exact: true }),
    })
    if (index === 0)
      await options
        .filter({ hasNot: page.getByText(meaning, { exact: true }) })
        .first()
        .click()
    else await correct.click()
    await expect(page.locator('.answer-feedback')).toBeVisible()
    await expect(options.first()).toBeDisabled()
    await page.locator('#btn-next-question').click()
  }
  await expect(page.locator('.result-stats')).toContainText('90%')
  await page.getByRole('button', { name: 'Luyện lại 1 câu sai' }).click()
  await expect(page.locator('.game-meta')).toContainText('/ 1')
  const wordText = await page.locator('.target-word').innerText()
  const meaning = words.find((word) => word.word === wordText).meaning
  await page
    .locator('.quiz-option')
    .filter({ has: page.getByText(meaning, { exact: true }) })
    .click()
  await page.getByRole('button', { name: 'Xem kết quả' }).click()
  await expect(page.locator('.result-stats')).toContainText('100%')
  await expect(page.locator('.res-stat-box').last()).toContainText('1')
  await page.getByRole('button', { name: 'Làm bài kiểm tra mới' }).click()
  await expect(
    page.getByRole('button', { name: `Tất cả ${lesson1Words.length} câu`, exact: true }),
  ).toBeVisible()
})

for (const mode of [
  { label: 'Việt → Anh', selector: '.target-meaning' },
  { label: 'Luyện nghe', selector: '.target-listening' },
  { label: 'Hỗn hợp', selector: '.target-box' },
]) {
  test(`quiz retains ${mode.label} mode`, async ({ page }) => {
    await page.goto('/#lesson/all/quiz')
    await page
      .getByRole('group', { name: 'Dạng bài trắc nghiệm', exact: true })
      .getByRole('button', { name: mode.label })
      .click()
    await page.getByRole('button', { name: '20 câu', exact: true }).click()
    await page.getByRole('button', { name: 'Bắt đầu trắc nghiệm' }).click()
    await expect(page.locator(mode.selector)).toBeVisible()
    await expect(page.locator('.game-meta')).toContainText('/ 20')
    await expect(page.locator('.quiz-option')).toHaveCount(4)
    if (mode.label === 'Luyện nghe')
      await expect
        .poll(() => page.evaluate(() => window.testSpoken.length))
        .toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Đổi cách học' }).click()
    await expect(
      page.getByRole('heading', { name: 'Bạn muốn học thế nào?' }),
    ).toBeVisible()
  })
}

test('library search, filters, empty state and persisted mastery remain available', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('medivocab_mastered', '[1,31]'),
  )
  await page.goto('/#list')
  await page.getByLabel('Trạng thái', { exact: true }).selectOption('mastered')
  await expect(page.locator('.word-item-card')).toHaveCount(2)
  await page.getByLabel('Tìm từ vựng', { exact: true }).fill('careful')
  await expect(page.locator('.word-item-card')).toHaveCount(1)
  await page
    .getByRole('button', { name: 'Bỏ đánh dấu: careful', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Chưa tìm thấy từ phù hợp' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click()
  await expect(page.locator('.word-item-card')).toHaveCount(words.length)
  await page.getByLabel('Từ loại', { exact: true }).selectOption('adj.')
  const adjectiveCount = words.filter((word) => word.type === 'adj.').length
  await expect(page.locator('.word-item-card')).toHaveCount(adjectiveCount)
  await page.getByLabel('Tìm từ vựng', { exact: true }).fill('/ˈkeəfl/')
  await expect(page.locator('.word-item-card')).toHaveCount(2)
  await page
    .getByRole('button', { name: 'Nghe phát âm: careful', exact: true })
    .first()
    .click()
  await expect
    .poll(() => page.evaluate(() => window.testSpoken))
    .toContain('careful')
  await page.getByLabel('Bài học', { exact: true }).selectOption('bai1')
  await expect(page.locator('.word-item-card')).toHaveCount(1)
  await page.getByLabel('Bài học', { exact: true }).selectOption('bai2')
  await expect(page.locator('.word-item-card')).toHaveCount(1)
  await page.getByLabel('Tìm từ vựng', { exact: true }).fill('')
  await page.getByLabel('Từ loại', { exact: true }).selectOption('all')
  await page.getByLabel('Bài học', { exact: true }).selectOption('bai1')
  await expect(page.locator('.word-item-card')).toHaveCount(lesson1Words.length)
  await page.getByLabel('Bài học', { exact: true }).selectOption('bai2')
  await expect(page.locator('.word-item-card')).toHaveCount(words.length - lesson1Words.length)
  await page.getByLabel('Bài học', { exact: true }).selectOption('all')
  await expect(page.locator('.word-item-card')).toHaveCount(words.length)
})

test('invalid saved data and empty mastered deck are handled', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('medivocab_mastered', '{"invalid":true}'),
  )
  await page.goto('/#flashcard/lesson-1')
  await page.getByRole('button', { name: 'Đã thuộc (0)', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Chưa có thẻ trong mục này' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Xem tất cả từ' }).click()
  await expect(page.locator('.word-text')).toHaveText('careful')
  await page.getByRole('button', { name: 'Xáo trộn', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Đang xáo trộn', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('mobile lesson controls stay usable and navigation returns after studying', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/#lesson/lesson-1/flashcard')
  await page.getByRole('button', { name: 'Bắt đầu học flashcards' }).click()
  await expect(page.locator('.mobile-nav')).toHaveCount(0)
  await page.getByLabel('Nhập nghĩa tiếng Việt').fill('can than')
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
  await expect(page.locator('.feedback')).toContainText('Chính xác!')
  await expect(page.locator('.word-text')).toHaveText('carefully')
  await page.getByRole('button', { name: 'Bài học', exact: true }).click()
  await expect(page.locator('.mobile-nav')).toBeVisible()
  await page.locator('.mobile-nav').getByRole('button', { name: 'Từ vựng', exact: true }).click()
  await expect(page.locator('.list-container')).toBeVisible()
  await page.goBack()
  await expect(page.locator('.lesson-grid')).toBeVisible()
})

for (const width of [375, 768, 1024, 1440]) {
  test(`responsive learning screens at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    for (const route of [
      'home',
      'lesson/lesson-1/quiz',
      'flashcard/lesson-1',
      'quiz/lesson-1',
      'list',
    ]) {
      await page.goto(`/#${route}`)
      const selectors = { home: '.welcome-card', lesson: '.lesson-detail', flashcard: '.flashcard-section', quiz: '.quiz-container', list: '.list-container' }
      await expect(page.locator(selectors[route.split('/')[0]])).toBeVisible()
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true)
      if ([375, 1440].includes(width)) {
        await page.screenshot({ path: `test-results/${route.split('/')[0]}-${width}.png`, fullPage: route !== 'list' })
      }
    }
    await page.goto('/#home')
    await page.screenshot({
      path: `test-results/dashboard-${width}.png`,
      fullPage: true,
    })
  })
}
