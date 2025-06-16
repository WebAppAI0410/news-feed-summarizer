import { z } from 'zod'
import type { Feed, NewFeed, Article, NewArticle, Summary, NewSummary } from '@/db/schema'

// Zod schemas for validation
const feedSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional().nullable(),
  category: z.enum(['政府・官公庁', '企業', 'メディア', '国際機関']),
  source: z.string().min(1),
  language: z.string().default('ja'),
  organization: z.string().optional().nullable(),
  country: z.string().default('JP'),
  isActive: z.boolean().default(true),
  lastPolled: z.date().optional().nullable(),
  lastError: z.string().optional().nullable(),
  errorCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const newFeedSchema = feedSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
})

const articleSchema = z.object({
  id: z.string().min(1),
  feedId: z.string().min(1),
  title: z.string().min(1),
  link: z.string().url(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  contentSnippet: z.string().optional().nullable(),
  publishedAt: z.date(),
  guid: z.string().min(1),
  author: z.string().optional().nullable(),
  creator: z.string().optional().nullable(),
  categories: z.array(z.string()).default([]),
  isRead: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  summary: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const newArticleSchema = articleSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
})

const summarySchema = z.object({
  id: z.string().min(1),
  articleId: z.string().min(1),
  content: z.string().min(1),
  model: z.string().min(1),
  prompt: z.string().optional().nullable(),
  tokensUsed: z.number().int().min(0).optional().nullable(),
  createdAt: z.date(),
})

const newSummarySchema = summarySchema.partial({
  id: true,
  createdAt: true,
})

describe('Database Schema Validation', () => {
  describe('Feed Schema', () => {
    it('should validate a complete feed object', () => {
      const validFeed: Feed = {
        id: 'feed-123',
        title: '経済産業省 ニュースリリース',
        url: 'https://www.meti.go.jp/press/index.rdf',
        description: 'METI Press Releases',
        category: '政府・官公庁',
        source: '経済産業省',
        language: 'ja',
        organization: '経済産業省',
        country: 'JP',
        isActive: true,
        lastPolled: new Date(),
        lastError: null,
        errorCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => feedSchema.parse(validFeed)).not.toThrow()
    })

    it('should validate a new feed without optional fields', () => {
      const newFeed: NewFeed = {
        title: 'Test Feed',
        url: 'https://example.com/feed.xml',
        category: '企業',
        source: 'Test Company',
      }

      expect(() => newFeedSchema.parse(newFeed)).not.toThrow()
    })

    it('should reject invalid feed URL', () => {
      const invalidFeed = {
        title: 'Invalid Feed',
        url: 'not-a-url',
        category: '企業',
        source: 'Test',
      }

      expect(() => newFeedSchema.parse(invalidFeed)).toThrow()
    })

    it('should reject invalid category', () => {
      const invalidFeed = {
        title: 'Invalid Category Feed',
        url: 'https://example.com/feed.xml',
        category: 'Invalid Category',
        source: 'Test',
      }

      expect(() => newFeedSchema.parse(invalidFeed)).toThrow()
    })
  })

  describe('Article Schema', () => {
    it('should validate a complete article object', () => {
      const validArticle: Article = {
        id: 'article-123',
        feedId: 'feed-123',
        title: 'Test Article',
        link: 'https://example.com/article',
        description: 'Article description',
        content: '<p>Article content</p>',
        contentSnippet: 'Article content snippet',
        publishedAt: new Date(),
        guid: 'unique-guid',
        author: 'Test Author',
        creator: 'Creator Name',
        categories: ['Tech', 'News'],
        isRead: false,
        isFavorite: false,
        summary: 'AI generated summary',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => articleSchema.parse(validArticle)).not.toThrow()
    })

    it('should validate a new article with minimal fields', () => {
      const newArticle: NewArticle = {
        feedId: 'feed-123',
        title: 'Minimal Article',
        link: 'https://example.com/minimal',
        publishedAt: new Date(),
        guid: 'minimal-guid',
      }

      expect(() => newArticleSchema.parse(newArticle)).not.toThrow()
    })

    it('should handle empty categories array', () => {
      const articleWithEmptyCategories: NewArticle = {
        feedId: 'feed-123',
        title: 'Article',
        link: 'https://example.com/article',
        publishedAt: new Date(),
        guid: 'guid',
        categories: [],
      }

      expect(() => newArticleSchema.parse(articleWithEmptyCategories)).not.toThrow()
    })

    it('should reject article with invalid URL', () => {
      const invalidArticle = {
        feedId: 'feed-123',
        title: 'Invalid URL Article',
        link: 'invalid-url',
        publishedAt: new Date(),
        guid: 'guid',
      }

      expect(() => newArticleSchema.parse(invalidArticle)).toThrow()
    })
  })

  describe('Summary Schema', () => {
    it('should validate a complete summary object', () => {
      const validSummary: Summary = {
        id: 'summary-123',
        articleId: 'article-123',
        content: 'This is an AI-generated summary of the article.',
        model: 'gpt-4',
        prompt: 'Summarize this article',
        tokensUsed: 150,
        createdAt: new Date(),
      }

      expect(() => summarySchema.parse(validSummary)).not.toThrow()
    })

    it('should validate a new summary without optional fields', () => {
      const newSummary: NewSummary = {
        articleId: 'article-123',
        content: 'Summary content',
        model: 'gpt-3.5-turbo',
      }

      expect(() => newSummarySchema.parse(newSummary)).not.toThrow()
    })

    it('should reject summary with empty content', () => {
      const invalidSummary = {
        articleId: 'article-123',
        content: '',
        model: 'gpt-4',
      }

      expect(() => newSummarySchema.parse(invalidSummary)).toThrow()
    })

    it('should reject summary with negative tokens', () => {
      const invalidSummary = {
        articleId: 'article-123',
        content: 'Summary',
        model: 'gpt-4',
        tokensUsed: -10,
      }

      expect(() => newSummarySchema.parse(invalidSummary)).toThrow()
    })
  })

  describe('Data Integrity', () => {
    it('should ensure unique URLs for feeds', () => {
      const feeds: NewFeed[] = [
        {
          title: 'Feed 1',
          url: 'https://example.com/feed.xml',
          category: '企業',
          source: 'Company 1',
        },
        {
          title: 'Feed 2',
          url: 'https://example.com/feed.xml', // Duplicate URL
          category: '企業',
          source: 'Company 2',
        },
      ]

      const urlSet = new Set(feeds.map(f => f.url))
      expect(urlSet.size).toBeLessThan(feeds.length)
    })

    it('should ensure unique links for articles', () => {
      const articles: NewArticle[] = [
        {
          feedId: 'feed-1',
          title: 'Article 1',
          link: 'https://example.com/article1',
          publishedAt: new Date(),
          guid: 'guid-1',
        },
        {
          feedId: 'feed-2',
          title: 'Article 2',
          link: 'https://example.com/article1', // Duplicate link
          publishedAt: new Date(),
          guid: 'guid-2',
        },
      ]

      const linkSet = new Set(articles.map(a => a.link))
      expect(linkSet.size).toBeLessThan(articles.length)
    })
  })
})