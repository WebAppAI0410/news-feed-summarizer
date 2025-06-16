import { GET } from '@/app/api/parse-rss/route'
import { NextRequest } from 'next/server'
import { parseRSSFeed } from '@/lib/rss-parser'

// Mock the RSS parser
jest.mock('@/lib/rss-parser')

describe('Parse RSS API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should parse RSS feed successfully', async () => {
    const mockFeed = {
      title: 'Test Feed',
      description: 'Test Description',
      link: 'https://example.com',
      items: [
        {
          title: 'Test Article',
          link: 'https://example.com/article',
          guid: 'test-guid',
        },
      ],
    }

    ;(parseRSSFeed as jest.Mock).mockResolvedValue(mockFeed)

    const request = new NextRequest('http://localhost:3000/api/parse-rss?url=https://example.com/feed.xml')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockFeed)
    expect(parseRSSFeed).toHaveBeenCalledWith('https://example.com/feed.xml')
  })

  it('should return 400 if URL parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/parse-rss')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'URL parameter is required' })
    expect(parseRSSFeed).not.toHaveBeenCalled()
  })

  it('should return 500 if RSS parsing fails', async () => {
    ;(parseRSSFeed as jest.Mock).mockRejectedValue(new Error('Parsing failed'))

    const request = new NextRequest('http://localhost:3000/api/parse-rss?url=https://example.com/feed.xml')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to parse RSS feed' })
  })

  it('should handle malformed URLs gracefully', async () => {
    ;(parseRSSFeed as jest.Mock).mockRejectedValue(new Error('Invalid URL'))

    const request = new NextRequest('http://localhost:3000/api/parse-rss?url=not-a-url')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to parse RSS feed' })
  })
})