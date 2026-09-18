import { expect, test } from '@playwright/test'

const authResponse = {
  tokenType: 'Bearer',
  accessToken: 'test-access-token',
  accessTokenExpiresAtUtc: '2099-01-01T00:00:00Z',
  refreshToken: 'test-refresh-token',
  refreshTokenExpiresAtUtc: '2099-02-01T00:00:00Z',
}

test('login validates fields, authenticates and keeps local progress synced', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('medivocab_mastered', '[1,31]'),
  )
  await page.route('**/api/auth/login', async (route) => {
    const request = route.request()
    expect(request.postDataJSON()).toEqual({
      email: 'learner@example.com',
      password: 'Secret123',
    })
    await route.fulfill({ json: authResponse })
  })
  await page.route('**/api/auth/me', async (route) => {
    expect(route.request().headers().authorization).toBe(
      'Bearer test-access-token',
    )
    await route.fulfill({
      json: {
        userId: 'user-1',
        email: 'learner@example.com',
        roles: [],
      },
    })
  })
  await page.route('**/api/learning/progress/import', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      masteredWordIds: [1, 31],
    })
    await route.fulfill({ json: { masteredWordIds: [1, 31, 53] } })
  })
  await page.route('**/api/auth/revoke', (route) =>
    route.fulfill({ status: 204 }),
  )

  await page.goto('/#login')
  await expect(
    page.getByRole('heading', { name: 'Chào mừng bạn trở lại' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.locator('#email-error')).toContainText('Vui lòng nhập email')
  await expect(page.locator('#password-error')).toContainText(
    'Vui lòng nhập mật khẩu',
  )

  await page.getByLabel('Email *').fill('learner@example.com')
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Secret123')
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click()
  await expect(page.getByLabel('Mật khẩu *', { exact: true })).toHaveAttribute(
    'type',
    'text',
  )
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()

  await expect(page).toHaveURL(/#home$/)
  await expect(page.locator('.sidebar-auth.signed-in')).toContainText(
    'learner@example.com',
  )
  await expect(page.locator('.sidebar-progress')).toContainText('3/148')
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('medivocab_mastered')))
    .toBe('[1,31,53]')

  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(page.getByRole('button', { name: /Đăng nhập/ })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('myhoa_auth_session')))
    .toBeNull()
})

test('register confirms the password and shows an existing-email response', async ({
  page,
}) => {
  await page.route('**/api/auth/register', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        title: 'Registration failed.',
        errors: { DuplicateUserName: ['Username is already taken.'] },
      }),
    }),
  )

  await page.goto('/#register')
  await expect(
    page.getByRole('heading', { name: 'Bắt đầu hành trình của bạn' }),
  ).toBeVisible()
  await page.getByLabel('Email *').fill('used@example.com')
  await page.getByLabel('Mật khẩu *', { exact: true }).fill('Secret123!')
  await page.getByLabel('Nhập lại mật khẩu *').fill('Different123')
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  await expect(page.locator('#confirm-error')).toContainText('chưa khớp')

  await page.getByLabel('Nhập lại mật khẩu *').fill('Secret123!')
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Email này đã được sử dụng',
  )
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL(/#login$/)
})

for (const width of [375, 768, 1440]) {
  test(`auth pages remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#login')
    await expect(page.locator('.auth-card')).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true)
    await page.screenshot({
      path: `test-results/login-${width}.png`,
      fullPage: true,
    })
  })
}
