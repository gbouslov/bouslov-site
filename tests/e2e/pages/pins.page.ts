import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object for the pins page
 */
export class PinsPage extends BasePage {
  // Header elements
  readonly pageTitle: Locator
  readonly globeViewButton: Locator
  readonly listViewButton: Locator
  readonly addPinButton: Locator

  // User filter buttons
  readonly allUsersButton: Locator
  readonly userFilterButtons: Locator

  // Pin type filter buttons
  readonly pinTypeFilters: Locator

  // Globe view
  readonly globeContainer: Locator

  // List view
  readonly pinCards: Locator

  // Pin detail panel
  readonly pinDetailPanel: Locator
  readonly pinDetailTitle: Locator
  readonly pinDetailLocation: Locator
  readonly pinDetailDescription: Locator
  readonly editPinButton: Locator
  readonly deletePinButton: Locator
  readonly closePanelButton: Locator

  // Add/Edit pin modal
  readonly pinModal: Locator
  readonly pinTitleInput: Locator
  readonly pinDescriptionInput: Locator
  readonly pinLatInput: Locator
  readonly pinLngInput: Locator
  readonly pinTypeSelect: Locator
  readonly pinLocationInput: Locator
  readonly savePinButton: Locator
  readonly cancelPinButton: Locator
  readonly pinFormError: Locator

  // Empty state
  readonly emptyState: Locator

  constructor(page: Page) {
    super(page)

    // Header
    this.pageTitle = page.locator('h1:has-text("Pins")')
    this.globeViewButton = page.locator('[data-testid="pins-globe-view-button"]')
    this.listViewButton = page.locator('[data-testid="pins-list-view-button"]')
    this.addPinButton = page.locator('[data-testid="add-pin-button"]')

    // User filters
    this.allUsersButton = page.locator('[data-testid="pins-user-filter-all"]')
    this.userFilterButtons = page.locator('[data-testid^="pins-user-filter-"]')

    // Pin type filters
    this.pinTypeFilters = page.locator('[data-testid^="pin-type-filter-"]')

    // Globe
    this.globeContainer = page.locator('[data-testid="pins-globe"]')

    // List view
    this.pinCards = page.locator('[data-testid="pin-card"]')

    // Pin detail panel
    this.pinDetailPanel = page.locator('[data-testid="pin-detail-panel"]')
    this.pinDetailTitle = page.locator('[data-testid="pin-detail-title"]')
    this.pinDetailLocation = page.locator('[data-testid="pin-detail-location"]')
    this.pinDetailDescription = page.locator('[data-testid="pin-detail-description"]')
    this.editPinButton = page.locator('[data-testid="edit-pin-button"]')
    this.deletePinButton = page.locator('[data-testid="delete-pin-button"]')
    this.closePanelButton = page.locator('[data-testid="close-pin-panel"]')

    // Add/Edit modal
    this.pinModal = page.locator('[data-testid="pin-modal"]')
    this.pinTitleInput = page.locator('[data-testid="pin-title-input"]')
    this.pinDescriptionInput = page.locator('[data-testid="pin-description-input"]')
    this.pinLatInput = page.locator('[data-testid="pin-lat-input"]')
    this.pinLngInput = page.locator('[data-testid="pin-lng-input"]')
    this.pinTypeSelect = page.locator('[data-testid="pin-type-select"]')
    this.pinLocationInput = page.locator('[data-testid="pin-location-input"]')
    this.savePinButton = page.locator('[data-testid="save-pin-button"]')
    this.cancelPinButton = page.locator('[data-testid="cancel-pin-button"]')
    this.pinFormError = page.locator('[data-testid="pin-form-error"]')

    // Empty state
    this.emptyState = page.locator('text=No pins yet')
  }

  /**
   * Navigate to pins page
   */
  async goto() {
    await this.page.goto('/pins')
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
   * Filter by user
   */
  async filterByUser(userName: string) {
    await this.page.locator(`[data-testid="pins-user-filter-${userName.toLowerCase()}"]`).click()
  }

  /**
   * Filter by pin type
   */
  async filterByPinType(type: string) {
    await this.page.locator(`[data-testid="pin-type-filter-${type}"]`).click()
  }

  /**
   * Get visible pin count
   */
  async getPinCount() {
    return this.pinCards.count()
  }

  /**
   * Click on a pin card
   */
  async clickPinCard(index: number) {
    await this.pinCards.nth(index).click()
  }

  /**
   * Open add pin modal
   */
  async openAddPinModal() {
    await this.addPinButton.click()
    await this.pinModal.waitFor({ state: 'visible' })
  }

  /**
   * Fill pin form
   */
  async fillPinForm(data: {
    title: string
    description?: string
    lat: string
    lng: string
    type?: string
    location?: string
  }) {
    await this.pinTitleInput.fill(data.title)
    if (data.description) {
      await this.pinDescriptionInput.fill(data.description)
    }
    await this.pinLatInput.fill(data.lat)
    await this.pinLngInput.fill(data.lng)
    if (data.type) {
      await this.pinTypeSelect.click()
      await this.page.locator(`[role="option"]:has-text("${data.type}")`).click()
    }
    if (data.location) {
      await this.pinLocationInput.fill(data.location)
    }
  }

  /**
   * Save pin
   */
  async savePin() {
    await this.savePinButton.click()
  }

  /**
   * Cancel pin form
   */
  async cancelPin() {
    await this.cancelPinButton.click()
  }

  /**
   * Close pin detail panel
   */
  async closePinPanel() {
    await this.closePanelButton.click()
  }

  /**
   * Check if pin detail panel is open
   */
  async isPinPanelOpen() {
    return this.pinDetailPanel.isVisible()
  }

  /**
   * Check if pin modal is open
   */
  async isPinModalOpen() {
    return this.pinModal.isVisible()
  }

  /**
   * Check if globe is loaded
   */
  async isGlobeLoaded() {
    await this.page.waitForSelector('canvas', { timeout: 15000 })
    return true
  }
}
