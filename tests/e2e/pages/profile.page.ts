import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object for user profile pages
 */
export class ProfilePage extends BasePage {
  // Profile header
  readonly profileCard: Locator
  readonly avatar: Locator
  readonly userName: Locator
  readonly userEmail: Locator
  readonly scoresCount: Locator
  readonly categoriesCount: Locator

  // Personal bests
  readonly personalBestsCard: Locator
  readonly personalBestItems: Locator

  // History
  readonly historyCard: Locator
  readonly historyItems: Locator

  // Empty states
  readonly noScoresMessage: Locator

  constructor(page: Page) {
    super(page)

    // Profile header
    this.profileCard = page.locator('[data-testid="profile-card"]')
    this.avatar = page.locator('[data-testid="profile-avatar"]')
    this.userName = page.locator('[data-testid="profile-name"]')
    this.userEmail = page.locator('[data-testid="profile-email"]')
    this.scoresCount = page.locator('[data-testid="scores-count"]')
    this.categoriesCount = page.locator('[data-testid="categories-count"]')

    // Personal bests
    this.personalBestsCard = page.locator('[data-testid="personal-bests-card"]')
    this.personalBestItems = page.locator('[data-testid="personal-best-item"]')

    // History
    this.historyCard = page.locator('[data-testid="history-card"]')
    this.historyItems = page.locator('[data-testid="history-item"]')

    // Empty states
    this.noScoresMessage = page.locator('text=No scores recorded yet')
  }

  /**
   * Navigate to a user's profile
   */
  async goto(email: string) {
    await this.page.goto(`/profile/${encodeURIComponent(email)}`)
    await this.waitForLoad()
  }

  /**
   * Wait for profile content to load
   */
  async waitForContent() {
    await this.profileCard.waitFor({ state: 'visible' })
  }

  /**
   * Get displayed user name
   */
  async getUserName() {
    return this.userName.textContent()
  }

  /**
   * Get displayed email
   */
  async getUserEmail() {
    return this.userEmail.textContent()
  }

  /**
   * Get scores count
   */
  async getScoresCount() {
    const text = await this.scoresCount.textContent()
    return parseInt(text || '0', 10)
  }

  /**
   * Get categories played count
   */
  async getCategoriesCount() {
    const text = await this.categoriesCount.textContent()
    return parseInt(text || '0', 10)
  }

  /**
   * Get personal bests count
   */
  async getPersonalBestsCount() {
    return this.personalBestItems.count()
  }

  /**
   * Get history items count
   */
  async getHistoryCount() {
    return this.historyItems.count()
  }

  /**
   * Check if profile has any scores
   */
  async hasScores() {
    return !(await this.noScoresMessage.isVisible())
  }
}
