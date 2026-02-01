import { test as base, expect } from '@playwright/test'
import { LoginPage, LeaderboardPage, TravelPage, PinsPage, ProfilePage, QuicklinksPage } from '../pages'

/**
 * Extended test fixture with page objects
 */
export const test = base.extend<{
  loginPage: LoginPage
  leaderboardPage: LeaderboardPage
  travelPage: TravelPage
  pinsPage: PinsPage
  profilePage: ProfilePage
  quicklinksPage: QuicklinksPage
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  leaderboardPage: async ({ page }, use) => {
    await use(new LeaderboardPage(page))
  },
  travelPage: async ({ page }, use) => {
    await use(new TravelPage(page))
  },
  pinsPage: async ({ page }, use) => {
    await use(new PinsPage(page))
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page))
  },
  quicklinksPage: async ({ page }, use) => {
    await use(new QuicklinksPage(page))
  },
})

export { expect }

/**
 * Family member emails for testing
 */
export const FAMILY_EMAILS = [
  'gbouslov@gmail.com',
  'dbouslov@gmail.com',
  'jbouslov@gmail.com',
  'bouslovd@gmail.com',
]

/**
 * Family member names
 */
export const FAMILY_NAMES = ['Gabe', 'David', 'Jonathan', 'Daniel']
