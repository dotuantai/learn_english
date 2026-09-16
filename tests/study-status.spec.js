import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { buildLessons } from '../src/data/lessons.js'

const rawWords = JSON.parse(
  readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'),
)
const words = Array.isArray(rawWords) ? rawWords : Object.values(rawWords).flat()
const lessonWords = buildLessons(words).find(
  (lesson) => lesson.id === 'lesson-1',
).words
const masteredWords = lessonWords.slice(0, 3)
const masteredIds = masteredWords.map((word) => word.id)
const masteredAdverbs = masteredWords.filter((word) =>
  word.type.split(/[./\s]+/).includes('adv'),
)

test.beforeEach(async ({ page }) => {
  await page.addInitScript((ids) => {
    localStorage.setItem('medivocab_mastered', JSON.stringify(ids))
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel() {},
        getVoices() {
          return []
        },
        speak() {},
      },
    })
  }, masteredIds)
})

test('mastered words can be selected and studied with flashcards', async ({
  page,
}) => {
  await page.goto('/#lesson/lesson-1/flashcard')
  const statusSelector = page.getByRole('group', {
    name: 'Nhóm từ muốn học',
    exact: true,
  })

  await expect(
    statusSelector.getByRole('button', {
      name: `Đã thuộc Ôn lại những từ bạn đã đánh dấu ${masteredWords.length} từ`,
      exact: true,
    }),
  ).toBeEnabled()
  await statusSelector
    .getByRole('button', { name: /^Đã thuộc/ })
    .click()
  await expect(page.locator('.study-scope')).toHaveText(
    `Tất cả từ loại · Đã thuộc · ${masteredWords.length}/${lessonWords.length} từ trong bài`,
  )

  await page
    .getByRole('button', { name: 'Bắt đầu học flashcards', exact: true })
    .click()
  await expect(page).toHaveURL(
    new RegExp(`#flashcard/lesson-1\\?status=mastered$`),
  )
  await expect(page.locator('.session-status')).toHaveText(
    `Đã thuộc · ${masteredWords.length} từ`,
  )
  await expect(
    page.getByRole('button', {
      name: `Đã thuộc (${masteredWords.length})`,
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.word-text')).toHaveText(masteredWords[0].word)

  await page.reload()
  await expect(
    page.getByRole('button', {
      name: `Đã thuộc (${masteredWords.length})`,
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.word-text')).toHaveText(masteredWords[0].word)
})

test('mastered words are quiz targets even when fewer than four are marked', async ({
  page,
}) => {
  await page.goto('/#lesson/lesson-1/quiz')
  const statusSelector = page.getByRole('group', {
    name: 'Nhóm từ muốn học',
    exact: true,
  })
  await page
    .getByRole('group', { name: 'Học theo từ loại', exact: true })
    .getByRole('button', { name: /^Trạng từ/ })
    .click()
  await statusSelector.getByRole('button', { name: /^Đã thuộc/ }).click()

  await expect(page.getByLabel('Nhập số câu hỏi')).toHaveValue(
    String(masteredAdverbs.length),
  )
  await expect(
    page.getByRole('button', { name: 'Bắt đầu trắc nghiệm', exact: true }),
  ).toBeEnabled()
  await page
    .getByRole('button', { name: 'Bắt đầu trắc nghiệm', exact: true })
    .click()
  await expect(page).toHaveURL(
    new RegExp(`#quiz/lesson-1\\?type=adv&status=mastered$`),
  )

  for (let index = 0; index < masteredAdverbs.length; index += 1) {
    const target = await page.locator('.target-word').innerText()
    expect(masteredAdverbs.map((word) => word.word)).toContain(target)
    await expect(page.locator('.quiz-option')).toHaveCount(4)
    await page.locator('.quiz-option').first().click()
    await page.locator('#btn-next-question').click()
  }

  await expect(page.locator('.results-card')).toBeVisible()
  await page.getByRole('button', { name: 'Đổi cách học', exact: true }).click()
  await expect(
    page
      .getByRole('group', { name: 'Nhóm từ muốn học', exact: true })
      .getByRole('button', { name: /^Đã thuộc/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page
      .getByRole('group', { name: 'Học theo từ loại', exact: true })
      .getByRole('button', { name: /^Trạng từ/ }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('empty mastered group explains why a session cannot start', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.removeItem('medivocab_mastered'))
  await page.goto('/#lesson/lesson-1/flashcard?status=mastered')

  await expect(
    page.getByRole('button', { name: 'Bắt đầu học flashcards', exact: true }),
  ).toBeDisabled()
  await expect(page.locator('.study-unavailable')).toContainText(
    'chưa đánh dấu từ nào là đã thuộc',
  )
})
