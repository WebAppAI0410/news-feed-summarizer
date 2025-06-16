import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'RSS News Hub' })).toBeVisible()
  })

  test('should have navigation tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'すべて' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '政府・官公庁' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '企業' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'メディア' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '国際機関' })).toBeVisible()
  })

  test('should have add feed button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'RSSフィードを追加' })).toBeVisible()
  })

  test('should open add feed dialog when button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'RSSフィードを追加' }).click()
    
    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'RSSフィードを追加' })).toBeVisible()
    
    // Form fields should be present
    await expect(page.getByLabel('タイトル')).toBeVisible()
    await expect(page.getByLabel('RSS URL')).toBeVisible()
    await expect(page.getByLabel('カテゴリー')).toBeVisible()
    await expect(page.getByLabel('情報ソース')).toBeVisible()
  })

  test('should close dialog when cancel is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'RSSフィードを追加' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    
    await page.getByRole('button', { name: 'キャンセル' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should display loading state initially', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/feeds', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })
    
    await page.goto('/')
    
    // Should show loading skeleton
    await expect(page.locator('.animate-pulse')).toBeVisible()
  })

  test('should filter articles by category when tab is clicked', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/feeds', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'feed-1',
            title: '経済産業省',
            category: '政府・官公庁',
            url: 'https://www.meti.go.jp/feed.xml',
          },
          {
            id: 'feed-2',
            title: 'Tech Company',
            category: '企業',
            url: 'https://company.com/feed.xml',
          },
        ]),
      })
    })

    await page.route('**/api/articles?*', async route => {
      const url = new URL(route.request().url())
      const category = url.searchParams.get('category')
      
      let articles = []
      if (category === '政府・官公庁') {
        articles = [{
          id: 'article-1',
          feedId: 'feed-1',
          title: '政府発表記事',
          description: '政府からの重要な発表',
          url: 'https://example.com/gov-article',
          publishedAt: Date.now(),
        }]
      } else if (category === '企業') {
        articles = [{
          id: 'article-2',
          feedId: 'feed-2',
          title: '企業ニュース',
          description: '企業からの最新情報',
          url: 'https://example.com/corp-article',
          publishedAt: Date.now(),
        }]
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(articles),
      })
    })

    await page.goto('/')
    
    // Click government tab
    await page.getByRole('tab', { name: '政府・官公庁' }).click()
    await expect(page.getByText('政府発表記事')).toBeVisible()
    
    // Click corporate tab
    await page.getByRole('tab', { name: '企業' }).click()
    await expect(page.getByText('企業ニュース')).toBeVisible()
    await expect(page.getByText('政府発表記事')).not.toBeVisible()
  })
})

test.describe('Feed Management', () => {
  test('should add a new RSS feed', async ({ page }) => {
    await page.goto('/')
    
    // Mock successful feed creation
    await page.route('**/api/feeds', async route => {
      if (route.request().method() === 'POST') {
        const body = await route.request().json()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-feed-123',
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        })
      } else {
        await route.continue()
      }
    })
    
    // Open dialog
    await page.getByRole('button', { name: 'RSSフィードを追加' }).click()
    
    // Fill form
    await page.getByLabel('タイトル').fill('Test RSS Feed')
    await page.getByLabel('RSS URL').fill('https://example.com/test-feed.xml')
    await page.getByLabel('カテゴリー').selectOption('企業')
    await page.getByLabel('情報ソース').fill('Test Company')
    await page.getByLabel('説明').fill('This is a test RSS feed')
    
    // Submit
    await page.getByRole('button', { name: '追加' }).click()
    
    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()
    
    // Success message might appear (depending on implementation)
    // await expect(page.getByText('フィードが追加されました')).toBeVisible()
  })

  test('should show validation errors for invalid feed data', async ({ page }) => {
    await page.goto('/')
    
    // Open dialog
    await page.getByRole('button', { name: 'RSSフィードを追加' }).click()
    
    // Try to submit empty form
    await page.getByRole('button', { name: '追加' }).click()
    
    // Should stay open and show required field indicators
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Fill only partial data
    await page.getByLabel('タイトル').fill('Test Feed')
    await page.getByLabel('RSS URL').fill('invalid-url')
    
    // Try to submit
    await page.getByRole('button', { name: '追加' }).click()
    
    // Should still be visible due to invalid URL
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})