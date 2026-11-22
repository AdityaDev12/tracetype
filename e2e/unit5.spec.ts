import { expect, test } from '@playwright/test'
import { stepForward } from './steps.ts'

// Unit 5: list cells (one box per item, with the index used), new and changed
// cells and removed items, the copy-or-share choice knob, and split cut marks.

test('list cells show one box per item and light the index used', async ({ page }) => {
  await page.goto('#/lesson/py-26-making-lists/examples')
  await stepForward(page, 2)
  await expect(page.locator('.viz-cells')).toContainText('one box per item')
  await expect(page.locator('.viz-cells .cell')).toHaveCount(4)
  await expect(page.locator('.viz-cells .cell.pick .cell-val')).toHaveText('18')
})

test('changing a list: a replaced cell shows its old value, append adds a new cell', async ({ page }) => {
  await page.goto('#/lesson/py-27-changing-lists/examples')
  await stepForward(page, 2)
  await expect(page.locator('.viz-cells .cell.changed .cell-val')).toHaveText('6')
  await expect(page.locator('.viz-cells .cell-was')).toHaveText('was 4')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.viz-cells .cell.new .cell-val')).toHaveText('8')
  await expect(page.locator('.viz-cells .cell')).toHaveCount(4)
})

test('looping over a list moves the pointer from cell to cell', async ({ page }) => {
  await page.goto('#/lesson/py-28-looping-over-lists/examples')
  await stepForward(page, 4)
  await expect(page.locator('.viz-cells .cell.at .cell-val')).toHaveText('4')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.viz-cells .cell.at .cell-val')).toHaveText('12')
  await expect(page.locator('.viz-loop')).toContainText('round 2')
})
