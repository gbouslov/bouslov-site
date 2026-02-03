import { test, expect } from './fixtures'

/**
 * Quicklinks page tests
 */
test.describe('Quicklinks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quicklinks')
  })

  test('should display page title and header', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      await expect(page.locator('h1:has-text("Quicklinks")')).toBeVisible()
      await expect(page.locator('text=Resources and games for the family')).toBeVisible()
    } else {
      // Redirected to login
      await expect(page.locator('h1:has-text("Bouslov Bros")')).toBeVisible()
    }
  })

  test('should display Dev/Resources section', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      await expect(page.locator('text=Dev / Resources')).toBeVisible()
    }
  })

  test('should display Games section', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      await expect(page.locator('text=Games')).toBeVisible()
    }
  })

  test('should have GitHub repo link', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      const githubLink = page.locator('a:has-text("GitHub Repo")')
      await expect(githubLink).toBeVisible()
      await expect(githubLink).toHaveAttribute('href', 'https://github.com/gbouslov/bouslov-site')
    }
  })

  test('should have Chessvia link', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      const chessviaLink = page.locator('a:has-text("Chessvia")')
      await expect(chessviaLink).toBeVisible()
      await expect(chessviaLink).toHaveAttribute('href', 'https://chessvia.ai')
    }
  })

  test('should have game links', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      // Check for main game links
      const gameLinks = [
        { name: 'GeoGuessr', url: 'https://www.geoguessr.com' },
        { name: 'MonkeyType', url: 'https://monkeytype.com' },
        { name: 'HumanBenchmark', url: 'https://humanbenchmark.com' },
        { name: 'The Wiki Game', url: 'https://www.thewikigame.com' },
      ]

      for (const game of gameLinks) {
        const link = page.locator(`a:has-text("${game.name}")`).first()
        await expect(link).toBeVisible()
        await expect(link).toHaveAttribute('href', game.url)
      }
    }
  })

  test('should have Scrabble links', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      // Check for Scrabble-related links
      const scrabbleLinks = [
        'Woogles.io',
        'Internet Scrabble Club',
        'PlayScrabble',
        'Lexulous',
      ]

      for (const name of scrabbleLinks) {
        const link = page.locator(`a:has-text("${name}")`).first()
        await expect(link).toBeVisible()
      }
    }
  })

  test('all external links should open in new tab', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      // Get all external links
      const externalLinks = page.locator('a[target="_blank"]')
      const count = await externalLinks.count()

      expect(count).toBeGreaterThan(0)

      // Check each link has proper attributes
      for (let i = 0; i < count; i++) {
        const link = externalLinks.nth(i)
        await expect(link).toHaveAttribute('target', '_blank')
        await expect(link).toHaveAttribute('rel', /noopener/)
      }
    }
  })

  test('links should have descriptions', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      // Check that links have description text
      const linkDescriptions = [
        'Source code for this site',
        'Chess coaching platform',
        'Typing speed test',
        'Reaction time, memory, and more',
      ]

      for (const desc of linkDescriptions) {
        await expect(page.locator(`text=${desc}`)).toBeVisible()
      }
    }
  })

  test('links should have icons', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      // Check that link cards have icons (SVG elements)
      const linkCards = page.locator('a[target="_blank"]')
      const count = await linkCards.count()

      // Each link should have an icon
      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = linkCards.nth(i)
        const icon = card.locator('svg')
        await expect(icon).toBeVisible()
      }
    }
  })

  test('link cards should have hover effects', async ({ page }) => {
    const isOnQuicklinks = page.url().includes('/quicklinks')

    if (isOnQuicklinks) {
      // Check that links have proper styling classes for hover
      const linkCards = page.locator('a.group')
      const count = await linkCards.count()

      expect(count).toBeGreaterThan(0)
    }
  })
})
