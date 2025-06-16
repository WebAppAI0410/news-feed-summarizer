import { parseRSSFeed, parseRSSFeedClient, RSSFeed } from '@/lib/rss-parser'
import RSSParser from 'rss-parser'

// Mock rss-parser module
jest.mock('rss-parser', () => {
  return jest.fn().mockImplementation(() => ({
    parseURL: jest.fn(),
  }))
})

// Mock fetch for client-side parser
global.fetch = jest.fn()

describe('RSS Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('parseRSSFeed (Server-side)', () => {
    it('should parse RSS feed successfully', async () => {
      const mockFeedData = {
        title: 'Test RSS Feed',
        description: 'Test Description',
        link: 'https://example.com',
        items: [
          {
            title: 'Test Article 1',
            link: 'https://example.com/article1',
            contentSnippet: 'Article 1 snippet',
            content: '<p>Article 1 content</p>',
            isoDate: '2024-01-01T00:00:00Z',
            guid: 'article1-guid',
            creator: 'Author 1',
            categories: ['Tech', 'News'],
          },
          {
            title: 'Test Article 2',
            link: 'https://example.com/article2',
            description: 'Article 2 description',
            pubDate: 'Mon, 01 Jan 2024 00:00:00 GMT',
            author: 'Author 2',
          },
        ],
      }

      const mockParser = new RSSParser()
      ;(mockParser.parseURL as jest.Mock).mockResolvedValue(mockFeedData)

      const result = await parseRSSFeed('https://example.com/feed.xml')

      expect(result).toEqual({
        title: 'Test RSS Feed',
        description: 'Test Description',
        link: 'https://example.com',
        items: [
          {
            title: 'Test Article 1',
            link: 'https://example.com/article1',
            description: 'Article 1 snippet',
            content: '<p>Article 1 content</p>',
            contentSnippet: 'Article 1 snippet',
            pubDate: '2024-01-01T00:00:00Z',
            guid: 'article1-guid',
            creator: 'Author 1',
            author: undefined,
            categories: ['Tech', 'News'],
          },
          {
            title: 'Test Article 2',
            link: 'https://example.com/article2',
            description: 'Article 2 description',
            content: undefined,
            contentSnippet: undefined,
            pubDate: 'Mon, 01 Jan 2024 00:00:00 GMT',
            guid: 'https://example.com/article2',
            creator: undefined,
            author: 'Author 2',
            categories: [],
          },
        ],
      })

      expect(mockParser.parseURL).toHaveBeenCalledWith('https://example.com/feed.xml')
    })

    it('should handle RSS parser errors', async () => {
      const mockParser = new RSSParser()
      const mockError = new Error('Failed to parse RSS')
      ;(mockParser.parseURL as jest.Mock).mockRejectedValue(mockError)

      await expect(parseRSSFeed('https://example.com/feed.xml')).rejects.toThrow('Failed to parse RSS')
    })

    it('should handle empty feed items', async () => {
      const mockFeedData = {
        title: 'Empty Feed',
        link: 'https://example.com',
        items: null,
      }

      const mockParser = new RSSParser()
      ;(mockParser.parseURL as jest.Mock).mockResolvedValue(mockFeedData)

      const result = await parseRSSFeed('https://example.com/feed.xml')

      expect(result.items).toEqual([])
    })

    it('should generate guid when not provided', async () => {
      const mockFeedData = {
        title: 'Test Feed',
        link: 'https://example.com',
        items: [
          {
            title: 'No GUID Article',
            link: '',
            // No guid, no link
          },
        ],
      }

      const mockParser = new RSSParser()
      ;(mockParser.parseURL as jest.Mock).mockResolvedValue(mockFeedData)

      const result = await parseRSSFeed('https://example.com/feed.xml')

      expect(result.items[0].guid).toMatch(/^\d+-0\.\d+$/) // Format: timestamp-random
    })
  })

  describe('parseRSSFeedClient (Client-side)', () => {
    it('should fetch and parse RSS feed via API', async () => {
      const mockResponse: RSSFeed = {
        title: 'Client Test Feed',
        description: 'Client Description',
        link: 'https://example.com',
        items: [
          {
            title: 'Client Article',
            link: 'https://example.com/client',
            description: 'Client article description',
            guid: 'client-guid',
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await parseRSSFeedClient('https://example.com/feed.xml')

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/parse-rss?url=https%3A%2F%2Fexample.com%2Ffeed.xml'
      )
    })

    it('should handle HTTP errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(parseRSSFeedClient('https://example.com/feed.xml')).rejects.toThrow(
        'HTTP error! status: 404'
      )
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(parseRSSFeedClient('https://example.com/feed.xml')).rejects.toThrow(
        'Network error'
      )
    })
  })
})