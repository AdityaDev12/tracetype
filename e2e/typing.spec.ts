import { expect, test, type Page } from '@playwright/test'

const LESSON = '#/lesson/py-01-variables'

/** The text in the current line editor, without the faded ghost text. */
async function lineText(page: Page): Promise<string> {
  return page.locator('.code-row.current .cm-line').evaluate((el) => {
    const copy = el.cloneNode(true) as HTMLElement
    copy.querySelectorAll('.cm-ghost').forEach((g) => g.remove())
    return copy.textContent ?? ''
  })
}

async function ghostText(page: Page): Promise<string[]> {
  return page.locator('.code-row.current .cm-ghost').allTextContents()
}

async function openTrace(page: Page) {
  await page.goto(`${LESSON}/trace`)
  await expect(page.locator('.code-row.current .cm-content')).toBeFocused()
}

/** Types the first line correctly so the tests can work on later lines. */
async function finishLine(page: Page, typed: string) {
  await page.keyboard.type(typed)
  await page.keyboard.press('Enter')
}

test('typing ( gives () with the cursor inside, then filling in works', async ({ page }) => {
  await openTrace(page)
  await finishLine(page, 'player = "Maya')  // the closing quote is auto-added
  await finishLine(page, 'score = 10')
  await expect(page.locator('.code-row.current .gutter')).toHaveText('3')

  await page.keyboard.type('print(')
  expect(await lineText(page)).toBe('print()')
  // Missing part shows as ghost text at the cursor, and nothing is red.
  expect(await ghostText(page)).toEqual(['player'])
  await expect(page.locator('.code-row.current .cm-wrong')).toHaveCount(0)

  await page.keyboard.type('player')
  expect(await lineText(page)).toBe('print(player)')
  // Typing ) steps over the auto-closed one instead of adding a second.
  await page.keyboard.type(')')
  expect(await lineText(page)).toBe('print(player)')
  await page.keyboard.press('Enter')
  await expect(page.locator('.code-row.current .gutter')).toHaveText('4')
})

test('typing the closing quote steps over the auto-closed one', async ({ page }) => {
  await openTrace(page)
  await page.keyboard.type('player = "')
  expect(await lineText(page)).toBe('player = ""')
  await page.keyboard.type('Maya')
  expect(await lineText(page)).toBe('player = "Maya"')
  await page.keyboard.type('"')
  expect(await lineText(page)).toBe('player = "Maya"')
  await page.keyboard.press('Enter')
  await expect(page.locator('.code-row').first()).toHaveClass(/done/)
})

test('arrow keys, Home and End move the cursor to fix a typo', async ({ page }) => {
  await openTrace(page)
  await finishLine(page, 'player = "Maya')
  // Forget the "e" in score.
  await page.keyboard.type('scor = 10')
  await expect(page.locator('.code-row.current .cm-wrong').first()).toBeVisible()
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft')
  await page.keyboard.type('e')
  expect(await lineText(page)).toBe('score = 10')
  await expect(page.locator('.code-row.current .cm-wrong')).toHaveCount(0)

  // Home then End, then submit with the cursor at the end.
  await page.keyboard.press('Home')
  await page.keyboard.type('#')
  expect(await lineText(page)).toBe('#score = 10')
  await page.keyboard.press('Home')
  await page.keyboard.press('Delete')
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(page.locator('.code-row.current .gutter')).toHaveText('3')
  // A typo fixed before Enter does not cost accuracy.
  await expect(page.locator('.stats-bar')).toContainText('100%')
})

test('clicking moves the cursor inside the current line', async ({ page }) => {
  await openTrace(page)
  await page.keyboard.type('plyer')
  // Each typed character is its own span. Click on the left edge of the "y".
  const y = page.locator('.code-row.current .cm-line > span').nth(2)
  await expect(y).toHaveText('y')
  const box = (await y.boundingBox())!
  await page.mouse.click(box.x + 1, box.y + box.height / 2)
  await page.keyboard.type('a')
  expect(await lineText(page)).toBe('player')
})

test('undo and Cmd/Ctrl+Backspace work', async ({ page }) => {
  await openTrace(page)
  await page.keyboard.type('player = 5')
  await page.keyboard.press('ControlOrMeta+z')
  expect((await lineText(page)).length).toBeLessThan('player = 5'.length)
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  expect(await lineText(page)).toBe('')
})

test('wrong submit shakes, shows a message and lowers accuracy', async ({ page }) => {
  await openTrace(page)
  await page.keyboard.type('player = "Mayo')
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(page.locator('.submit-error')).toContainText('wrong')
  await expect(page.locator('.code-row.current .gutter')).toHaveText('1')
  await expect(page.locator('.stats-bar')).not.toContainText('100%')
})

test('recall uses the same editor and accepts loose matches', async ({ page }) => {
  await page.goto(`${LESSON}/recall`)
  await expect(page.locator('.code-row.current .cm-content')).toBeFocused()
  // No ghost text or red marks in recall.
  await page.keyboard.type("player='Mxya")
  await expect(page.locator('.code-row.current .cm-ghost')).toHaveCount(0)
  await expect(page.locator('.code-row.current .cm-wrong')).toHaveCount(0)
  // Fix the typo with the arrow keys, step over the closing quote, submit.
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('a')
  await page.keyboard.press('End')
  expect(await lineText(page)).toBe("player='Maya'")
  await page.keyboard.press('Enter')
  await expect(page.locator('.code-row').first()).toHaveClass(/done/)

  await page.getByRole('button', { name: /Peek/ }).click()
  await expect(page.locator('.peek-overlay')).toBeVisible()
  await expect(page.locator('.peek-overlay')).toBeHidden({ timeout: 3000 })
  await expect(page.locator('.stats-bar')).toContainText('Peeks1')
})

test('a full trace run finishes and is saved on the home page', async ({ page }) => {
  await openTrace(page)
  const lines = [
    'player = "Maya',
    'score = 10',
    'print(player',
    'print(score',
    'print(player, "has", score, "points',
    'score = 25',
    'print(player, "now has", score, "points',
    'winner = player',
    'print("Winner:", winner',
  ]
  for (const l of lines) {
    await page.keyboard.type(l)
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
  }
  await expect(page.locator('.complete-card')).toContainText('100% accuracy')
  await page.goto('#/')
  await expect(page.locator('.lesson-item .mode-dot.on')).toHaveCount(1)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('tap the line and type with phone keyboard style input', async ({ page }) => {
    await page.goto(`${LESSON}/trace`)
    await page.locator('.code-row.current .cm-content').tap()
    // Phone keyboards send text input events, not key presses.
    await page.keyboard.insertText('player = ')
    await page.keyboard.insertText('"')
    expect(await lineText(page)).toBe('player = ""')
    await page.keyboard.insertText('Maya')
    await page.keyboard.insertText('"')
    expect(await lineText(page)).toBe('player = "Maya"')
    await page.keyboard.press('Enter')
    await expect(page.locator('.code-row').first()).toHaveClass(/done/)
    await page.keyboard.insertText('score = 1')
    await page.screenshot({ path: 'test-results/phone-trace.png' })
  })
})
