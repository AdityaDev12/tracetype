import { expect, test, type Page } from '@playwright/test'
import lesson from '../content/lessons/python/py-01-variables.json' with { type: 'json' }

/** Predict, Faded, Fix, Recall and Make items each become a review card. */
const CARD_COUNT = lesson.predict.length + lesson.faded.length + lesson.fix.length + lesson.recall.length + lesson.make.length

// Plays lesson 1 from start to finish with real Python (Pyodide from the CDN),
// using every exercise type. Python takes a few seconds to download the first
// time, so these tests get a long timeout.

const LESSON = '#/lesson/py-01-variables'
const exact = (s: string) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)

async function choose(page: Page, text: string) {
  await page.locator('.choice').filter({ has: page.locator('.choice-text', { hasText: exact(text) }) }).click()
}

async function next(page: Page) {
  await page.getByRole('button', { name: /^(Next|Continue|Next example|See score|Next mistake|Finish lesson) →$/ }).click()
}

/** Replace everything in the code editor (insertText skips auto-closing). */
async function setCode(page: Page, code: string) {
  const content = page.locator('.code-editor .cm-content')
  await content.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.insertText(code)
}

async function check(page: Page) {
  await page.getByRole('button', { name: 'Check' }).click()
}

async function typeExample(page: Page, lines: string[]) {
  await expect(page.locator('.code-row.current .cm-content')).toBeFocused({ timeout: 10000 })
  for (const l of lines) {
    // Typing a closing quote or bracket steps over the auto-closed one.
    await page.keyboard.type(l)
    await page.keyboard.press('Enter')
  }
}

test.describe('lesson 1, every step with real Python', () => {
  test.setTimeout(180_000)

  test('plays the whole lesson and creates review cards', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(LESSON)

    // Intro
    await expect(page.locator('.analogy')).toContainText('sticky label')
    await page.getByRole('button', { name: 'Start →' }).click()

    // Predict: a choice, then a typed answer. The run plays in the memory panel.
    await choose(page, 'mango')
    await expect(page.locator('.reveal')).toContainText('You called it')
    await next(page)
    await page.locator('.typed-answer textarea').fill('1')
    await page.keyboard.press('Enter')
    await expect(page.locator('.reveal')).toContainText('It prints')
    await expect(page.locator('.visual-stack .toutput')).toContainText('5', { timeout: 5000 })
    await next(page)

    // Worked examples: Learn (step through) then Trace (type over), three times.
    const examples = [
      { steps: 5, lines: ['city = "Lima"', 'temp = 18', 'print(city)', 'print(temp)', 'print(city, temp)'] },
      { steps: 4, lines: ['coins = 3', 'print("Coins:", coins)', 'coins = 7', 'print("Coins:", coins)'] },
      { steps: 5, lines: ['first = "Ana"', 'leader = first', 'first = "Bo"', 'print(leader)', 'print(first)'] },
    ]
    for (const [i, ex] of examples.entries()) {
      for (let s = 0; s < ex.steps; s++) await page.keyboard.press('ArrowRight')
      if (i === 1) {
        // The tutor marks the line that replaces the value, memory shows the old one crossed out.
        await page.keyboard.press('ArrowLeft')
        await expect(page.locator('.anno-note')).toContainText('the old 3 is gone')
        await expect(page.locator('.mem-was-text')).toContainText('was 3')
        await page.keyboard.press('ArrowRight')
      }
      await page.getByRole('button', { name: 'Now type it →' }).click()
      await typeExample(page, ex.lines)
      await page.getByRole('button', { name: i < 2 ? 'Next example →' : 'Continue →' }).click()
    }

    // Investigate: a wrong pick is fine, then the right one.
    await choose(page, 'Line 5')
    await next(page)
    await choose(page, '7')
    await next(page)
    await choose(page, "'Bo'")
    await expect(page.locator('.fb-retry')).toContainText('no penalty')
    await choose(page, "'Ana'")
    await next(page)

    // Faded: checked by really running the filled-in program.
    await page.getByLabel('Blank 1').fill('drink')
    await check(page)
    await expect(page.locator('.tt-toast.ok')).toBeVisible({ timeout: 90_000 })
    await next(page)
    // Text instead of numbers: same output, but the variable is a str. Twice, then Show answer.
    await page.getByLabel('Blank 1').fill('"12"')
    await page.getByLabel('Blank 2').fill('"15"')
    await check(page)
    await expect(page.locator('.fb-wrong')).toContainText("apples holds '15', expected 15 (str instead of int)")
    await expect(page.getByRole('button', { name: 'show answer' })).toHaveCount(0)
    await check(page)
    await page.getByRole('button', { name: 'show answer' }).click()
    await expect(page.getByLabel('Blank 1')).toHaveValue('12')
    await next(page)

    // Parsons: put the lines in order with the arrow buttons.
    const target = ['player = "Sam"', 'points = 40', 'print(player)', 'print(player, "scored", points)']
    for (let i = 0; i < target.length; i++) {
      const rows = await page.locator('.parsons-code').allTextContents()
      let at = rows.indexOf(target[i])
      while (at > i) {
        await page.getByRole('button', { name: `Move line ${at + 1} up` }).click()
        at--
      }
    }
    await check(page)
    await expect(page.locator('.tt-toast.ok')).toBeVisible()
    await next(page)

    // Fix: the real error and a plain explanation first, then the fix.
    await check(page)
    // The real message (Python offers no "Did you mean" for this short typo).
    await expect(page.locator('.fb-error')).toContainText("NameError: name 'aeg' is not defined")
    await expect(page.locator('.fb-plain')).toContainText('You used the name aeg, which does not exist yet')
    await setCode(page, 'pet = "Milo"\nage = 4\nprint(pet, "is", age)\n')
    await check(page)
    await expect(page.locator('.tt-toast.ok')).toContainText('all checks pass')
    await next(page)

    // Modify: Run shows real memory, then two tasks pass their hidden tests.
    await page.getByRole('button', { name: 'run' }).click()
    await expect(page.locator('.visual-stack .toutput')).toContainText('Blue Sky played 10 times')
    await setCode(page, 'song = "Blue Sky"\nplays = 25\nprint(song, "played", plays, "times")\n')
    await check(page)
    await expect(page.locator('.tt-toast.ok')).toBeVisible()
    await next(page)
    await setCode(page, 'name = "Kai"\nprint("Hello", name)\ntown = "Oslo"\nprint(name, "lives in", town)\n')
    await check(page)
    await expect(page.locator('.tt-toast.ok')).toBeVisible()
    await next(page)

    // Recall: different spacing and quotes still count as the same code (AST compare).
    await setCode(page, "coins=3\nprint('Coins:',coins)\ncoins=7\nprint( 'Coins:', coins )\n")
    await check(page)
    await expect(page.locator('.tt-toast.ok')).toContainText('same code')
    await next(page)

    // Make: a failing test says which check failed, in plain words.
    await setCode(page, 'book = "Night Train"\npages = "212"\nprint(book, "has", pages, "pages")\n')
    await check(page)
    await expect(page.locator('.fb-wrong')).toContainText('pages should hold the number 212, without quotes')
    await setCode(page, 'book = "Night Train"\npages = 212\nprint(book, "has", pages, "pages")\n')
    await check(page)
    await expect(page.locator('.tt-toast.ok')).toBeVisible()
    await next(page)

    // Quiz: six questions, then the score.
    for (const answer of ['25', 'player', 'a 5 b', '4', 'print(total)', 'high_score']) {
      await choose(page, answer)
      await next(page)
    }
    await expect(page.locator('.quiz-done')).toContainText('6 of 6 right on the first try')
    await next(page)

    // Common mistakes show the real error message.
    await expect(page.locator('.fb-error').first()).toContainText("NameError: name 'budget' is not defined")
    await next(page)
    await next(page)
    await next(page)

    await expect(page.locator('.lesson-complete')).toContainText('lesson complete')
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('tracetype:progress:v2') ?? '{}'))
    expect(Object.keys(progress.cards).length).toBe(CARD_COUNT)
    // Faded 2 used "Show answer", so its card is due today.
    const today = await page.evaluate(() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
    expect(progress.cards['py-01-variables:f2'].due).toBe(today)
    expect(progress.xp).toBeGreaterThanOrEqual(12 * 10 + 50)
    expect(errors).toEqual([])
  })

  test('an infinite loop is stopped by the time limit', async ({ page }) => {
    await page.goto(`${LESSON}/make`)
    await setCode(page, 'while True:\n    pass\n')
    await check(page)
    await expect(page.locator('.fb-plain')).toContainText('loop', { timeout: 120_000 })
    // A fresh Python starts, and the next check works.
    await setCode(page, 'book = "Night Train"\npages = 212\nprint(book, "has", pages, "pages")\n')
    await check(page)
    await expect(page.locator('.tt-toast.ok')).toBeVisible({ timeout: 90_000 })
  })

  test('resumes at the step where you left off', async ({ page }) => {
    await page.goto(`${LESSON}/parsons`)
    await expect(page.locator('.lstep.current')).toContainText('Parsons')
    await page.goto('#/style')
    await page.goto(LESSON)
    await expect(page.locator('.lstep.current')).toContainText('Parsons')
  })
})

test('when Python cannot load, the lesson still works with fallbacks', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort())
  await page.goto(`${LESSON}/faded`)
  await expect(page.locator('.runner-notice.failed')).toContainText('Python could not load', { timeout: 30_000 })
  await page.getByLabel('Blank 1').fill('drink')
  await check(page)
  await expect(page.locator('.tt-toast.ok')).toContainText('checked without running Python')
  // Code tasks cannot be checked without Python, so the answer can be shown at once.
  await page.goto(`${LESSON}/fix`)
  await expect(page.getByRole('button', { name: 'show answer' })).toBeVisible({ timeout: 30_000 })
})
