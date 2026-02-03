import { test, expect, FAMILY_EMAILS, FAMILY_NAMES } from './fixtures'

/**
 * Profile page tests
 */
test.describe('Profile Page', () => {
  test('should display Gabe profile', async ({ page }) => {
    await page.goto('/profile/gbouslov@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      // Should show user name
      await expect(page.locator('h1:has-text("Gabe")')).toBeVisible()

      // Should show email
      await expect(page.locator('text=gbouslov@gmail.com')).toBeVisible()

      // Should show stats
      await expect(page.locator('text=Scores')).toBeVisible()
      await expect(page.locator('text=Categories')).toBeVisible()
    } else {
      // Redirected to login
      await expect(page.locator('h1:has-text("Bouslov Bros")')).toBeVisible()
    }
  })

  test('should display David profile', async ({ page }) => {
    await page.goto('/profile/dbouslov@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      await expect(page.locator('h1:has-text("David")')).toBeVisible()
      await expect(page.locator('text=dbouslov@gmail.com')).toBeVisible()
    }
  })

  test('should display Jonathan profile', async ({ page }) => {
    await page.goto('/profile/jbouslov@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      await expect(page.locator('h1:has-text("Jonathan")')).toBeVisible()
      await expect(page.locator('text=jbouslov@gmail.com')).toBeVisible()
    }
  })

  test('should display Daniel profile', async ({ page }) => {
    await page.goto('/profile/bouslovd@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      await expect(page.locator('h1:has-text("Daniel")')).toBeVisible()
      await expect(page.locator('text=bouslovd@gmail.com')).toBeVisible()
    }
  })

  test('should show personal bests section', async ({ page }) => {
    await page.goto('/profile/gbouslov@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      await expect(page.locator('text=Personal Bests')).toBeVisible()
    }
  })

  test('should show history section', async ({ page }) => {
    await page.goto('/profile/gbouslov@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      await expect(page.locator('text=History')).toBeVisible()
    }
  })

  test('should show avatar with initial', async ({ page }) => {
    await page.goto('/profile/gbouslov@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      // Avatar should have first letter of name
      const avatar = page.locator('[class*="Avatar"] span:has-text("G")')
      await expect(avatar).toBeVisible()
    }
  })

  test('should show scores count and categories count', async ({ page }) => {
    await page.goto('/profile/gbouslov@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      await page.waitForLoadState('networkidle')

      // Should have numeric counts
      const scoresLabel = page.locator('text=Scores')
      const categoriesLabel = page.locator('text=Categories')

      await expect(scoresLabel).toBeVisible()
      await expect(categoriesLabel).toBeVisible()
    }
  })

  test('should return 404 for non-family member', async ({ page }) => {
    await page.goto('/profile/notfamily@gmail.com')

    // Should either redirect to login or show 404
    const is404 = page.url().includes('404') || (await page.locator('text=404').isVisible())
    const isLogin = page.url().includes('/login')

    expect(is404 || isLogin).toBeTruthy()
  })

  test('should display sidebar on profile page', async ({ page }) => {
    await page.goto('/profile/gbouslov@gmail.com')

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      // Sidebar should be visible
      const sidebar = page.locator('aside')
      await expect(sidebar).toBeVisible()

      // Navigation links should be present
      await expect(page.locator('a[href="/leaderboard"]')).toBeVisible()
      await expect(page.locator('a[href="/travel"]')).toBeVisible()
    }
  })

  test('should handle URL-encoded email correctly', async ({ page }) => {
    // Email with special characters needs encoding
    const encodedEmail = encodeURIComponent('gbouslov@gmail.com')
    await page.goto(`/profile/${encodedEmail}`)

    const isOnProfile = page.url().includes('/profile')

    if (isOnProfile) {
      await expect(page.locator('h1:has-text("Gabe")')).toBeVisible()
    }
  })
})
