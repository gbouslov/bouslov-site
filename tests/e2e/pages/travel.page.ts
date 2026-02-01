import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object for the travel page
 */
export class TravelPage extends BasePage {
  // Header elements
  readonly pageTitle: Locator
  readonly globeViewButton: Locator
  readonly listViewButton: Locator
  readonly addCountryButton: Locator

  // User filter buttons
  readonly allUsersButton: Locator
  readonly userFilterButtons: Locator

  // Globe view
  readonly globeContainer: Locator
  readonly globeLoading: Locator

  // List view
  readonly countryList: Locator
  readonly countryCards: Locator
  readonly continentSections: Locator

  // Country info tooltip
  readonly countryTooltip: Locator

  // Add country dialog
  readonly addCountryDialog: Locator
  readonly countrySearchInput: Locator
  readonly countryOptions: Locator
  readonly confirmAddButton: Locator

  // Empty state
  readonly emptyState: Locator

  constructor(page: Page) {
    super(page)

    // Header
    this.pageTitle = page.locator('h1:has-text("Travel")')
    this.globeViewButton = page.locator('[data-testid="globe-view-button"]')
    this.listViewButton = page.locator('[data-testid="list-view-button"]')
    this.addCountryButton = page.locator('[data-testid="add-country-button"]')

    // User filters
    this.allUsersButton = page.locator('[data-testid="user-filter-all"]')
    this.userFilterButtons = page.locator('[data-testid^="user-filter-"]')

    // Globe
    this.globeContainer = page.locator('[data-testid="travel-globe"]')
    this.globeLoading = page.locator('.animate-spin').first()

    // List view
    this.countryList = page.locator('[data-testid="country-list"]')
    this.countryCards = page.locator('[data-testid="country-card"]')
    this.continentSections = page.locator('[data-testid="continent-section"]')

    // Tooltip
    this.countryTooltip = page.locator('[data-testid="country-tooltip"]')

    // Add country dialog
    this.addCountryDialog = page.locator('[data-testid="add-country-dialog"]')
    this.countrySearchInput = page.locator('[data-testid="country-search-input"]')
    this.countryOptions = page.locator('[data-testid="country-option"]')
    this.confirmAddButton = page.locator('[data-testid="confirm-add-country"]')

    // Empty state
    this.emptyState = page.locator('text=No countries have been added yet')
  }

  /**
   * Navigate to travel page
   */
  async goto() {
    await this.page.goto('/travel')
    await this.waitForLoad()
  }

  /**
   * Wait for page content to load
   */
  async waitForContent() {
    await this.pageTitle.waitFor({ state: 'visible' })
  }

  /**
   * Switch to globe view
   */
  async switchToGlobeView() {
    await this.globeViewButton.click()
  }

  /**
   * Switch to list view
   */
  async switchToListView() {
    await this.listViewButton.click()
  }

  /**
   * Check if globe view is active
   */
  async isGlobeViewActive() {
    const classes = await this.globeViewButton.getAttribute('class')
    return classes?.includes('bg-zinc-800') ?? false
  }

  /**
   * Check if list view is active
   */
  async isListViewActive() {
    const classes = await this.listViewButton.getAttribute('class')
    return classes?.includes('bg-zinc-800') ?? false
  }

  /**
   * Filter by user
   */
  async filterByUser(userName: string) {
    await this.page.locator(`[data-testid="user-filter-${userName.toLowerCase()}"]`).click()
  }

  /**
   * Show all users
   */
  async showAllUsers() {
    await this.allUsersButton.click()
  }

  /**
   * Get visible country count
   */
  async getCountryCount() {
    return this.countryCards.count()
  }

  /**
   * Open add country dialog
   */
  async openAddCountryDialog() {
    await this.addCountryButton.click()
    await this.addCountryDialog.waitFor({ state: 'visible' })
  }

  /**
   * Search for a country
   */
  async searchCountry(name: string) {
    await this.countrySearchInput.fill(name)
  }

  /**
   * Select a country from search results
   */
  async selectCountry(name: string) {
    await this.page.locator(`[data-testid="country-option"]:has-text("${name}")`).click()
  }

  /**
   * Add a country
   */
  async addCountry(name: string) {
    await this.openAddCountryDialog()
    await this.searchCountry(name)
    await this.selectCountry(name)
  }

  /**
   * Get continent count in list view
   */
  async getContinentCount() {
    return this.continentSections.count()
  }

  /**
   * Check if globe is loaded
   */
  async isGlobeLoaded() {
    await this.page.waitForSelector('canvas', { timeout: 15000 })
    return true
  }
}
