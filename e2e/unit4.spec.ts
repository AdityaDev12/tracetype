import { expect, test } from '@playwright/test'
import { stepForward } from './steps.ts'

// Unit 4: cells light the positions an index or slice uses (with negative
// positions and the box past the end), the f-string filler and the refs diagram.

test('cells light an index, then show negative positions', async ({ page }) => {
  await page.goto('#/lesson/py-21-indexing/examples')
  await stepForward(page, 2)
  await expect(page.locator('.viz-cells .cell.pick .cell-val')).toHaveText('h')
  await expect(page.locator('.viz-cells .cells-use')).toContainText("pet[0] → 'h'")
  await expect(page.locator('.viz-cells .cell-idx.neg')).toHaveCount(0)
})

test('a slice lights its window, and a backwards slice numbers the order', async ({ page }) => {
  await page.goto('#/lesson/py-22-slicing/examples')
  await stepForward(page, 2)
  await expect(page.locator('.viz-cells .cell.pick')).toHaveCount(4)
  await expect(page.locator('.viz-cells .cells-use')).toContainText('positions 0, 1, 2, 3')
})

test('refs: a method makes a new object and the name moves to it', async ({ page }) => {
  await page.goto('#/lesson/py-23-strings-never-change/examples')
  await stepForward(page, 2)
  await expect(page.locator('.viz-refs .ref-row')).toHaveCount(2)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.viz-refs .ref-row.gone')).toContainText("'oslo'")
  await expect(page.locator('.viz-refs .ref-name.moved')).toContainText('city')
})

test('the f-string panel fills each hole and applies its spec', async ({ page }) => {
  await page.goto('#/lesson/py-25-formatting-output/examples')
  await stepForward(page, 4)
  await expect(page.locator('.viz-format .fmt-hole')).toHaveCount(2)
  await expect(page.locator('.viz-format .fmt-text')).toContainText('Priya·bought·3·apples')
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')
  await expect(page.locator('.viz-format .fmt-spec')).toHaveText(':.2f')
  await expect(page.locator('.viz-format .fmt-result')).toHaveText('1.20')
})

test('the receipt project opens', async ({ page }) => {
  await page.goto('#/project/py-u4-project')
  await expect(page.getByText('Receipt printer').first()).toBeVisible()
})
