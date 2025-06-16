import { test, expect } from '@playwright/test'

test.describe('Article Reading Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/feeds', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'feed-1',
            title: '経済産業省 ニュースリリース',
            category: '政府・官公庁',
            url: 'https://www.meti.go.jp/feed.xml',
            source: '経済産業省',
          },
        ]),
      })
    })

    await page.route('**/api/articles?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'article-1',
            feedId: 'feed-1',
            title: '新エネルギー政策について',
            description: '再生可能エネルギーの推進に関する新しい政策を発表しました。',
            url: 'https://example.com/article-1',
            publishedAt: new Date('2024-01-15').getTime(),
            createdAt: Date.now(),
          },
          {
            id: 'article-2',
            feedId: 'feed-1',
            title: 'DX推進支援事業の開始',
            description: '中小企業のデジタルトランスフォーメーションを支援する新事業を開始します。',
            url: 'https://example.com/article-2',
            publishedAt: new Date('2024-01-14').getTime(),
            createdAt: Date.now(),
          },
        ]),
      })
    })

    await page.goto('/')
  })

  test('should display articles in the feed', async ({ page }) => {
    // Wait for articles to load
    await expect(page.getByText('新エネルギー政策について')).toBeVisible()
    await expect(page.getByText('DX推進支援事業の開始')).toBeVisible()
    
    // Check article details
    await expect(page.getByText('再生可能エネルギーの推進に関する新しい政策を発表しました。')).toBeVisible()
    await expect(page.getByText('経済産業省 ニュースリリース')).toBeVisible()
  })

  test('should open article in new tab when external link is clicked', async ({ page, context }) => {
    // Wait for articles to load
    await expect(page.getByText('新エネルギー政策について')).toBeVisible()
    
    // Set up listener for new page
    const pagePromise = context.waitForEvent('page')
    
    // Click external link icon
    await page.locator('a[href="https://example.com/article-1"]').click()
    
    // Check new tab opened with correct URL
    const newPage = await pagePromise
    await expect(newPage).toHaveURL('https://example.com/article-1')
  })

  test('should display article published date in Japanese format', async ({ page }) => {
    // Check date format
    await expect(page.getByText(/2024年1月15日/)).toBeVisible()
    await expect(page.getByText(/2024年1月14日/)).toBeVisible()
  })

  test('should handle empty article list gracefully', async ({ page }) => {
    // Override with empty response
    await page.route('**/api/articles?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })
    
    await page.goto('/')
    
    // Should show some empty state or message
    // The exact message depends on implementation
    await expect(page.locator('main')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Override with error response
    await page.route('**/api/articles?*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })
    
    await page.goto('/')
    
    // Should show error state
    // The exact error handling depends on implementation
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Article Summary Feature', () => {
  test('should display AI summary when available', async ({ page }) => {
    // Mock with summary data
    await page.route('**/api/feeds', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'feed-1',
            title: 'Test Feed',
            category: '企業',
            url: 'https://example.com/feed.xml',
            source: 'Test Company',
          },
        ]),
      })
    })

    await page.route('**/api/articles?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'article-with-summary',
            feedId: 'feed-1',
            title: 'Article with AI Summary',
            description: 'This article has an AI-generated summary.',
            url: 'https://example.com/article',
            publishedAt: Date.now(),
            createdAt: Date.now(),
          },
        ]),
      })
    })

    await page.route('**/api/summaries?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'summary-1',
            articleId: 'article-with-summary',
            content: 'これは記事の要約です。主要なポイントが含まれています。',
            createdAt: Date.now(),
          },
        ]),
      })
    })

    await page.goto('/')
    
    // Check if summary section is visible
    await expect(page.getByText('AI要約')).toBeVisible()
    await expect(page.getByText('これは記事の要約です。主要なポイントが含まれています。')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Check mobile layout
    await expect(page.getByRole('heading', { name: 'RSS News Hub' })).toBeVisible()
    
    // Navigation tabs should still be accessible (might be scrollable)
    await expect(page.getByRole('tab', { name: 'すべて' })).toBeVisible()
    
    // Add feed button should be visible
    await expect(page.getByRole('button', { name: 'RSSフィードを追加' })).toBeVisible()
  })

  test('should handle tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.goto('/')
    
    // Check tablet layout
    await expect(page.getByRole('heading', { name: 'RSS News Hub' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'すべて' })).toBeVisible()
  })
})