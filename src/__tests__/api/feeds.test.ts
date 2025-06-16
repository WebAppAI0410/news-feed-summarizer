import { GET, POST, PUT, DELETE } from '@/app/api/feeds/route'
import { NextRequest } from 'next/server'
import { db } from '@/db'
import { feeds } from '@/db/schema'

// Mock database
jest.mock('@/db/drizzle', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}))

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-123',
}))

describe('Feeds API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/feeds', () => {
    it('should fetch all feeds successfully', async () => {
      const mockFeeds = [
        {
          id: 'feed-1',
          title: 'Feed 1',
          url: 'https://example.com/feed1.xml',
          category: '企業',
          source: 'Company 1',
          createdAt: new Date(),
        },
        {
          id: 'feed-2',
          title: 'Feed 2',
          url: 'https://example.com/feed2.xml',
          category: '政府・官公庁',
          source: 'Government',
          createdAt: new Date(),
        },
      ]

      const mockOrderBy = {
        orderBy: jest.fn().mockResolvedValue(mockFeeds),
      }
      const mockFrom = {
        from: jest.fn().mockReturnValue(mockOrderBy),
      }
      ;(db.select as jest.Mock).mockReturnValue(mockFrom)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockFeeds)
      expect(db.select).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      ;(db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database error')
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch feeds' })
    })
  })

  describe('POST /api/feeds', () => {
    it('should create a new feed successfully', async () => {
      const newFeedData = {
        title: 'New Feed',
        url: 'https://example.com/new-feed.xml',
        description: 'New feed description',
        category: '企業',
        source: 'New Company',
        organization: 'New Corp',
        country: 'JP',
        language: 'ja',
      }

      const mockLimit = {
        limit: jest.fn().mockResolvedValue([]), // No existing feed
      }
      const mockWhere = {
        where: jest.fn().mockReturnValue(mockLimit),
      }
      const mockFrom = {
        from: jest.fn().mockReturnValue(mockWhere),
      }
      ;(db.select as jest.Mock).mockReturnValue(mockFrom)

      const mockReturning = {
        returning: jest.fn().mockResolvedValue([{ ...newFeedData, id: 'test-id-123' }]),
      }
      const mockValues = {
        values: jest.fn().mockReturnValue(mockReturning),
      }
      ;(db.insert as jest.Mock).mockReturnValue(mockValues)

      const request = new NextRequest('http://localhost:3000/api/feeds', {
        method: 'POST',
        body: JSON.stringify(newFeedData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('id', 'test-id-123')
      expect(data).toMatchObject(newFeedData)
    })

    it('should reject feed with missing required fields', async () => {
      const invalidFeedData = {
        title: 'Incomplete Feed',
        // Missing url, category, source
      }

      const request = new NextRequest('http://localhost:3000/api/feeds', {
        method: 'POST',
        body: JSON.stringify(invalidFeedData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Required fields: title, url, category, source' })
    })

    it('should reject duplicate feed URL', async () => {
      const duplicateFeedData = {
        title: 'Duplicate Feed',
        url: 'https://example.com/existing-feed.xml',
        category: '企業',
        source: 'Company',
      }

      const mockLimit = {
        limit: jest.fn().mockResolvedValue([{ id: 'existing-feed', url: duplicateFeedData.url }]),
      }
      const mockWhere = {
        where: jest.fn().mockReturnValue(mockLimit),
      }
      const mockFrom = {
        from: jest.fn().mockReturnValue(mockWhere),
      }
      ;(db.select as jest.Mock).mockReturnValue(mockFrom)

      const request = new NextRequest('http://localhost:3000/api/feeds', {
        method: 'POST',
        body: JSON.stringify(duplicateFeedData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data).toEqual({ error: 'Feed URL already exists' })
    })
  })

  describe('PUT /api/feeds', () => {
    it('should update an existing feed successfully', async () => {
      const feedId = 'feed-123'
      const updateData = {
        title: 'Updated Feed Title',
        isActive: false,
      }

      const existingFeed = {
        id: feedId,
        title: 'Original Title',
        url: 'https://example.com/feed.xml',
        isActive: true,
      }

      // Mock existing feed check
      const mockLimit = {
        limit: jest.fn().mockResolvedValue([existingFeed]),
      }
      const mockWhere = {
        where: jest.fn().mockReturnValue(mockLimit),
      }
      const mockFrom = {
        from: jest.fn().mockReturnValue(mockWhere),
      }
      ;(db.select as jest.Mock).mockReturnValue(mockFrom)

      // Mock update
      const mockReturning = {
        returning: jest.fn().mockResolvedValue([{ ...existingFeed, ...updateData }]),
      }
      const mockWhereUpdate = {
        where: jest.fn().mockReturnValue(mockReturning),
      }
      const mockSet = {
        set: jest.fn().mockReturnValue(mockWhereUpdate),
      }
      ;(db.update as jest.Mock).mockReturnValue(mockSet)

      const request = new NextRequest(`http://localhost:3000/api/feeds?id=${feedId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        ...existingFeed,
        ...updateData,
      })
    })

    it('should return 404 for non-existent feed', async () => {
      const feedId = 'non-existent'

      const mockLimit = {
        limit: jest.fn().mockResolvedValue([]),
      }
      const mockWhere = {
        where: jest.fn().mockReturnValue(mockLimit),
      }
      const mockFrom = {
        from: jest.fn().mockReturnValue(mockWhere),
      }
      ;(db.select as jest.Mock).mockReturnValue(mockFrom)

      const request = new NextRequest(`http://localhost:3000/api/feeds?id=${feedId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Update' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Feed not found' })
    })

    it('should return 400 if feed ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/feeds', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Update' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Feed ID is required' })
    })
  })

  describe('DELETE /api/feeds', () => {
    it('should delete feed and related articles successfully', async () => {
      const feedId = 'feed-to-delete'
      const articleCount = 5

      // Mock article count
      const mockWhereCount = {
        where: jest.fn().mockResolvedValue([{ count: articleCount }]),
      }
      const mockFromCount = {
        from: jest.fn().mockReturnValue(mockWhereCount),
      }
      const mockSelect = {
        select: jest.fn().mockReturnValue(mockFromCount),
      }
      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      // Mock transaction
      ;(db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          delete: jest.fn().mockReturnValue({
            where: jest.fn(),
          }),
        }
        await callback(mockTx)
      })

      const request = new NextRequest(`http://localhost:3000/api/feeds?id=${feedId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Feed and related articles deleted successfully',
        deletedArticleCount: articleCount,
      })
      expect(db.transaction).toHaveBeenCalled()
    })

    it('should return 400 if feed ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/feeds', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Feed ID is required' })
    })

    it('should handle deletion errors', async () => {
      const feedId = 'feed-error'

      ;(db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database error')
      })

      const request = new NextRequest(`http://localhost:3000/api/feeds?id=${feedId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete feed' })
    })
  })
})