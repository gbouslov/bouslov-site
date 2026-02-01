# OVERNIGHT TASK: Build Playwright E2E Test Suite

## Mission
Create comprehensive Playwright end-to-end tests for bouslov.com critical flows.

## Setup

First, install Playwright:
```bash
npm install -D @playwright/test
npx playwright install
```

Add to package.json scripts:
```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

Create playwright.config.ts with:
- Base URL: http://localhost:3000 (or production URL)
- Browser: chromium
- Screenshots on failure
- Video on failure

## Test Suites to Create

### 1. tests/e2e/auth.spec.ts
- Login flow works
- Redirect to login when not authenticated
- Logout works
- Session persists across pages

### 2. tests/e2e/leaderboard.spec.ts
- Page loads with categories
- Category cards display correctly
- Click category opens detail modal
- Overall standings show all family members
- Sync Chess button works (or shows loading)
- Log Score modal opens and validates inputs

### 3. tests/e2e/travel.spec.ts
- Globe view loads
- List view toggle works
- User filter buttons work
- Add country dialog opens
- Country appears after adding (mock or real)

### 4. tests/e2e/pins.spec.ts
- Pins page loads
- Globe displays pins
- Click pin shows details
- Add pin modal works
- Pin form validates required fields

### 5. tests/e2e/profile.spec.ts
- Profile page loads for each family member
- Shows user's scores
- Shows user's travels
- Edit profile works (if applicable)

### 6. tests/e2e/quicklinks.spec.ts
- Page loads
- All links are valid (no 404s)
- External links open in new tab

### 7. tests/e2e/navigation.spec.ts
- Sidebar navigation works
- All routes accessible
- Mobile menu works (if applicable)
- Active state shows correctly

## Test Patterns

Use Page Object Model:
```typescript
// tests/e2e/pages/leaderboard.page.ts
export class LeaderboardPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/leaderboard')
  }
  
  async getCategoryCards() {
    return this.page.locator('[data-testid="category-card"]')
  }
  
  async clickCategory(name: string) {
    await this.page.click(`text=${name}`)
  }
}
```

Add data-testid attributes to components as needed for reliable selectors.

## Fixtures

Create test fixtures for:
- Authenticated user session
- Mock API responses (if needed)
- Test data

## CI Integration

Create .github/workflows/e2e.yml:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
```

## Deliverables

1. `playwright.config.ts` - Configuration
2. `tests/e2e/*.spec.ts` - Test files
3. `tests/e2e/pages/*.page.ts` - Page objects
4. `tests/e2e/fixtures/` - Test fixtures
5. `.github/workflows/e2e.yml` - CI workflow
6. Update `package.json` with test scripts

## Success Criteria
- All critical flows have tests
- Tests pass locally
- CI workflow runs on push
- Good test coverage of happy paths
- Error cases tested where critical
