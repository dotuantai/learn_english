import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { isFlashcardAnswerCorrect } from '../src/utils/flashcardAnswers.js'
import { buildLessons } from '../src/data/lessons.js'

const rawWords = JSON.parse(
  readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'),
)
const words = Array.isArray(rawWords) ? rawWords : Object.values(rawWords).flat()
const lesson1Words = buildLessons(words).find((l) => l.id === 'lesson-1').words

test('flashcard answers accept English variants without accepting misspellings', () => {
  const cases = [
    [1, ['careful', ' CAREFUL '], ['carefully', 'care', 'cẩn thận', 'cáreful']],
    [17, ['painkiller', 'painkillers', 'painkiller(s)'], ['painkiler', 'pain killer']],
    [22, ['over-the-counter medicine', 'over the counter   medicine'], ['medicine', 'over counter medicine']],
    [38, ['cavity', 'cavities', 'cavity / cavities'], ['cavitys', 'cavit']],
  ]
  for (const [id, accepted, rejected] of cases) {
    const word = words.find((entry) => entry.id === id)
    for (const answer of accepted)
      expect(isFlashcardAnswerCorrect(answer, word, 'vi_en'), answer).toBe(true)
    for (const answer of [...rejected, '', '   '])
      expect(isFlashcardAnswerCorrect(answer, word, 'vi_en'), answer).toBe(false)
  }
  for (const word of words) {
    expect(isFlashcardAnswerCorrect(word.word, word, 'vi_en'), word.word).toBe(true)
    for (const meaning of word.meaning.replace(/\([^)]*\)/g, ' ').split(/[,;/]+/).filter((value) => value.trim()))
      expect(isFlashcardAnswerCorrect(meaning, word, 'en_vi'), meaning).toBe(true)
  }
  expect(isFlashcardAnswerCorrect('can than', words[0], 'en_vi')).toBe(true)
  expect(isFlashcardAnswerCorrect('THẬN TRỌNG', words[0], 'en_vi')).toBe(true)
  expect(isFlashcardAnswerCorrect('can', words[0], 'en_vi')).toBe(false)
  expect(isFlashcardAnswerCorrect('careful', words[0], 'en_vi')).toBe(false)
})

test.describe('flashcard direction controls', () => {
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

  for (const width of [375, 1440]) {
    test(`Vietnamese prompts, English typing and wrong-answer review at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.addInitScript(() => localStorage.setItem('medivocab_mastered', '[1,17,22,38,49]'))
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto('/#lesson/lesson-1/flashcard')
      await page.getByRole('button', { name: 'Việt → Anh', exact: true }).click()
      await page.getByRole('button', { name: 'Bắt đầu học flashcards' }).click()
      await expect(page.getByRole('button', { name: 'Việt → Anh', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Đã thuộc (5)', exact: true }).click()
      const input = page.getByLabel('Nhập từ tiếng Anh', { exact: true })
      await expect(input).toBeFocused()
      await expect(input).toHaveAttribute('lang', 'en')
      await expect(page.locator('.card-front .meaning-text')).toHaveText(words[0].meaning)
      await expect(page.locator('.card-front .word-text, .card-front .ipa-row')).toHaveCount(0)
      await page.getByRole('button', { name: 'Lật thẻ để xem từ tiếng Anh', exact: true }).click()
      await expect(page.locator('.card-back')).toHaveAttribute('aria-hidden', 'false')
      await expect(page.locator('.card-back .word-text')).toHaveText('careful')
      await expect(page.locator('.card-back .ipa-row')).toHaveText(words[0].ipa)
      await page.getByRole('button', { name: 'Ẩn từ tiếng Anh', exact: true }).click()
      await page.getByRole('button', { name: 'Nghe phát âm', exact: true }).click()
      await expect.poll(() => page.evaluate(() => window.testSpoken)).toContain('careful')
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: `test-results/flashcard-reverse-${width}.png`, fullPage: true })

      await input.fill('carefully')
      await input.press('Enter')
      await expect(page.locator('.feedback')).toContainText('Từ tiếng Anh là careful')
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(page.locator('.card-meta')).toContainText('1 / 6')
      await page.getByRole('button', { name: 'Tiếp theo →', exact: true }).click()
      const answers = [
        [17, 'painkillers'],
        [22, 'over the counter medicine'],
        [1, ' CAREFUL '],
        [38, 'cavities'],
        [49, 'neither constant nor unbearable'],
      ]
      for (const [id, answer] of answers) {
        const word = words.find((entry) => entry.id === id)
        await expect(page.locator('.card-front .meaning-text')).toHaveText(word.meaning)
        await expect(page.locator('.card-back')).toHaveAttribute('aria-hidden', 'true')
        // Long meanings must fit between the header and the flip hint on mobile.
        const layout = await page.locator('.card-front').evaluate((face) => {
          const prompt = face.querySelector('.answer-content').getBoundingClientRect()
          const header = face.querySelector('.card-header').getBoundingClientRect()
          const hint = face.querySelector('.flip-hint').getBoundingClientRect()
          return { fits: prompt.top >= header.bottom && prompt.bottom <= hint.top,
            overflows: document.documentElement.scrollWidth > window.innerWidth }
        })
        expect(layout, word.meaning).toEqual({ fits: true, overflows: false })
        if (id === 49) {
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.screenshot({ path: `test-results/flashcard-reverse-long-${width}.png`, fullPage: true })
        }
        await input.fill(answer)
        await input.press('Enter')
        await expect(page.locator('.feedback')).toContainText('Chính xác!')
        if (id !== 49) await expect(input).toHaveValue('')
      }
      await expect(page.getByRole('heading', { name: 'Hoàn thành!', exact: true })).toBeVisible()
      await expect(page.locator('.result-stats')).toContainText('80%')
      await expect(page.locator('.result-box')).toContainText('học xong 5 từ')
      await page.getByRole('button', { name: 'Học lại', exact: true }).click()
      await expect(input).toBeVisible()
      await expect(page.locator('.card-meta')).toContainText('1 / 5')
      await page.getByRole('button', { name: 'Xáo trộn', exact: true }).click()
      await expect(input).toBeVisible()
      await expect(page.getByRole('button', { name: 'Đang xáo trộn', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('medivocab_mastered')))).toEqual([1,17,22,38,49])
      await page.getByRole('button', { name: 'Đổi cách học', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Việt → Anh', exact: true })).toHaveAttribute('aria-pressed', 'true')
      expect(errors).toEqual([])
    })
  }

  test('switching direction resets answers and review queue, cancels auto-advance and keeps mastery', async ({ page }) => {
    await page.clock.install()
    await page.goto('/#flashcard/lesson-1')
    await expect(page.getByRole('button', { name: 'Anh → Việt', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Đánh dấu đã thuộc', exact: true }).click()
    await page.getByLabel('Nhập nghĩa tiếng Việt').fill('cẩn thận')
    await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click()
    await expect(page.locator('.feedback')).toContainText('Chính xác!')
    await page.getByRole('button', { name: 'Việt → Anh', exact: true }).click()
    await page.clock.runFor(1000)
    const input = page.getByLabel('Nhập từ tiếng Anh', { exact: true })
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
    await expect(page.locator('.card-meta')).toContainText(`1 / ${lesson1Words.length}`)
    await expect(page.locator('.card-meta')).toContainText('Đúng 0/0')
    await expect(page.getByRole('button', { name: 'Đã thuộc', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await input.fill('wrong')
    await input.press('Enter')
    await expect(page.locator('.card-meta')).toContainText(`1 / ${lesson1Words.length + 1}`)
    await page.getByRole('button', { name: 'Anh → Việt', exact: true }).click()
    await expect(page.locator('.card-meta')).toContainText(`1 / ${lesson1Words.length}`)
    await expect(page.locator('.card-meta')).toContainText('Đúng 0/0')
    await expect(page.locator('.flashcard')).not.toHaveClass(/flipped/)
    await expect(page.getByLabel('Nhập nghĩa tiếng Việt')).toHaveValue('')
    await expect(page.locator('.feedback')).not.toContainText('Chưa đúng')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('medivocab_mastered'))).toBe('[1]')
    await page.getByRole('button', { name: 'Việt → Anh', exact: true }).click()
    await page.getByRole('button', { name: 'Đổi cách học', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Việt → Anh', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })
})
