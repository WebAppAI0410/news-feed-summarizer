import { render, screen } from '@testing-library/react'
import { ArticleCard } from '@/components/ArticleCard'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

describe('ArticleCard Component', () => {
  const mockArticle = {
    id: 'article-1',
    feedId: 'feed-1',
    title: 'Test Article Title',
    description: 'This is a test article description that contains important information.',
    url: 'https://example.com/article',
    publishedAt: new Date('2024-01-01').getTime(),
    createdAt: new Date('2024-01-01').getTime(),
  }

  const mockSummary = {
    id: 'summary-1',
    articleId: 'article-1',
    content: 'This is an AI-generated summary of the article.',
    createdAt: new Date('2024-01-01').getTime(),
  }

  const feedName = 'Test Feed'

  it('should render article basic information', () => {
    render(<ArticleCard article={mockArticle} feedName={feedName} />)

    // Title
    expect(screen.getByText('Test Article Title')).toBeInTheDocument()

    // Description
    expect(screen.getByText('This is a test article description that contains important information.')).toBeInTheDocument()

    // Feed name
    expect(screen.getByText('Test Feed')).toBeInTheDocument()

    // Published date
    const formattedDate = format(new Date(mockArticle.publishedAt), "PPP", { locale: ja })
    expect(screen.getByText(formattedDate)).toBeInTheDocument()

    // External link
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com/article')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should render with AI summary when provided', () => {
    render(<ArticleCard article={mockArticle} summary={mockSummary} feedName={feedName} />)

    // AI summary section
    expect(screen.getByText('AI要約')).toBeInTheDocument()
    expect(screen.getByText('This is an AI-generated summary of the article.')).toBeInTheDocument()
  })

  it('should not render AI summary section when not provided', () => {
    render(<ArticleCard article={mockArticle} feedName={feedName} />)

    // AI summary section should not exist
    expect(screen.queryByText('AI要約')).not.toBeInTheDocument()
  })

  it('should handle long titles with line clamping', () => {
    const longTitleArticle = {
      ...mockArticle,
      title: 'This is a very long article title that should be clamped to prevent overflow in the card component and maintain a clean layout',
    }

    render(<ArticleCard article={longTitleArticle} feedName={feedName} />)

    const titleElement = screen.getByText(longTitleArticle.title)
    expect(titleElement).toHaveClass('line-clamp-2')
  })

  it('should handle long descriptions with line clamping', () => {
    const longDescArticle = {
      ...mockArticle,
      description: 'This is a very long description that goes on and on and on. It contains a lot of text that should be truncated to maintain the card layout. The description continues with more and more text to ensure it exceeds the normal display limits.',
    }

    render(<ArticleCard article={longDescArticle} feedName={feedName} />)

    const descElement = screen.getByText(longDescArticle.description)
    expect(descElement).toHaveClass('line-clamp-3')
  })

  it('should apply hover effects', () => {
    const { container } = render(<ArticleCard article={mockArticle} feedName={feedName} />)

    const card = container.querySelector('.hover\\:shadow-lg')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('transition-shadow')
  })

  it('should format dates in Japanese locale', () => {
    const testDate = new Date('2024-12-25')
    const articleWithSpecificDate = {
      ...mockArticle,
      publishedAt: testDate.getTime(),
    }

    render(<ArticleCard article={articleWithSpecificDate} feedName={feedName} />)

    const expectedDate = format(testDate, "PPP", { locale: ja })
    expect(screen.getByText(expectedDate)).toBeInTheDocument()
  })

  it('should properly separate feed name and date with a bullet', () => {
    render(<ArticleCard article={mockArticle} feedName={feedName} />)

    const bullets = screen.getAllByText('•')
    expect(bullets).toHaveLength(1)
  })
})