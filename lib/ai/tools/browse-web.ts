import { tool } from 'ai';
import { z } from 'zod';
import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

// TypeScript interfaces for better type safety
interface ScrapedData {
  url: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  links: string[];
  scrapedAt: string;
}

interface CrawlResult {
  success: boolean;
  data?: ScrapedData[];
  totalPages?: number;
  error?: string;
  metadata?: {
    totalPages: number;
    formats: string[];
    includeLinks: boolean;
    maxDepth?: number;
    baseDomain?: string;
  };
}

interface IterativeCrawlOptions {
  maxDepth: number;
  maxPagesPerDepth: number;
  baseDomain: string;
  visitedUrls: Set<string>;
  currentDepthUrls: string[];
  allResults: ScrapedData[];
}

// Enhanced logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(
      `[BROWSE-WEB] INFO: ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    );
  },
  error: (message: string, error?: any) => {
    console.error(`[BROWSE-WEB] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(
      `[BROWSE-WEB] WARN: ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    );
  },
  debug: (message: string, data?: any) => {
    console.log(
      `[BROWSE-WEB] DEBUG: ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    );
  },
};

const firecrawl = new FirecrawlAppV1({
  apiKey: process.env.FIRECRAWL_API_KEY || 'demo-key',
});

// Log initialization
logger.info('Firecrawl initialized', {
  hasApiKey: !!process.env.FIRECRAWL_API_KEY,
  apiKeyPrefix: process.env.FIRECRAWL_API_KEY
    ? `${process.env.FIRECRAWL_API_KEY.substring(0, 8)}...`
    : 'demo-key',
});

// Utility function to extract links from markdown content
function extractLinksFromMarkdown(
  markdownContent: string,
  baseUrl: string,
): string[] {
  const links = new Set<string>();

  // Pattern to match markdown links [text](url)
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  // Pattern to match plain URLs
  const urlPattern = /https?:\/\/[^\s\)]+/g;

  // Extract markdown links
  let match: RegExpExecArray | null = markdownLinkPattern.exec(markdownContent);
  while (match !== null) {
    const linkUrl = match[2];
    if (linkUrl.startsWith('http')) {
      links.add(linkUrl);
    } else {
      // Convert relative URLs to absolute
      const absoluteUrl = new URL(linkUrl, baseUrl).href;
      links.add(absoluteUrl);
    }
    match = markdownLinkPattern.exec(markdownContent);
  }

  // Extract plain URLs
  match = urlPattern.exec(markdownContent);
  while (match !== null) {
    let linkUrl = match[0];
    // Remove trailing punctuation
    linkUrl = linkUrl.replace(/[.,;:!?]+$/, '');
    links.add(linkUrl);
    match = urlPattern.exec(markdownContent);
  }

  return Array.from(links);
}

// Utility function to extract base domain from URL
function extractBaseDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function normalizeUrl(url: string): string {
  // If URL already has protocol, return as is
  if (url.match(/^https?:\/\//)) {
    return url;
  }

  // If URL starts with www., add https://
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }

  // If URL doesn't have protocol, add https://
  if (!url.includes('://')) {
    return `https://${url}`;
  }

  return url;
}

// Enhanced scraper class with iterative crawling capabilities
class FirecrawlScraper {
  private firecrawl: FirecrawlAppV1;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(apiKey?: string) {
    this.firecrawl = new FirecrawlAppV1({
      apiKey: apiKey || process.env.FIRECRAWL_API_KEY || 'demo-key',
    });
  }

  // Retry mechanism for handling temporary failures
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = this.maxRetries,
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(
          `Attempting ${operationName} (attempt ${attempt}/${retries})`,
        );
        const result = await operation();
        logger.debug(`${operationName} succeeded on attempt ${attempt}`);
        return result;
      } catch (error) {
        const isLastAttempt = attempt === retries;
        const isRetryableError = this.isRetryableError(error);

        logger.warn(`${operationName} failed on attempt ${attempt}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          isRetryableError,
          isLastAttempt,
          attempt,
          maxRetries: retries,
        });

        if (isLastAttempt || !isRetryableError) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        logger.debug(`Waiting ${delay}ms before retry`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(`${operationName} failed after ${retries} attempts`);
  }

  // Check if an error is retryable (502, 503, 504, network errors, etc.)
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || error.toString();
    const errorCode = error.code || error.status || error.statusCode;

    // Check for specific HTTP status codes that are retryable
    const retryableStatusCodes = [502, 503, 504, 408, 429];
    if (errorCode && retryableStatusCodes.includes(Number(errorCode))) {
      return true;
    }

    // Check for network-related error messages
    const retryableErrorMessages = [
      '502',
      '503',
      '504',
      'timeout',
      'network',
      'connection',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'Unexpected error occurred while trying to scrape URL',
    ];

    return retryableErrorMessages.some((msg) =>
      errorMessage.toLowerCase().includes(msg.toLowerCase()),
    );
  }

  async scrapeUrl(
    url: string,
    includeLinks = true,
    formats = ['markdown', 'html'],
  ): Promise<ScrapedData> {
    logger.info('Starting URL scrape', { url, includeLinks, formats });

    try {
      // Validate URL before scraping
      new URL(url);
      logger.debug('URL validation passed', { url });

      const scrapeOptions = {
        formats: formats as ('markdown' | 'html' | 'json')[],
        maxAge: 3600000, // 1 hour cache
      };

      logger.debug('Calling Firecrawl scrapeUrl', {
        url,
        options: scrapeOptions,
      });

      // Use retry mechanism for scraping
      const result = await this.retryWithBackoff(
        () => this.firecrawl.scrapeUrl(url, scrapeOptions),
        `scrapeUrl(${url})`,
      );

      logger.debug('Firecrawl response received', {
        success: result.success,
        hasMarkdown: result.success ? !!result.markdown : false,
        hasHtml: result.success ? !!result.html : false,
        hasMetadata: result.success ? !!result.metadata : false,
        hasLinks: result.success ? !!result.links : false,
        markdownLength: result.success ? result.markdown?.length || 0 : 0,
        htmlLength: result.success ? result.html?.length || 0 : 0,
        error: result.success ? undefined : result.error,
      });

      if (!result.success) {
        logger.error('Firecrawl scraping failed', {
          url,
          error: result.error,
          statusCode: (result as any).statusCode,
          response: result,
        });
        throw new Error(result.error || 'Scraping failed');
      }

      // Extract links from markdown content if not provided by SDK
      let links: string[] = result.links || [];
      if (!links.length && result.markdown && includeLinks) {
        logger.debug('Extracting links from markdown content', {
          markdownLength: result.markdown.length,
          baseUrl: url,
        });
        links = extractLinksFromMarkdown(result.markdown, url);
        logger.debug('Links extracted from markdown', {
          linksCount: links.length,
        });
      }

      const scrapedData = {
        url,
        title: result.metadata?.title || 'No title',
        content: result.markdown || result.html || '',
        metadata: result.metadata || {},
        links,
        scrapedAt: new Date().toISOString(),
      };

      logger.info('URL scrape completed successfully', {
        url,
        title: scrapedData.title,
        contentLength: scrapedData.content.length,
        linksCount: scrapedData.links.length,
        metadataKeys: Object.keys(scrapedData.metadata),
      });

      return scrapedData;
    } catch (error) {
      logger.error('URL scrape failed', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
      });

      throw new Error(
        `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async crawlUrl(
    url: string,
    maxPages = 10,
    includeLinks = true,
    formats = ['markdown', 'html'],
  ): Promise<ScrapedData[]> {
    logger.info('Starting URL crawl', { url, maxPages, includeLinks, formats });

    try {
      // Validate URL before crawling
      new URL(url);
      logger.debug('URL validation passed for crawl', { url });

      const crawlOptions = {
        limit: maxPages,
        scrapeOptions: {
          formats: formats as ('markdown' | 'html' | 'json')[],
          maxAge: 3600000, // 1 hour cache
        },
      };

      logger.debug('Calling Firecrawl crawlUrl', {
        url,
        options: crawlOptions,
      });

      // Use retry mechanism for crawling
      const result = await this.retryWithBackoff(
        () => this.firecrawl.crawlUrl(url, crawlOptions),
        `crawlUrl(${url})`,
      );

      logger.debug('Firecrawl crawl response received', {
        success: result.success,
        dataLength: result.success ? result.data?.length || 0 : 0,
        error: result.success ? undefined : result.error,
        hasData: result.success ? !!result.data : false,
      });

      if (!result.success) {
        logger.error('Firecrawl crawling failed', {
          url,
          error: result.error,
          statusCode: (result as any).statusCode,
          response: result,
        });
        throw new Error(result.error || 'Crawling failed');
      }

      const crawledData = (result.data || []).map(
        (page: any, index: number) => {
          logger.debug(`Processing crawled page ${index + 1}`, {
            sourceURL: page.metadata?.sourceURL,
            title: page.metadata?.title,
            hasMarkdown: !!page.markdown,
            hasHtml: !!page.html,
            hasLinks: !!page.links,
          });

          return {
            url: page.metadata?.sourceURL || '',
            title: page.metadata?.title || 'No title',
            content: page.markdown || page.html || '',
            metadata: page.metadata || {},
            links: page.links || [],
            scrapedAt: new Date().toISOString(),
          };
        },
      );

      logger.info('URL crawl completed successfully', {
        url,
        pagesCrawled: crawledData.length,
        totalContentLength: crawledData.reduce(
          (sum, page) => sum + page.content.length,
          0,
        ),
        totalLinks: crawledData.reduce(
          (sum, page) => sum + page.links.length,
          0,
        ),
      });

      return crawledData;
    } catch (error) {
      logger.error('URL crawl failed', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
      });

      throw new Error(
        `Crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async iterativeCrawl(
    baseUrl: string,
    maxDepth = 3,
    maxPagesPerDepth = 50,
  ): Promise<ScrapedData[]> {
    const baseDomain = extractBaseDomain(baseUrl);
    const visitedUrls = new Set<string>();
    const allResults: ScrapedData[] = [];
    let currentDepthUrls = [baseUrl];

    console.log(
      `🌐 Starting iterative crawl of ${baseUrl} to depth ${maxDepth}`,
    );
    console.log(`🎯 Base domain: ${baseDomain}`);

    for (let depth = 0; depth <= maxDepth; depth++) {
      if (currentDepthUrls.length === 0) {
        console.log(`📭 No URLs found at depth ${depth}, stopping crawl`);
        break;
      }

      console.log(
        `📊 Crawling depth ${depth}: ${currentDepthUrls.length} URLs`,
      );
      const depthResults: ScrapedData[] = [];
      const nextDepthUrls = new Set<string>();

      for (const url of currentDepthUrls) {
        if (visitedUrls.has(url)) {
          continue;
        }

        try {
          // Scrape the current URL
          const pageData = await this.scrapeUrl(url, true);
          depthResults.push(pageData);
          visitedUrls.add(url);

          console.log(`✅ Scraped: ${url}`);

          // Extract links from this page for next depth
          for (const link of pageData.links) {
            try {
              // Convert relative URLs to absolute
              const absoluteLink = new URL(link, url).href;
              const parsedLink = new URL(absoluteLink);

              // Only follow links within the same domain
              if (
                parsedLink.hostname === baseDomain &&
                !visitedUrls.has(absoluteLink) &&
                !nextDepthUrls.has(absoluteLink)
              ) {
                nextDepthUrls.add(absoluteLink);
              }
            } catch {
              // Skip invalid URLs
              continue;
            }
          }

          // Limit pages per depth
          if (depthResults.length >= maxPagesPerDepth) {
            console.log(
              `⚠️ Reached max pages limit (${maxPagesPerDepth}) at depth ${depth}`,
            );
            break;
          }
        } catch (error) {
          console.log(`❌ Failed to scrape ${url}: ${error}`);
          continue;
        }
      }

      allResults.push(...depthResults);
      currentDepthUrls = Array.from(nextDepthUrls);

      console.log(
        `📈 Depth ${depth} complete: ${depthResults.length} pages scraped`,
      );
      console.log(
        `🔗 Found ${currentDepthUrls.length} new URLs for depth ${depth + 1}`,
      );

      // Add a small delay between depths to be respectful
      if (currentDepthUrls.length > 0 && depth < maxDepth) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `🎉 Iterative crawl complete: ${allResults.length} total pages scraped`,
    );
    return allResults;
  }

  async searchAndScrape(query: string, maxResults = 5): Promise<ScrapedData[]> {
    // Basic search implementation using common search URLs
    const searchUrls = [
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    ];

    const results: ScrapedData[] = [];
    for (const url of searchUrls.slice(0, maxResults)) {
      try {
        const data = await this.scrapeUrl(url);
        results.push(data);
      } catch (error) {
        console.log(`Failed to scrape ${url}: ${error}`);
      }
    }

    return results;
  }
}

export const browseWeb = tool({
  description:
    'Perform intelligent web scraping, crawling, and research using Firecrawl with multiple modes. Use mode="single" for quick single-page extraction, mode="crawl" for multi-page API documentation, mode="iterative" for structured depth-based research, mode="search" for content discovery, or mode="deep-research" for comprehensive AI analysis. Perfect for gathering information for component development and documentation analysis.',
  inputSchema: z.object({
    url: z.string().describe('The URL to research and analyze'),
    mode: z
      .enum(['single', 'crawl', 'iterative', 'search', 'deep-research'])
      .optional()
      .describe(
        'Scraping mode: single for one page, crawl for multi-page exploration, iterative for depth-based crawling, search for search results, deep-research for AI-powered comprehensive analysis',
      ),
    query: z
      .string()
      .optional()
      .describe(
        'Research query for deep research mode or search query for search mode (e.g., "React component API documentation")',
      ),
    maxDepth: z
      .number()
      .min(1)
      .max(7)
      .optional()
      .describe('Maximum depth for iterative crawling (1-7, default: 3)'),
    maxPages: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of pages to crawl (1-100, default: 10)'),
    maxPagesPerDepth: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .describe(
        'Maximum pages per depth level for iterative crawling (1-50, default: 25)',
      ),
    timeLimit: z
      .number()
      .min(30)
      .max(600)
      .optional()
      .describe(
        'Time limit in seconds for deep research (30-600, default: 180)',
      ),
    includeLinks: z
      .boolean()
      .optional()
      .describe('Whether to include links found on the page'),
    formats: z
      .array(z.enum(['markdown', 'html', 'json']))
      .optional()
      .describe('Output formats for content extraction'),
  }),
  execute: async ({
    url,
    mode = 'single',
    query,
    includeLinks = true,
    maxDepth = 3,
    maxPages = 10,
    maxPagesPerDepth = 25,
    timeLimit = 180,
    formats = ['markdown', 'html'],
  }) => {
    logger.info('BrowseWeb tool execution started', {
      url,
      mode,
      query,
      includeLinks,
      maxDepth,
      maxPages,
      maxPagesPerDepth,
      timeLimit,
      formats,
    });

    // Normalize URL early for consistent usage throughout the function
    const normalizedUrl = normalizeUrl(url);

    try {
      // Check if API key is available
      if (!process.env.FIRECRAWL_API_KEY) {
        logger.error('Firecrawl API key not configured');
        return {
          success: false,
          url: normalizedUrl,
          error:
            'Firecrawl API key not configured. Please set FIRECRAWL_API_KEY environment variable.',
        };
      }

      // Validate URL
      try {
        new URL(normalizedUrl);
        logger.debug('URL validation passed', {
          originalUrl: url,
          normalizedUrl,
        });
      } catch (urlError) {
        logger.error('Invalid URL provided', {
          url,
          normalizedUrl,
          error: urlError,
        });
        return {
          success: false,
          url,
          error: `Invalid URL: ${urlError instanceof Error ? urlError.message : 'Unknown URL error'}`,
          mode,
          generatedAt: new Date().toISOString(),
        };
      }

      // Initialize the enhanced scraper
      logger.debug('Initializing FirecrawlScraper');
      const scraper = new FirecrawlScraper();

      if (mode === 'single') {
        logger.info('Executing single page scrape mode', {
          url: normalizedUrl,
        });
        // Single page scraping
        const data = await scraper.scrapeUrl(
          normalizedUrl,
          includeLinks,
          formats,
        );

        logger.info('Single page scrape completed successfully', {
          url: data.url,
          title: data.title,
          contentLength: data.content.length,
          linksCount: data.links.length,
        });

        return {
          success: true,
          mode: 'single',
          url: data.url,
          title: data.title,
          content: data.content,
          metadata: data.metadata,
          links: data.links,
          scrapedAt: data.scrapedAt,
          generatedAt: new Date().toISOString(),
        };
      } else if (mode === 'crawl') {
        logger.info('Executing multi-page crawl mode', {
          url: normalizedUrl,
          maxPages,
        });
        // Multi-page crawling
        const dataList = await scraper.crawlUrl(
          normalizedUrl,
          maxPages,
          includeLinks,
          formats,
        );

        logger.info('Multi-page crawl completed successfully', {
          url: normalizedUrl,
          pagesCrawled: dataList.length,
          totalContentLength: dataList.reduce(
            (sum, page) => sum + page.content.length,
            0,
          ),
        });

        return {
          success: true,
          mode: 'crawl',
          url: normalizedUrl,
          title: `Crawl Results for ${normalizedUrl}`,
          description: `Crawled ${dataList.length} pages from ${normalizedUrl}`,
          data: dataList,
          totalPages: dataList.length,
          metadata: {
            totalPages: dataList.length,
            formats,
            includeLinks,
          },
          generatedAt: new Date().toISOString(),
        };
      } else if (mode === 'iterative') {
        logger.info('Executing iterative crawl mode', {
          url: normalizedUrl,
          maxDepth,
          maxPagesPerDepth,
        });
        // Iterative depth-based crawling
        const dataList = await scraper.iterativeCrawl(
          normalizedUrl,
          maxDepth,
          maxPagesPerDepth,
        );

        logger.info('Iterative crawl completed successfully', {
          url: normalizedUrl,
          maxDepth,
          pagesCrawled: dataList.length,
          totalContentLength: dataList.reduce(
            (sum, page) => sum + page.content.length,
            0,
          ),
        });

        return {
          success: true,
          mode: 'iterative',
          url: normalizedUrl,
          title: `Iterative Crawl Results for ${normalizedUrl}`,
          description: `Iteratively crawled ${dataList.length} pages from ${normalizedUrl} to depth ${maxDepth}`,
          data: dataList,
          totalPages: dataList.length,
          maxDepth,
          metadata: {
            totalPages: dataList.length,
            maxDepth,
            baseDomain: extractBaseDomain(normalizedUrl),
            formats,
            includeLinks,
          },
          generatedAt: new Date().toISOString(),
        };
      } else if (mode === 'search') {
        logger.info('Executing search mode', {
          query: query || normalizedUrl,
          maxPages,
        });
        // Search and scrape functionality
        const searchQuery = query || normalizedUrl;
        const dataList = await scraper.searchAndScrape(searchQuery, maxPages);

        logger.info('Search completed successfully', {
          searchQuery,
          resultsFound: dataList.length,
        });

        return {
          success: true,
          mode: 'search',
          url: normalizedUrl,
          query: searchQuery,
          title: `Search Results for "${searchQuery}"`,
          description: `Found ${dataList.length} search results`,
          data: dataList,
          totalResults: dataList.length,
          metadata: {
            totalResults: dataList.length,
            searchQuery,
            formats,
            includeLinks,
          },
          generatedAt: new Date().toISOString(),
        };
      } else if (mode === 'deep-research') {
        logger.info('Executing deep research mode', {
          url: normalizedUrl,
          query,
          maxDepth,
          timeLimit,
          maxPages,
        });
        // Deep research using Firecrawl's AI capabilities
        const researchQuery =
          query ||
          `Comprehensive analysis of ${normalizedUrl} for React component development and API documentation`;

        const researchParams = {
          maxDepth,
          timeLimit,
          maxUrls: maxPages,
        };

        logger.debug('Starting deep research', {
          researchQuery,
          researchParams,
        });

        // Real-time activity tracking
        const activities: string[] = [];
        const onActivity = (activity: any) => {
          logger.debug('Deep research activity', { activity });
          activities.push(`[${activity.type}] ${activity.message}`);
        };

        const result = await firecrawl.deepResearch(
          researchQuery,
          researchParams,
          onActivity,
        );

        logger.debug('Deep research response received', {
          success: result.success,
          hasFinalAnalysis: result.success
            ? !!result.data?.finalAnalysis
            : false,
          sourcesCount: result.success ? result.data?.sources?.length || 0 : 0,
          activitiesCount: activities.length,
          error: result.success ? undefined : result.error,
        });

        if (!result.success) {
          logger.error('Deep research failed', {
            url: normalizedUrl,
            error: result.error,
            researchQuery,
            researchParams,
          });
          return {
            success: false,
            url: normalizedUrl,
            error: result.error || 'Deep research failed',
            mode: 'deep-research',
            generatedAt: new Date().toISOString(),
          };
        }

        logger.info('Deep research completed successfully', {
          url: normalizedUrl,
          sourcesCount: result.data?.sources?.length || 0,
          hasFinalAnalysis: !!result.data?.finalAnalysis,
          activitiesCount: activities.length,
        });

        return {
          success: true,
          mode: 'deep-research',
          url: normalizedUrl,
          title: result.data?.finalAnalysis
            ? 'Deep Research Analysis'
            : 'Research in Progress',
          description: `Comprehensive analysis of ${normalizedUrl} with ${result.data?.sources?.length || 0} sources`,
          content: result.data?.finalAnalysis || 'Analysis in progress...',
          sources: result.data?.sources || [],
          activities,
          metadata: {
            sourcesCount: result.data?.sources?.length || 0,
            researchDepth: maxDepth,
            timeLimit,
            maxUrls: maxPages,
          },
          generatedAt: new Date().toISOString(),
        };
      } else {
        logger.error('Invalid mode provided', {
          mode,
          validModes: [
            'single',
            'crawl',
            'iterative',
            'search',
            'deep-research',
          ],
        });
        return {
          success: false,
          url: normalizedUrl,
          error: `Invalid mode: ${mode}. Use 'single', 'crawl', 'iterative', 'search', or 'deep-research'`,
          mode,
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      logger.error('BrowseWeb tool execution failed', {
        url: normalizedUrl,
        mode,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        errorDetails: error,
      });

      return {
        success: false,
        url: normalizedUrl,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        mode,
        generatedAt: new Date().toISOString(),
      };
    }
  },
});
