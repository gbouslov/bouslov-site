import { Page, Locator } from '@playwright/test'

/**
 * Base page object with common selectors and methods
 */
export class BasePage {
  readonly page: Page

  // Sidebar navigation
  readonly sidebar: Locator
  readonly navLeaderboard: Locator
  readonly navTravel: Locator
  readonly navPins: Locator
  readonly navQuicklinks: Locator
  readonly navLogScore: Locator
  readonly sidebarUserAvatar: Locator
  readonly signOutButton: Locator
  readonly sidebarLogo: Locator

  constructor(page: Page) {
    this.page = page

    // Sidebar selectors
    this.sidebar = page.locator('aside')
    this.navLeaderboard = page.locator('a[href="/leaderboard"]')
    this.navTravel = page.locator('a[href="/travel"]')
    this.navPins = page.locator('a[href="/pins"]')
    this.navQuicklinks = page.locator('a[href="/quicklinks"]')
    this.navLogScore = page.locator('a[href="/submit"]')
    this.sidebarUserAvatar = page.locator('aside').locator('[data-testid="user-avatar"]')
    this.signOutButton = page.locator('button:has-text("Sign Out")')
    this.sidebarLogo = page.locator('aside a[href="/leaderboard"]').first()
  }

  /**
   * Navigate to a specific route
   */
  async goto(path: string) {
    await this.page.goto(path)
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Navigate using sidebar links
   */
  async navigateToLeaderboard() {
    await this.navLeaderboard.click()
    await this.page.waitForURL('/leaderboard')
  }

  async navigateToTravel() {
    await this.navTravel.click()
    await this.page.waitForURL('/travel')
  }

  async navigateToPins() {
    await this.navPins.click()
    await this.page.waitForURL('/pins')
  }

  async navigateToQuicklinks() {
    await this.navQuicklinks.click()
    await this.page.waitForURL('/quicklinks')
  }

  /**
   * Check if sidebar is visible (indicates authenticated state)
   */
  async isSidebarVisible() {
    return this.sidebar.isVisible()
  }

  /**
   * Check if current nav item is active
   */
  async isNavItemActive(href: string) {
    const navItem = this.page.locator(`aside a[href="${href}"]`)
    const classes = await navItem.getAttribute('class')
    return classes?.includes('bg-zinc-800') ?? false
  }

  /**
   * Sign out from the application
   */
  async signOut() {
    await this.signOutButton.click()
    await this.page.waitForURL('/login')
  }

  /**
   * Get page title text
   */
  async getPageTitle() {
    return this.page.locator('h1').first().textContent()
  }
}
