import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { buildLessons } from '../src/data/lessons.js'

const rawWords = JSON.parse(readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'))
const words = Array.isArray(rawWords) ? rawWords : Object.values(rawWords).flat()
const lessons = buildLessons(words)
const lessonWords = lessons[0].words
const adverbs = lessonWords.filter((word) => word.type.split(/[./\s]+/).includes('adv'))
const groups = [
  ['all', 'Tất cả từ loại', 52, 96],
  ['n', 'Danh từ', 22, 35],
  ['v', 'Động từ', 16, 26],
  ['adj', 'Tính từ', 8, 32],
  ['adv', 'Trạng từ', 5, 5],
  ['phr', 'Cụm từ', 22, 4],
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.testSpoken = []
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel() {},
        getVoices() { return [] },
        speak(utterance) { window.testSpoken.push(utterance.text) },
      },
    })
  })
})

test('type choices show scoped counts, matching previews and keyboard selection', async ({ page }) => {
  for (const [index, lesson] of [...lessons, { id: 'all', words }].entries()) {
    await page.goto(`/#lesson/${lesson.id}/flashcard`)
    const selector = page.getByRole('group', { name: 'Học theo từ loại', exact: true })
    for (const [type, title, firstCount, secondCount] of groups) {
      const count = index === 2 ? firstCount + secondCount : [firstCount, secondCount][index]
      const choice = selector.getByRole('button', { name: `${title} ${count} từ`, exact: true })
      await choice.focus()
      await choice.press('Enter')
      await expect(choice).toBeFocused()
      await expect(choice).toHaveAttribute('aria-pressed', 'true')
      await expect(selector.locator('[aria-pressed="true"]')).toHaveCount(1)
      await expect(page.locator('.study-scope')).toHaveText(`${title} · ${count}/${lesson.words.length} từ trong bài`)
      const expectedWords = lesson.words.filter((word) => type === 'all' || word.type.split(/[./\s]+/).includes(type))
      const previews = await page.locator('.preview-words > div > span').allTextContents()
      expect(previews.slice(0, 5)).toEqual(expectedWords.slice(0, 5).map((word) => word.word))
    }
  }
})

test('filtered flashcards keep mastery, review, reload and navigation scoped to the chosen type', async ({ page }) => {
  await page.goto('/#lesson/lesson-1/flashcard')
  await page.getByRole('button', { name: 'Trạng từ 5 từ', exact: true }).click()
  await page.getByRole('button', { name: 'Bắt đầu học flashcards' }).click()
  await expect(page).toHaveURL(/#flashcard\/lesson-1\?type=adv$/)
  await expect(page.locator('.session-type')).toHaveText('Trạng từ · 5 từ')
  await expect(page.locator('.word-text')).toHaveText(adverbs[0].word)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Tất cả (5)', exact: true })).toBeVisible()
  await page.getByLabel('Nhập nghĩa tiếng Việt').fill('sai nghĩa')
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
  await expect(page.locator('.card-meta')).toContainText('1 / 6')
  await page.getByRole('button', { name: 'Tiếp theo →', exact: true }).click()
  await expect(page.locator('.word-text')).toHaveText(adverbs[1].word)
  await page.getByRole('button', { name: 'Đánh dấu đã thuộc', exact: true }).click()
  await expect(page.locator('.word-text')).toHaveText(adverbs[1].word)
  await expect(page.locator('.card-meta')).toContainText('2 / 6')
  await expect(page.getByRole('button', { name: 'Đã thuộc (1)', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Việt → Anh', exact: true }).click()
  await expect(page.locator('.card-meta')).toContainText('1 / 5')
  await expect(page.locator('.card-front .meaning-text')).toHaveText(adverbs[0].meaning)
  await page.getByRole('button', { name: 'Đổi cách học', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Trạng từ 5 từ', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Việt → Anh', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.summary-progress')).toContainText('1/52')
  await page.goBack()
  await expect(page.locator('.session-type')).toHaveText('Trạng từ · 5 từ')
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Trạng từ 5 từ', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Tất cả từ loại 52 từ', exact: true }).click()
  await page.getByRole('button', { name: 'Bắt đầu học flashcards' }).click()
  await expect(page).toHaveURL(/#flashcard\/lesson-1$/)
  await expect(page.getByRole('button', { name: 'Tất cả (52)', exact: true })).toBeVisible()
})

for (const quizMode of ['Anh → Việt', 'Việt → Anh', 'Luyện nghe', 'Hỗn hợp']) {
  test(`filtered ${quizMode} quiz uses only the chosen group for questions, answers and replay`, async ({ page }) => {
    await page.goto('/#lesson/lesson-1/quiz')
    await page.getByRole('button', { name: '20 câu', exact: true }).click()
    await page.getByRole('button', { name: 'Trạng từ 5 từ', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Tất cả 5 câu', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('group', { name: 'Dạng bài trắc nghiệm', exact: true })
      .getByRole('button', { name: quizMode }).click()
    await page.getByRole('button', { name: 'Bắt đầu trắc nghiệm' }).click()
    await expect(page).toHaveURL(/#quiz\/lesson-1\?type=adv$/)
    for (let index = 0; index < adverbs.length; index += 1) {
      await expect(page.locator('.game-meta')).toContainText(`/ ${adverbs.length}`)
      await expect(page.locator('.pos-tag')).toContainText('adv.')
      const options = page.locator('.quiz-option')
      await expect(options).toHaveCount(4)
      const englishPrompt = page.locator('.target-word')
      const meaningPrompt = page.locator('.target-meaning')
      if (await englishPrompt.count()) expect(adverbs.map((word) => word.word)).toContain(await englishPrompt.innerText())
      if (await meaningPrompt.count()) expect(adverbs.map((word) => `"${word.meaning}"`)).toContain(await meaningPrompt.innerText())
      const usesMeanings = await englishPrompt.count() > 0
      const expectedAnswers = adverbs.map((word) => usesMeanings ? word.meaning : word.word)
      for (const option of await options.locator('.option-title').allTextContents()) {
        expect(expectedAnswers).toContain(option)
      }
      await options.first().click()
      await page.locator('#btn-next-question').click()
    }
    await expect(page.locator('.result-stats')).toBeVisible()
    const retry = page.getByRole('button', { name: /Luyện lại \d+ câu sai/ })
    if (await retry.count()) {
      await retry.click()
      while (await page.locator('.pos-tag').count()) {
        await expect(page.locator('.pos-tag')).toContainText('adv.')
        const expectedAnswers = adverbs.flatMap((word) => [word.word, word.meaning])
        for (const option of await page.locator('.option-title').allTextContents())
          expect(expectedAnswers).toContain(option)
        await page.locator('.quiz-option').first().click()
        await page.locator('#btn-next-question').click()
      }
    }
    await page.getByRole('button', { name: 'Làm bài kiểm tra mới' }).click()
    await expect(page.getByRole('button', { name: 'Tất cả 5 câu', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Đổi cách học' }).click()
    await expect(page.getByRole('button', { name: 'Trạng từ 5 từ', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })
}

test('question presets remain selected when switching between differently sized groups', async ({ page }) => {
  await page.goto('/#lesson/lesson-1/quiz')
  await page.getByRole('button', { name: 'Tất cả 52 câu', exact: true }).click()
  await page.getByRole('button', { name: 'Tính từ 8 từ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tất cả 8 câu', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Danh từ 22 từ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tất cả 22 câu', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '10 câu', exact: true }).click()
  await page.getByRole('button', { name: 'Động từ 16 từ', exact: true }).click()
  await expect(page.getByRole('button', { name: '10 câu', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('empty and small groups explain why study is unavailable and allow recovery', async ({ page }) => {
  const fixture = { bai1: [lessonWords[0], lessonWords[1], lessonWords[2]], bai2: [] }
  await page.route('**/src/data/words.json*', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `export default ${JSON.stringify(fixture)}`,
  }))
  await page.goto('/#lesson/lesson-1/quiz?type=adv')
  await expect(page.getByRole('button', { name: 'Trạng từ 1 từ', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Bắt đầu trắc nghiệm', exact: true })).toBeDisabled()
  await expect(page.locator('.study-unavailable')).toContainText('Trắc nghiệm cần ít nhất 4 từ')
  await page.getByRole('group', { name: 'Cách học', exact: true }).getByRole('button', { name: /^Flashcards/ }).click()
  await expect(page.getByRole('button', { name: 'Bắt đầu học flashcards', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Bắt đầu học flashcards', exact: true }).click()
  await expect(page.locator('.word-text')).toHaveText(lessonWords[1].word)
  await page.goto('/#lesson/lesson-1/flashcard?type=phr')
  await expect(page.getByRole('button', { name: 'Cụm từ 0 từ', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Bắt đầu học flashcards', exact: true })).toBeDisabled()
  await expect(page.locator('.study-unavailable')).toContainText('Chưa có từ thuộc nhóm này')
  await page.getByRole('button', { name: 'Tất cả từ loại 3 từ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Bắt đầu học flashcards', exact: true })).toBeEnabled()
  await page.goto('/#lesson/lesson-1/flashcard?type=invalid')
  await expect(page.getByRole('button', { name: 'Tất cả từ loại 3 từ', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/#quiz/lesson-1?type=adv')
  await expect(page.locator('.quiz-unavailable')).toContainText('Trắc nghiệm cần ít nhất 4 từ')
  await expect(page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Đổi cách học' }).click()
  await expect(page.getByRole('button', { name: 'Trạng từ 1 từ', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

for (const width of [375, 768, 1024, 1440]) {
  test(`type selection and filtered session layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/#lesson/lesson-1/flashcard?type=n')
    const selector = page.getByRole('group', { name: 'Học theo từ loại', exact: true })
    await expect(selector).toBeVisible()
    for (const button of await selector.getByRole('button').all()) {
      const box = await button.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/word-types-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Bắt đầu học flashcards', exact: true }).click()
    await expect(page.locator('.session-type')).toHaveText('Danh từ · 22 từ')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
