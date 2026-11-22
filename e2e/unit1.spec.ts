import { expect, test, type Page } from '@playwright/test'
import { stepForward } from './steps.ts'

// Unit 1 visuals with real Python (Pyodide from the CDN): knobs rerun the code,
// the timeline scrubs, the input tape feeds input(), and errors show where the
// program stopped.

test.setTimeout(180_000)

async function setCode(page: Page, code: string) {
  const content = page.locator('.code-editor .cm-content')
  await content.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText(code)
}

test('a knob reruns the example and the timeline scrubs through it', async ({ page }) => {
  await page.goto('#/lesson/py-03-numbers/examples')
  // Example 1: step to the end, then change price with its knob.
  await expect(page.locator('.tcode')).toBeVisible()
  await stepForward(page, 6)
  await expect(page.locator('.visual-stack .toutput')).toContainText('12\n6.0')
  await expect(page.locator('.viz-expr')).toContainText('half = 6.0')
  const price = page.locator('.knob').filter({ hasText: 'price' }).locator('input[type="number"]')
  await price.fill('5')
  await expect(page.locator('.visual-stack .toutput')).toContainText('15\n7.5', { timeout: 120_000 })
  // Scrub back to the start: nothing has printed yet.
  await page.locator('.timeline-range').fill('-1')
  await expect(page.locator('.visual-stack .toutput')).not.toContainText('15')
})

test('a predict item that stops with an error shows where it stopped', async ({ page }) => {
  await page.goto('#/lesson/py-02-running-code/predict')
  await page.locator('.choice').filter({ has: page.locator('.choice-text', { hasText: /^one\nthree$/ }) }).click()
  await page.getByRole('button', { name: 'Next →' }).click({ timeout: 15_000 })
  await page.locator('.choice').filter({ has: page.locator('.choice-text', { hasText: /^plum\nNameError$/ }) }).click()
  await expect(page.locator('.viz-halt')).toContainText('Line 4 never ran', { timeout: 15_000 })
  await expect(page.locator('.tline.never')).toHaveCount(1)
})

test('the input tape feeds input() and the fix passes with typed answers', async ({ page }) => {
  await page.goto('#/lesson/py-07-input/fix')
  await expect(page.locator('.stdin-box textarea')).toHaveValue('14')
  await page.getByRole('button', { name: 'run' }).click({ timeout: 120_000 })
  await expect(page.locator('.fb-error')).toContainText('can only concatenate str', { timeout: 120_000 })
  await setCode(page, 'age = int(input("Age? "))\nprint(age + 1)\n')
  await page.locator('.stdin-box textarea').fill('20')
  await page.getByRole('button', { name: 'run' }).click()
  await expect(page.locator('.visual-stack .toutput')).toContainText('Age? 20\n21')
  await expect(page.locator('.viz-stdin .tape-cell')).toHaveCount(1)
  await page.getByRole('button', { name: 'Check' }).click()
  await expect(page.locator('.tt-toast.ok')).toContainText('all checks pass')
})
