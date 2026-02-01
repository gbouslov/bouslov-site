import { Page, Locator } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Page object for the quicklinks page
 */
export class QuicklinksPage extends BasePage {
  // Header elements
  readonly pageTitle: Locator
  readonly pageDescription: Locator

  // Link sections
  readonly devResourcesCard: Locator
  readonly gamesCard: Locator

  // Links
  readonly links: Locator
  readonly devLinks: Locator
  readonly gameLinks: Locator

  constructor(page: Page) {
    super(page)

    // Header
    this.pageTitle = page.locator('h1:has-text("Quicklinks")')
    this.pageDescription = page.locator('text=Resources and games for the family')

    // Sections
    this.devResourcesCard = page.locator('[data-testid="dev-resources-card"]')
    this.gamesCard = page.locator('[data-testid="games-card"]')

    // Links
    this.links = page.locator('[data-testid="quicklink"]')
    this.devLinks = page.locator('[data-testid="dev-resources-card"] a')
    this.gameLinks = page.locator('[data-testid="games-card"] a')
  }

  /**
   * Navigate to quicklinks page
   */
  async goto() {
    await this.page.goto('/quicklinks')
    await this.waitForLoad()
  }

  /**
   * Wait for page content to load
   */
  async waitForContent() {
    await this.pageTitle.waitFor({ state: 'visible' })
  }

  /**
   * Get total link count
   */
  async getTotalLinkCount() {
    return this.links.count()
  }

  /**
   * Get dev resource links count
   */
  async getDevLinksCount() {
    return this.devLinks.count()
  }

  /**
   * Get game links count
   */
  async getGameLinksCount() {
    return this.gameLinks.count()
  }

  /**
   * Get all link hrefs
   */
  async getAllLinkHrefs() {
    const links = await this.page.locator('a[target="_blank"]').all()
    const hrefs: string[] = []
    for (const link of links) {
      const href = await link.getAttribute('href')
      if (href) hrefs.push(href)
    }
    return hrefs
  }

  /**
   * Check if a specific link exists
   */
  async hasLink(name: string) {
    return this.page.locator(`a:has-text("${name}")`).isVisible()
  }

  /**
   * Check if links open in new tab
   */
  async linksOpenInNewTab() {
    const externalLinks = await this.page.locator('a[target="_blank"]').all()
    for (const link of externalLinks) {
      const target = await link.getAttribute('target')
      const rel = await link.getAttribute('rel')
      if (target !== '_blank' || !rel?.includes('noopener')) {
        return false
      }
    }
    return true
  }
}
