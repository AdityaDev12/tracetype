import { expect, type Page } from '@playwright/test'

const START = 'Press Next or → to run the first line'

/** Step an example forward n times. Waits until the first press has landed,
 * so presses sent while the example is still mounting are not lost. */
export async function stepForward(page: Page, n: number) {
  await expect(page.locator('.tcode')).toBeVisible()
  await expect(async () => {
    if (await page.getByText(START).count()) await page.keyboard.press('ArrowRight')
    await expect(page.getByText(START)).toHaveCount(0, { timeout: 500 })
  }).toPass()
  for (let i = 1; i < n; i++) await page.keyboard.press('ArrowRight')
}
