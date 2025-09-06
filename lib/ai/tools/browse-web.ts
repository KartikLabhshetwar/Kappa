import { tool } from 'ai';
import { z } from 'zod';
import { Firecrawl } from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY || 'demo-key',
});

export const browseWeb = tool({
  description:
    'Browse and scrape content from any website URL. Useful for reading API documentation, blog posts, or any web content.',
  inputSchema: z.object({
    url: z.string().describe('The URL to scrape and analyze'),
    includeLinks: z
      .boolean()
      .optional()
      .describe('Whether to include links found on the page'),
    maxDepth: z
      .number()
      .optional()
      .describe('Maximum depth for crawling (1-3)'),
  }),
  execute: async ({ url, includeLinks = false, maxDepth = 1 }) => {
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

      const scrapeOptions = {
        formats: ['markdown', 'html'] as ('markdown' | 'html')[],
        includeLinks,
        ...(maxDepth > 1 && { maxDepth }),
      };

      const result = await firecrawl.scrape(url, scrapeOptions);

      return {
        success: true,
        url,
        title: result.metadata?.title || 'Untitled',
        description: result.metadata?.description || '',
        content: result.markdown || result.html || 'No content found',
        metadata: {
          language: result.metadata?.language,
          statusCode: result.metadata?.statusCode,
          sourceURL: result.metadata?.sourceURL,
        },
        links: includeLinks ? result.links : undefined,
      };
    } catch (error) {
      return {
        success: false,
        url,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
