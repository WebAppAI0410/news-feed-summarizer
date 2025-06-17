export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  guid: string;
  creator?: string;
  author?: string;
  categories?: string[];
}

export interface RSSFeed {
  title: string;
  description?: string;
  link: string;
  items: RSSItem[];
}

// Dynamic import for server-side RSS parsing
let Parser: any;

// Node.js環境用のRSSパーサー
export async function parseRSSFeed(url: string): Promise<RSSFeed> {
  try {
    // サーバーサイドでのみDOMParserが利用できないので、
    // rss-parserライブラリを動的インポートで使用
    if (!Parser) {
      Parser = (await import('rss-parser')).default;
    }
    
    const parser = new Parser({
      headers: {
        'User-Agent': 'RSS News Summarizer/1.0',
      },
      timeout: 30000,
      customFields: {
        item: [
          ['content:encoded', 'content'],
          ['dc:creator', 'creator'],
        ],
      },
    });
    
    const feed = await parser.parseURL(url);
    
    return {
      title: feed.title || '',
      description: feed.description,
      link: feed.link || '',
      items: (feed.items || []).map((item: any) => ({
        title: item.title || '',
        link: item.link || '',
        description: item.contentSnippet || item.description,
        content: item.content || item['content:encoded'],
        contentSnippet: item.contentSnippet,
        pubDate: item.isoDate || item.pubDate,
        guid: item.guid || item.link || `${Date.now()}-${Math.random()}`,
        creator: item.creator || item['dc:creator'],
        author: item.author,
        categories: item.categories || [],
      })),
    };
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw error;
  }
}

// クライアントサイド用の簡易版
export async function parseRSSFeedClient(url: string): Promise<RSSFeed> {
  try {
    const response = await fetch(`/api/parse-rss?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw error;
  }
}