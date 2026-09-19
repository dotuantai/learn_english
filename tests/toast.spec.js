import { test, expect } from '@playwright/test'
import { learningContent } from './fixtures/learningContent.js'

async function expectToastInsideViewport(page) {
  const toast = page.getByRole('alert')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('Vui lòng đăng nhập để lưu từ đã thuộc')

  const box = await toast.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  return toast
}

test.describe('mobile mastery feedback', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.route('**/api/learning', (route) => route.fulfill({ json: learningContent }))
  })

  test('guest warning stays visible after marking a word deep in the list', async ({ page }) => {
    await page.goto('/#list')
    const lastMasteryButton = page
      .getByRole('button', { name: /^Đánh dấu đã thuộc:/ })
      .last()

    await lastMasteryButton.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    await lastMasteryButton.click()

    const toast = await expectToastInsideViewport(page)
    await toast.getByRole('button', { name: 'Đăng nhập', exact: true }).click()

    await expect(page).toHaveURL(/#login$/)
    await expect(page.locator('.app-toast')).toHaveCount(0)
  })

  test('guest warning stays visible while using flashcards and closes after five seconds', async ({ page }) => {
    await page.clock.install()
    await page.goto('/#flashcard/lesson-1')
    const masteryButton = page.getByRole('button', {
      name: 'Đánh dấu đã thuộc',
      exact: true,
    })

    await masteryButton.scrollIntoViewIfNeeded()
    await masteryButton.click()

    await expectToastInsideViewport(page)
    await page.clock.runFor(5000)
    await expect(page.locator('.app-toast')).toHaveCount(0)
  })
})
