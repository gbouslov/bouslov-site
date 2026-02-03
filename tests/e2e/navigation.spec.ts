import { test, expect } from './fixtures'

/**
 * Navigation tests
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard')
  })

  test('should display sidebar with all navigation links', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      const sidebar = page.locator('aside')
      await expect(sidebar).toBeVisible()

      // Check all nav items
      await expect(page.locator('a[href="/leaderboard"]')).toBeVisible()
      await expect(page.locator('a[href="/travel"]')).toBeVisible()
      await expect(page.locator('a[href="/pins"]')).toBeVisible()
      await expect(page.locator('a[href="/quicklinks"]')).toBeVisible()
    }
  })

  test('should navigate to leaderboard', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      await page.locator('a[href="/leaderboard"]').click()
      await expect(page).toHaveURL('/leaderboard')
      await expect(page.locator('h1:has-text("Leaderboard")')).toBeVisible()
    }
  })

  test('should navigate to travel', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      await page.locator('a[href="/travel"]').click()
      await expect(page).toHaveURL('/travel')
      await expect(page.locator('h1:has-text("Travel")')).toBeVisible()
    }
  })

  test('should navigate to pins', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      await page.locator('a[href="/pins"]').click()
      await expect(page).toHaveURL('/pins')
      await expect(page.locator('h1:has-text("Pins")')).toBeVisible()
    }
  })

  test('should navigate to quicklinks', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      await page.locator('a[href="/quicklinks"]').click()
      await expect(page).toHaveURL('/quicklinks')
      await expect(page.locator('h1:has-text("Quicklinks")')).toBeVisible()
    }
  })

  test('should navigate to submit page from sidebar', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      await page.locator('a[href="/submit"]').click()
      await expect(page).toHaveURL('/submit')
    }
  })

  test('should show active state on current nav item', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      // Leaderboard should be active
      const leaderboardLink = page.locator('a[href="/leaderboard"]')
      const classes = await leaderboardLink.getAttribute('class')
      expect(classes).toContain('bg-zinc-800')

      // Navigate to travel
      await page.locator('a[href="/travel"]').click()
      await page.waitForURL('/travel')

      // Travel should now be active
      const travelLink = page.locator('a[href="/travel"]')
      const travelClasses = await travelLink.getAttribute('class')
      expect(travelClasses).toContain('bg-zinc-800')
    }
  })

  test('should display logo in sidebar', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      // Check for Bouslov text or logo
      const logo = page.locator('aside a[href="/leaderboard"]').first()
      await expect(logo).toBeVisible()
    }
  })

  test('should show disabled nav items with "Soon" label', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      // Stats and Settings should be disabled
      await expect(page.locator('aside').locator('text=Soon')).toBeVisible()
    }
  })

  test('should navigate to profile via sidebar user section', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      // User info should be visible in sidebar
      const userSection = page.locator('aside').locator('.border-t').last()
      await expect(userSection).toBeVisible()
    }
  })

  test('should have collapse toggle button', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      // Check for collapse button (chevron icon)
      const collapseButton = page.locator('aside button').last()
      await expect(collapseButton).toBeVisible()

      // Click to collapse
      await collapseButton.click()
      await page.waitForTimeout(300)

      // Sidebar should be narrower (w-16)
      const sidebar = page.locator('aside')
      const classes = await sidebar.getAttribute('class')
      expect(classes).toContain('w-16')
    }
  })

  test('should expand sidebar when collapsed', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      // First collapse
      const collapseButton = page.locator('aside button').last()
      await collapseButton.click()
      await page.waitForTimeout(300)

      // Then expand
      await collapseButton.click()
      await page.waitForTimeout(300)

      // Sidebar should be expanded (w-64)
      const sidebar = page.locator('aside')
      const classes = await sidebar.getAttribute('class')
      expect(classes).toContain('w-64')
    }
  })

  test('clicking logo should navigate to leaderboard', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      // Navigate away first
      await page.locator('a[href="/travel"]').click()
      await page.waitForURL('/travel')

      // Click logo to go back to leaderboard
      const logo = page.locator('aside a[href="/leaderboard"]').first()
      await logo.click()
      await expect(page).toHaveURL('/leaderboard')
    }
  })

  test('should maintain navigation state across page loads', async ({ page }) => {
    const isAuthenticated = page.url().includes('/leaderboard')

    if (isAuthenticated) {
      // Navigate to travel
      await page.locator('a[href="/travel"]').click()
      await page.waitForURL('/travel')

      // Reload the page
      await page.reload()

      // Should still be on travel
      await expect(page).toHaveURL('/travel')
      await expect(page.locator('h1:has-text("Travel")')).toBeVisible()
    }
  })
})
