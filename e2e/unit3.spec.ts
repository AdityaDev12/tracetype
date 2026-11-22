import { expect, test } from '@playwright/test'
import { stepForward } from './steps.ts'

// Unit 3: the loop panel counts rounds, the trace table grows a row per round,
// the grid lights nested-loop cells, and the cells pointer follows a for loop.

test('loop panel and trace table follow the rounds', async ({ page }) => {
  await page.goto('#/lesson/py-16-accumulators/examples')
  await expect(page.locator('.tcode')).toBeVisible()
  await stepForward(page, 11)
  await expect(page.locator('.viz-loop .loop-status')).toHaveText('done after 4 rounds')
  await expect(page.locator('.viz-tracetable tbody tr')).toHaveCount(4)
  await expect(page.locator('.viz-tracetable tbody tr').last()).toContainText('10000')
})

test('the grid lights one cell per inner round', async ({ page }) => {
  await page.goto('#/lesson/py-19-nested-loops/examples')
  await expect(page.locator('.tcode')).toBeVisible()
  await stepForward(page, 17)
  await expect(page.locator('.viz-grid td.seen, .viz-grid td.now')).toHaveCount(6)
})

test('the cells pointer moves along the word', async ({ page }) => {
  await page.goto('#/lesson/py-20-looping-text/examples')
  await expect(page.locator('.tcode')).toBeVisible()
  await stepForward(page, 4)
  await expect(page.locator('.viz-cells .cell.at .cell-val')).toHaveText('o')
})
