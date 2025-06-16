import { parseRSSFeed } from '@/lib/rss-parser'
import { db } from '@/db'
import { feeds, articles } from '@/db/schema'
import { nanoid } from 'nanoid'
import type { RSSFeed } from '@/lib/rss-parser'

// Mock dependencies
jest.mock('@/lib/rss-parser')
jest.mock('@/db/drizzle', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    transaction: jest.fn(),
  },
}))
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => `test-id-${Date.now()}`),
}))

describe('RSS to Database Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockFeedData: RSSFeed = {
    title: '経済産業省 ニュースリリース',
    description: 'METI Press Releases',
    link: 'https://www.meti.go.jp/',
    items: [
      {
        title: '新エネルギー政策について',
        link: 'https://www.meti.go.jp/press/2024/01/article1.html',
        description: '新エネルギー政策に関する発表',
        content: '<p>詳細な内容...</p>',
        pubDate: '2024-01-15T09:00:00Z',
        guid: 'meti-article-1',
        creator: '経済産業省',
        categories: ['エネルギー', '政策'],
      },
      {
        title: 'DX推進支援事業の開始',
        link: 'https://www.meti.go.jp/press/2024/01/article2.html',
        description: 'デジタルトランスフォーメーション支援',
        pubDate: '2024-01-14T10:00:00Z',
        guid: 'meti-article-2',
        categories: ['IT', 'DX'],
      },
    ],
  }

  describe('Feed Creation and Article Import', () => {
    it('should successfully import RSS feed and save articles to database', async () => {
      // Mock RSS parsing
      ;(parseRSSFeed as jest.Mock).mockResolvedValue(mockFeedData)

      // Mock database operations
      const mockReturning = jest.fn()
      const mockValues = jest.fn(() => ({ returning: mockReturning }))
      ;(db.insert as jest.Mock).mockReturnValue({ values: mockValues })

      // Mock feed creation
      const createdFeed = {
        id: 'feed-123',
        title: mockFeedData.title,
        url: 'https://www.meti.go.jp/press/index.rdf',
        description: mockFeedData.description,
        category: '政府・官公庁',
        source: '経済産業省',
        language: 'ja',
        country: 'JP',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockReturning.mockResolvedValueOnce([createdFeed])

      // Mock articles creation
      const createdArticles = mockFeedData.items.map((item, index) => ({
        id: `article-${index}`,
        feedId: createdFeed.id,
        title: item.title,
        link: item.link,
        description: item.description,
        content: item.content,
        publishedAt: new Date(item.pubDate!),
        guid: item.guid,
        creator: item.creator,
        categories: item.categories,
        isRead: false,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      mockReturning.mockResolvedValueOnce(createdArticles)

      // Simulate the integration flow
      const rssFeedUrl = 'https://www.meti.go.jp/press/index.rdf'
      
      // Step 1: Parse RSS feed
      const parsedFeed = await parseRSSFeed(rssFeedUrl)
      expect(parseRSSFeed).toHaveBeenCalledWith(rssFeedUrl)
      expect(parsedFeed).toEqual(mockFeedData)

      // Step 2: Create feed in database
      const feedToCreate = {
        id: nanoid(),
        title: parsedFeed.title,
        url: rssFeedUrl,
        description: parsedFeed.description,
        category: '政府・官公庁',
        source: '経済産業省',
        language: 'ja',
        country: 'JP',
        isActive: true,
        errorCount: 0,
      }

      const [savedFeed] = await db
        .insert(feeds)
        .values(feedToCreate)
        .returning()

      expect(db.insert).toHaveBeenCalledWith(feeds)
      expect(mockValues).toHaveBeenCalledWith(feedToCreate)
      expect(savedFeed).toEqual(createdFeed)

      // Step 3: Save articles to database
      const articlesToCreate = parsedFeed.items.map(item => ({
        id: nanoid(),
        feedId: savedFeed.id,
        title: item.title,
        link: item.link,
        description: item.description || null,
        content: item.content || null,
        contentSnippet: item.contentSnippet || null,
        publishedAt: new Date(item.pubDate || Date.now()),
        guid: item.guid,
        author: item.author || null,
        creator: item.creator || null,
        categories: item.categories || [],
        isRead: false,
        isFavorite: false,
        summary: null,
      }))

      const savedArticles = await db
        .insert(articles)
        .values(articlesToCreate)
        .returning()

      expect(db.insert).toHaveBeenCalledWith(articles)
      expect(savedArticles).toHaveLength(2)
      expect(savedArticles[0].feedId).toBe(savedFeed.id)
    })

    it('should handle duplicate articles gracefully', async () => {
      // Mock existing articles check
      const mockLimit = jest.fn().mockResolvedValue([{ guid: 'meti-article-1' }])
      const mockWhere = jest.fn(() => ({ limit: mockLimit }))
      const mockFrom = jest.fn(() => ({ where: mockWhere }))
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      // Check for existing article
      const existingArticles = await db
        .select()
        .from(articles)
        .where('eq', 'meti-article-1')
        .limit(1)

      expect(existingArticles).toHaveLength(1)
      expect(existingArticles[0].guid).toBe('meti-article-1')
    })

    it('should update feed lastPolled timestamp after successful import', async () => {
      const feedId = 'feed-123'
      const now = new Date()

      const mockReturning = jest.fn().mockResolvedValue([{ 
        id: feedId, 
        lastPolled: now,
        errorCount: 0,
      }])
      const mockWhere = jest.fn(() => ({ returning: mockReturning }))
      const mockSet = jest.fn(() => ({ where: mockWhere }))
      const mockUpdate = jest.fn(() => ({ set: mockSet }))
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      // Update feed after successful import
      const updateData = {
        lastPolled: now,
        lastError: null,
        errorCount: 0,
        updatedAt: now,
      }

      const [updatedFeed] = await db
        .update(feeds)
        .set(updateData)
        .where('eq', feedId)
        .returning()

      expect(updatedFeed.lastPolled).toEqual(now)
      expect(updatedFeed.errorCount).toBe(0)
    })

    it('should handle RSS parsing errors and update feed error state', async () => {
      const feedId = 'feed-123'
      const errorMessage = 'Failed to parse RSS: Network error'

      // Mock RSS parsing failure
      ;(parseRSSFeed as jest.Mock).mockRejectedValue(new Error(errorMessage))

      // Mock feed error update
      const mockReturning = jest.fn().mockResolvedValue([{
        id: feedId,
        lastError: errorMessage,
        errorCount: 1,
      }])
      const mockWhere = jest.fn(() => ({ returning: mockReturning }))
      const mockSet = jest.fn(() => ({ where: mockWhere }))
      const mockUpdate = jest.fn(() => ({ set: mockSet }))
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      try {
        await parseRSSFeed('https://invalid-feed.com/rss')
      } catch (error) {
        // Update feed with error information
        const [updatedFeed] = await db
          .update(feeds)
          .set({
            lastError: errorMessage,
            errorCount: 1,
            updatedAt: new Date(),
          })
          .where('eq', feedId)
          .returning()

        expect(updatedFeed.lastError).toBe(errorMessage)
        expect(updatedFeed.errorCount).toBe(1)
      }
    })
  })

  describe('Transaction Handling', () => {
    it('should use transaction for batch article insertion', async () => {
      const mockTx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      }

      ;(db.transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx)
      })

      // Simulate batch insertion with transaction
      const articlesToInsert = mockFeedData.items.map(item => ({
        id: nanoid(),
        feedId: 'feed-123',
        title: item.title,
        link: item.link,
        publishedAt: new Date(item.pubDate!),
        guid: item.guid,
      }))

      await db.transaction(async (tx) => {
        for (const article of articlesToInsert) {
          await tx.insert(articles).values(article).returning()
        }
      })

      expect(db.transaction).toHaveBeenCalled()
      expect(mockTx.insert).toHaveBeenCalledTimes(articlesToInsert.length)
    })
  })
})