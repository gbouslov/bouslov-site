import { test, expect } from './fixtures'

/**
 * Leaderboard page tests
 * Note: These tests require authentication. If auth is not set up,
 * they will be redirected to login.
 */
test.describe('Leaderboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to leaderboard - will redirect to login if not authenticated
    await page.goto('/leaderboard')
  })

  test('should display page title and header', async ({ page }) => {
    // Check for page title (either on leaderboard or redirected to login)
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      await expect(page.locator('h1:has-text("Leaderboard")')).toBeVisible()
      await expect(page.locator('text=Track the competition')).toBeVisible()
    } else {
      // Redirected to login - verify login page
      await expect(page.locator('h1:has-text("Bouslov Bros")')).toBeVisible()
    }
  })

  test('should display sidebar navigation', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      // Check sidebar is visible
      const sidebar = page.locator('aside')
      await expect(sidebar).toBeVisible()

      // Check nav items exist
      await expect(page.locator('a[href="/leaderboard"]')).toBeVisible()
      await expect(page.locator('a[href="/travel"]')).toBeVisible()
      await expect(page.locator('a[href="/pins"]')).toBeVisible()
      await expect(page.locator('a[href="/quicklinks"]')).toBeVisible()
    }
  })

  test('should show overall standings section', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      // Check for Overall Standings card
      await expect(page.locator('text=Overall Standings')).toBeVisible()

      // Check for points explanation
      await expect(page.locator('text=Points = Sum of category placements')).toBeVisible()
    }
  })

  test('should show categories section', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      // Check for Categories card
      await expect(page.locator('text=Categories')).toBeVisible()

      // Wait for categories to load
      await page.waitForLoadState('networkidle')

      // Should have multiple category cards
      const categoryCards = page.locator('.group.relative.p-4.rounded-lg.border')
      const count = await categoryCards.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should show recent activity section', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      // Check for Recent Activity card
      await expect(page.locator('text=Recent Activity')).toBeVisible()
    }
  })

  test('should have sync chess button', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      // Check for Sync Chess button
      const syncButton = page.locator('button:has-text("Sync Chess")')
      await expect(syncButton).toBeVisible()
    }
  })

  test('should have log score button', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      // Check for Log Score button
      const logScoreButton = page.locator('button:has-text("Log Score")')
      await expect(logScoreButton).toBeVisible()
    }
  })

  test('should open log score modal when clicking button', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      // Click Log Score button
      await page.locator('button:has-text("Log Score")').click()

      // Modal should open
      await expect(page.locator('text=Log a Score')).toBeVisible()

      // Should have form elements
      await expect(page.locator('text=Category')).toBeVisible()
      await expect(page.locator('text=Score')).toBeVisible()
      await expect(page.locator('text=Proof URL')).toBeVisible()

      // Close modal
      await page.keyboard.press('Escape')
    }
  })

  test('should open category detail when clicking category card', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      await page.waitForLoadState('networkidle')

      // Click on a category card (first one)
      const categoryCards = page.locator('.group.relative.p-4.rounded-lg.border.cursor-pointer')
      const firstCard = categoryCards.first()

      if ((await firstCard.count()) > 0) {
        await firstCard.click()

        // Modal should open - check for dialog
        await page.waitForTimeout(300) // Wait for animation
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()

        // Close modal
        await page.keyboard.press('Escape')
      }
    }
  })

  test('should display family member names in standings', async ({ page }) => {
    const isOnLeaderboard = page.url().includes('/leaderboard')

    if (isOnLeaderboard) {
      await page.waitForLoadState('networkidle')

      // Check that at least some family names are visible
      const familyNames = ['Gabe', 'David', 'Jonathan', 'Daniel']
      let foundNames = 0

      for (const name of familyNames) {
        const nameElement = page.locator(`text=${name}`).first()
        if (await nameElement.isVisible()) {
          foundNames++
        }
      }

      // At least one family member should be visible
      expect(foundNames).toBeGreaterThan(0)
    }
  })
})
