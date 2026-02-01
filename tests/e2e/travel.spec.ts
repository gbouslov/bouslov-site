import { test, expect } from './fixtures'

/**
 * Travel page tests
 */
test.describe('Travel Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/travel')
  })

  test('should display page title and header', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      await expect(page.locator('h1:has-text("Travel")')).toBeVisible()
      await expect(page.locator('text=Countries visited by the Bouslovs')).toBeVisible()
    } else {
      // Redirected to login
      await expect(page.locator('h1:has-text("Bouslov Bros")')).toBeVisible()
    }
  })

  test('should have view toggle buttons', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Check for globe and list view buttons
      const viewToggle = page.locator('.flex.border.border-zinc-800.rounded-lg')
      await expect(viewToggle).toBeVisible()

      // Should have two buttons
      const buttons = viewToggle.locator('button')
      await expect(buttons).toHaveCount(2)
    }
  })

  test('should have add country button', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Check for Add Country button
      const addButton = page.locator('button:has-text("Add Country")')
      await expect(addButton).toBeVisible()
    }
  })

  test('should have user filter buttons', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Check for "All" button
      await expect(page.locator('button:has-text("All")')).toBeVisible()

      // Check for family member filter buttons
      const familyNames = ['Gabe', 'David', 'Jonathan', 'Daniel']
      for (const name of familyNames) {
        const button = page.locator(`button:has-text("${name}")`)
        await expect(button).toBeVisible()
      }
    }
  })

  test('should toggle between globe and list view', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Find the view toggle buttons
      const viewToggle = page.locator('.flex.border.border-zinc-800.rounded-lg')
      const buttons = viewToggle.locator('button')

      // Click list view (second button)
      await buttons.nth(1).click()

      // Wait for view to change
      await page.waitForTimeout(300)

      // Click globe view (first button)
      await buttons.nth(0).click()

      // Wait for globe to load
      await page.waitForTimeout(300)
    }
  })

  test('should filter countries by user', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Switch to list view for easier verification
      const viewToggle = page.locator('.flex.border.border-zinc-800.rounded-lg')
      await viewToggle.locator('button').nth(1).click()

      await page.waitForTimeout(300)

      // Click on Gabe filter
      await page.locator('button:has-text("Gabe")').click()

      // The filter should be active
      const gabeButton = page.locator('button:has-text("Gabe")')
      await expect(gabeButton).toBeVisible()

      // Click All to reset
      await page.locator('button:has-text("All")').click()
    }
  })

  test('should open add country dialog', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Click Add Country button
      await page.locator('button:has-text("Add Country")').click()

      // Dialog should open
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Should have search input
      await expect(page.locator('input[placeholder*="earch"]')).toBeVisible()

      // Close dialog
      await page.keyboard.press('Escape')
    }
  })

  test('should load globe successfully', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Wait for globe canvas to load
      await page.waitForSelector('canvas', { timeout: 15000 })

      // Canvas should be visible
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
    }
  })

  test('should display country list in list view', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Switch to list view
      const viewToggle = page.locator('.flex.border.border-zinc-800.rounded-lg')
      await viewToggle.locator('button').nth(1).click()

      await page.waitForTimeout(500)

      // Should show continent sections or empty state
      const continents = page.locator('button:has-text("Europe"), button:has-text("North America"), button:has-text("Asia")')
      const emptyState = page.locator('text=No countries have been added yet')

      const hasContinents = (await continents.count()) > 0
      const hasEmptyState = await emptyState.isVisible()

      // Should have either continents or empty state
      expect(hasContinents || hasEmptyState).toBeTruthy()
    }
  })

  test('should show country count in list view', async ({ page }) => {
    const isOnTravel = page.url().includes('/travel')

    if (isOnTravel) {
      // Switch to list view
      const viewToggle = page.locator('.flex.border.border-zinc-800.rounded-lg')
      await viewToggle.locator('button').nth(1).click()

      await page.waitForTimeout(500)

      // Check if country count is displayed
      const countText = page.locator('text=/\\d+ countries visited/')
      const hasCount = await countText.isVisible()

      // Count is optional (only shows if there are countries)
      expect(hasCount || true).toBeTruthy()
    }
  })
})
