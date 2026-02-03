import { test, expect } from '@playwright/test'
import { LoginPage } from './pages'

/**
 * Authentication tests for unauthenticated users
 * These tests run without authentication to verify auth protection
 */
test.describe('Authentication - Unauthenticated', () => {
  test('should show login page', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    // Should show Bouslov Bros branding
    await expect(page.locator('h1:has-text("Bouslov Bros")')).toBeVisible()

    // Should show sign in button
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible()

    // Should show family members only message
    await expect(page.locator('text=Family members only')).toBeVisible()

    // Should show authorized emails
    await expect(page.locator('text=gbouslov')).toBeVisible()
  })

  test('should redirect protected routes to login', async ({ page }) => {
    // Try accessing leaderboard
    await page.goto('/leaderboard')
    await expect(page).toHaveURL('/login')

    // Try accessing travel
    await page.goto('/travel')
    await expect(page).toHaveURL('/login')

    // Try accessing pins
    await page.goto('/pins')
    await expect(page).toHaveURL('/login')

    // Try accessing quicklinks
    await page.goto('/quicklinks')
    await expect(page).toHaveURL('/login')

    // Try accessing profile
    await page.goto('/profile/gbouslov@gmail.com')
    await expect(page).toHaveURL('/login')

    // Try accessing submit page
    await page.goto('/submit')
    await expect(page).toHaveURL('/login')
  })

  test('should show access denied error for non-family members', async ({ page }) => {
    // Navigate to login with error query param
    await page.goto('/login?error=AccessDenied')

    // Should show error message
    await expect(page.locator('text=Access denied')).toBeVisible()
    await expect(page.locator('text=Bouslov family members only')).toBeVisible()
  })

  test('should show generic error for other auth failures', async ({ page }) => {
    // Navigate to login with generic error
    await page.goto('/login?error=OAuthSignin')

    // Should show generic error message
    await expect(page.locator('text=Something went wrong')).toBeVisible()
  })

  test('login page should render all elements correctly', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    // Check all key elements are present
    await expect(page.locator('h1:has-text("Bouslov Bros")')).toBeVisible()
    await expect(page.locator('text=Family competition tracker')).toBeVisible()
    // Use role to be more specific about the card title
    await expect(page.locator('[data-slot="card-title"]:has-text("Sign In")')).toBeVisible()
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible()
    await expect(page.locator('text=Authorized accounts only')).toBeVisible()

    // Check the Google sign-in button has the Google icon (SVG)
    const googleButton = page.locator('button:has-text("Sign in with Google")')
    await expect(googleButton.locator('svg')).toBeVisible()
  })
})
