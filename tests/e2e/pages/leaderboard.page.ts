import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object for the leaderboard page
 */
export class LeaderboardPage extends BasePage {
  // Header elements
  readonly pageTitle: Locator
  readonly syncChessButton: Locator
  readonly logScoreButton: Locator

  // Overall standings
  readonly overallStandingsCard: Locator
  readonly playerCards: Locator

  // Categories
  readonly categoriesCard: Locator
  readonly categoryCards: Locator

  // Recent activity
  readonly recentActivityCard: Locator
  readonly activityItems: Locator

  // Category detail modal
  readonly categoryModal: Locator
  readonly categoryModalTitle: Locator
  readonly categoryModalScores: Locator
  readonly categoryModalClose: Locator

  // Log score modal
  readonly logScoreModal: Locator
  readonly categorySelect: Locator
  readonly scoreInput: Locator
  readonly proofUrlInput: Locator
  readonly submitScoreButton: Locator
  readonly scoreError: Locator

  constructor(page: Page) {
    super(page)

    // Header
    this.pageTitle = page.locator('h1:has-text("Leaderboard")')
    this.syncChessButton = page.locator('[data-testid="sync-chess-button"]')
    this.logScoreButton = page.locator('[data-testid="log-score-button"]')

    // Overall standings
    this.overallStandingsCard = page.locator('[data-testid="overall-standings"]')
    this.playerCards = page.locator('[data-testid="player-card"]')

    // Categories
    this.categoriesCard = page.locator('[data-testid="categories-card"]')
    this.categoryCards = page.locator('[data-testid="category-card"]')

    // Recent activity
    this.recentActivityCard = page.locator('[data-testid="recent-activity"]')
    this.activityItems = page.locator('[data-testid="activity-item"]')

    // Category modal
    this.categoryModal = page.locator('[data-testid="category-modal"]')
    this.categoryModalTitle = page.locator('[data-testid="category-modal-title"]')
    this.categoryModalScores = page.locator('[data-testid="category-modal-score"]')
    this.categoryModalClose = page.locator('[data-testid="category-modal"] button[aria-label="Close"]')

    // Log score modal
    this.logScoreModal = page.locator('[data-testid="log-score-modal"]')
    this.categorySelect = page.locator('[data-testid="category-select"]')
    this.scoreInput = page.locator('[data-testid="score-input"]')
    this.proofUrlInput = page.locator('[data-testid="proof-url-input"]')
    this.submitScoreButton = page.locator('[data-testid="submit-score-button"]')
    this.scoreError = page.locator('[data-testid="score-error"]')
  }

  /**
   * Navigate to leaderboard page
   */
  async goto() {
    await this.page.goto('/leaderboard')
    await this.waitForLoad()
  }

  /**
   * Wait for leaderboard content to load
   */
  async waitForContent() {
    await this.pageTitle.waitFor({ state: 'visible' })
  }

  /**
   * Get all player names from overall standings
   */
  async getPlayerNames() {
    const players = await this.page.locator('[data-testid="player-card"] h3').allTextContents()
    return players
  }

  /**
   * Get category count
   */
  async getCategoryCount() {
    return this.categoryCards.count()
  }

  /**
   * Click on a category by name
   */
  async clickCategory(name: string) {
    await this.page.locator(`[data-testid="category-card"]:has-text("${name}")`).click()
  }

  /**
   * Check if category modal is open
   */
  async isCategoryModalOpen() {
    return this.categoryModal.isVisible()
  }

  /**
   * Close category modal
   */
  async closeCategoryModal() {
    await this.page.keyboard.press('Escape')
  }

  /**
   * Click sync chess button
   */
  async clickSyncChess() {
    await this.syncChessButton.click()
  }

  /**
   * Check if sync is in progress
   */
  async isSyncInProgress() {
    const button = this.syncChessButton
    const spinnerClass = await button.locator('.animate-spin').isVisible()
    return spinnerClass
  }

  /**
   * Open log score modal
   */
  async openLogScoreModal() {
    await this.logScoreButton.click()
    await this.logScoreModal.waitFor({ state: 'visible' })
  }

  /**
   * Submit a score
   */
  async submitScore(category: string, value: string, proofUrl?: string) {
    await this.openLogScoreModal()
    await this.categorySelect.click()
    await this.page.locator(`[role="option"]:has-text("${category}")`).click()
    await this.scoreInput.fill(value)
    if (proofUrl) {
      await this.proofUrlInput.fill(proofUrl)
    }
    await this.submitScoreButton.click()
  }

  /**
   * Get recent activity count
   */
  async getRecentActivityCount() {
    return this.activityItems.count()
  }
}
