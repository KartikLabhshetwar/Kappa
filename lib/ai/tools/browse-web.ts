import { tool } from 'ai';
import { z } from 'zod';
import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlAppV1({
  apiKey: process.env.FIRECRAWL_API_KEY || 'demo-key',
});

export const browseWeb = tool({
  description:
    "Perform deep research and comprehensive analysis of websites, documentation, and web content. Uses Firecrawl's advanced crawling and AI-powered research capabilities to gather comprehensive information for component generation and development.",
  inputSchema: z.object({
    url: z.string().describe('The URL to research and analyze'),
    researchType: z
      .enum(['deep-research', 'crawl', 'scrape'])
      .optional()
      .describe(
        'Type of research to perform: deep-research for comprehensive analysis, crawl for multi-page exploration, or scrape for single page',
      ),
    query: z
      .string()
      .optional()
      .describe(
        'Research query for deep research mode (e.g., "React component API documentation")',
      ),
    maxDepth: z
      .number()
      .min(1)
      .max(7)
      .optional()
      .describe('Maximum depth for research iterations (1-7, default: 5)'),
    timeLimit: z
      .number()
      .min(30)
      .max(600)
      .optional()
      .describe('Time limit in seconds for research (30-600, default: 180)'),
    maxUrls: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum number of URLs to analyze (1-100, default: 25)'),
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
    researchType = 'deep-research',
    query,
    includeLinks = true,
    maxDepth = 5,
    timeLimit = 180,
    maxUrls = 25,
    formats = ['markdown', 'html'],
  }) => {
    try {
      // Check if API key is available
      if (!process.env.FIRECRAWL_API_KEY) {
        return {
          success: false,
          url,
          error:
            'Firecrawl API key not configured. Please set FIRECRAWL_API_KEY environment variable.',
        };
      }

      // Validate URL
      new URL(url);

      // Generate research query if not provided
      const researchQuery =
        query ||
        `Comprehensive analysis of ${url} for React component development and API documentation`;

      if (researchType === 'deep-research') {
        // Use deep research for comprehensive analysis
        const researchParams = {
          maxDepth,
          timeLimit,
          maxUrls,
        };

        // Real-time activity tracking
        const activities: string[] = [];
        const onActivity = (activity: any) => {
          activities.push(`[${activity.type}] ${activity.message}`);
        };

        const result = await firecrawl.deepResearch(
          researchQuery,
          researchParams,
          onActivity,
        );

        if (!result.success) {
          return {
            success: false,
            url,
            error: result.error || 'Deep research failed',
            researchType: 'deep-research',
            generatedAt: new Date().toISOString(),
          };
        }

        return {
          success: true,
          url,
          researchType: 'deep-research',
          title: result.data?.finalAnalysis
            ? 'Deep Research Analysis'
            : 'Research in Progress',
          description: `Comprehensive analysis of ${url} with ${result.data?.sources?.length || 0} sources`,
          content: result.data?.finalAnalysis || 'Analysis in progress...',
          sources: result.data?.sources || [],
          activities,
          metadata: {
            sourcesCount: result.data?.sources?.length || 0,
            researchDepth: maxDepth,
            timeLimit,
            maxUrls,
          },
          generatedAt: new Date().toISOString(),
        };
      } else if (researchType === 'crawl') {
        // Use crawl for multi-page exploration
        const crawlOptions = {
          limit: maxUrls,
          scrapeOptions: {
            formats: formats as ('markdown' | 'html' | 'json')[],
            includeLinks,
            maxAge: 3600000, // 1 hour cache
          },
        };

        const result = await firecrawl.crawlUrl(url, crawlOptions);

        if (!result.success) {
          return {
            success: false,
            url,
            error: result.error || 'Crawl failed',
            researchType: 'crawl',
            generatedAt: new Date().toISOString(),
          };
        }

        return {
          success: true,
          url,
          researchType: 'crawl',
          title: `Crawl Results for ${url}`,
          description: `Crawled ${result.data?.length || 0} pages from ${url}`,
          content:
            result.data?.map((page: any) => ({
              url: page.metadata?.sourceURL,
              title: page.metadata?.title,
              content: page.markdown || page.html,
              metadata: page.metadata,
            })) || [],
          pages: result.data?.length || 0,
          metadata: {
            totalPages: result.data?.length || 0,
            formats,
            includeLinks,
          },
          generatedAt: new Date().toISOString(),
        };
      } else {
        // Use scrape for single page analysis
        const scrapeOptions = {
          formats: formats as ('markdown' | 'html' | 'json')[],
          maxAge: 3600000, // 1 hour cache
        };

        const result = await firecrawl.scrapeUrl(url, scrapeOptions);

        if (!result.success) {
          return {
            success: false,
            url,
            error: result.error || 'Scrape failed',
            researchType: 'scrape',
            generatedAt: new Date().toISOString(),
          };
        }

        return {
          success: true,
          url,
          researchType: 'scrape',
          title: result.metadata?.title || 'Scraped Content',
          description: result.metadata?.description || `Content from ${url}`,
          content: result.markdown || result.html || 'No content found',
          metadata: {
            language: result.metadata?.language,
            statusCode: result.metadata?.statusCode,
            sourceURL: result.metadata?.sourceURL,
            title: result.metadata?.title,
            description: result.metadata?.description,
          },
          links: includeLinks ? result.links : undefined,
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        success: false,
        url,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        researchType,
        generatedAt: new Date().toISOString(),
      };
    }
  },
});
