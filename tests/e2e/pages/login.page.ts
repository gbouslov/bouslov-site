import { Page, Locator } from '@playwright/test'

/**
 * Page object for the login page
 */
export class LoginPage {
  readonly page: Page
  readonly logo: Locator
  readonly title: Locator
  readonly signInCard: Locator
  readonly signInButton: Locator
  readonly errorMessage: Locator
  readonly authorizedEmails: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page

    this.logo = page.locator('[data-testid="login-logo"]')
    this.title = page.locator('h1:has-text("Bouslov Bros")')
    this.signInCard = page.locator('[data-testid="login-card"]')
    this.signInButton = page.locator('button:has-text("Sign in with Google")')
    this.errorMessage = page.locator('[data-testid="login-error"]')
    this.authorizedEmails = page.locator('.font-mono:has-text("gbouslov")')
    this.loadingSpinner = page.locator('.animate-spin')
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login')
  }

  /**
   * Check if login page is displayed
   */
  async isDisplayed() {
    await this.page.waitForLoadState('domcontentloaded')
    return (await this.signInButton.isVisible()) || (await this.loadingSpinner.isVisible())
  }

  /**
   * Check if error message is displayed
   */
  async hasError() {
    return this.errorMessage.isVisible()
  }

  /**
   * Get error message text
   */
  async getErrorMessage() {
    return this.errorMessage.textContent()
  }

  /**
   * Click sign in with Google
   */
  async clickSignIn() {
    await this.signInButton.click()
  }

  /**
   * Wait for redirect after login
   */
  async waitForRedirect() {
    await this.page.waitForURL('/leaderboard', { timeout: 10000 })
  }
}
