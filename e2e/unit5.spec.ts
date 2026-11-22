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
