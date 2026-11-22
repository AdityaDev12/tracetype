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
