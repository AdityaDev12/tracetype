import { expect, test } from '@playwright/test'

test('landing hero: boots, auto-types, then the visitor takes over', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('#/hero')
  await expect(page.locator('.boot')).toContainText('tracetype --start')
  // Boot is short and leads to the hero.
  await expect(page.locator('.lp-title')).toBeVisible({ timeout: 3000 })
  // The demo types by itself: line 1 finishes and memory gets a box.
  await expect(page.locator('.hero-demo .mem-box').first()).toBeVisible({ timeout: 4000 })

  // Click to take over: the demo restarts empty and becomes live.
  await page.locator('.hero-editor').click()
  await expect(page.locator('.hero-demo')).toHaveClass(/is-live/)
  await expect(page.locator('.hero-demo .mem-box')).toHaveCount(0)

  await page.keyboard.type('cups = 2')
  await page.keyboard.press('Enter')
  // A wrong line is refused and stays put.
  await page.keyboard.type('cups = cups + 2')
  await page.keyboard.press('Enter')
  await expect(page.locator('.hero-demo .tline.active .tgutter')).toHaveText('2')
  await expect(page.locator('.hero-demo .twrong')).toHaveCount(1)
  await page.keyboard.press('Backspace')
  await page.keyboard.type('1')
  await page.keyboard.press('Enter')
  // The tutor circles the line that reads the old value.
  await expect(page.locator('.hero-demo .anno-note')).toContainText('old value')
  await expect(page.locator('.hero-demo .mem-was-text')).toContainText('was 2')

  await page.keyboard.type('name = "Rin"')
  await page.keyboard.press('Enter')
  await page.keyboard.type('print(name, "has", cups, "cups")')
  await page.keyboard.press('Enter')
  await expect(page.locator('.hero-demo .toutput')).toContainText('Rin has 3 cups')
  await expect(page.locator('.hero-try')).toContainText('you just wrote Python')
  expect(errors).toEqual([])
})

test('landing hero: a key press also takes over, and the boot line only plays once', async ({ page }) => {
  await page.goto('#/hero')
  await expect(page.locator('.lp-title')).toBeVisible({ timeout: 3000 })
  await page.keyboard.press('c')
  await expect(page.locator('.hero-demo')).toHaveClass(/is-live/)
  await page.keyboard.type('ups = 2')
  await page.keyboard.press('Enter')
  await expect(page.locator('.hero-demo .tline').first().locator('.tgutter')).toHaveText('✓')
  await page.reload()
  await expect(page.locator('.boot')).toHaveCount(0)
  await expect(page.locator('.lp-title')).toBeVisible()
})
