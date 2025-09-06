import { tool } from 'ai';
import { z } from 'zod';
import { Firecrawl } from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY || 'demo-key',
});

// Helper functions to extract component library information
function extractInstallationCommand(content: string): string | null {
  const installMatch = content.match(
    /(?:npm|yarn|pnpm)\s+(?:install|add)\s+[^\n]+/i,
  );
  return installMatch ? installMatch[0].trim() : null;
}

function extractComponentNames(content: string): string[] {
  const componentMatches = content.match(
    /(?:export\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g,
  );
  if (!componentMatches) return [];

  return componentMatches
    .map((match) => match.replace(/(?:export\s+)?(?:function|const)\s+/, ''))
    .filter((name) => name.length > 2)
    .slice(0, 10); // Limit to first 10 components
}

function extractPropsInfo(
  content: string,
): Array<{ name: string; type: string; required: boolean }> {
  const propsMatches = content.match(/(\w+)(\?)?:\s*([^,;]+)/g);
  if (!propsMatches) return [];

  return propsMatches.slice(0, 20).map((match) => {
    const [, name, optional, type] =
      match.match(/(\w+)(\?)?:\s*([^,;]+)/) || [];
    return {
      name: name || '',
      type: (type || 'any').trim(),
      required: !optional,
    };
  });
}

function extractUsageExamples(content: string): string[] {
  const codeBlocks = content.match(/```[\s\S]*?```/g);
  if (!codeBlocks) return [];

  return codeBlocks
    .filter(
      (block) =>
        block.includes('import') ||
        block.includes('<') ||
        block.includes('component') ||
        block.includes('props'),
    )
    .slice(0, 5); // Limit to first 5 examples
}

export const browseWeb = tool({
  description:
    'Browse and scrape content from any website URL. Automatically detects component libraries, API documentation, and SDKs. Prioritizes finding actual component documentation over general marketing pages.',
  inputSchema: z.object({
    url: z.string().describe('The URL to scrape and analyze'),
    includeLinks: z
      .boolean()
      .optional()
      .describe('Whether to include links found on the page'),
    maxDepth: z
      .number()
      .optional()
      .describe(
        'Maximum depth for crawling (1-3). Use 2-3 for component libraries to find docs',
      ),
    focusOnComponents: z
      .boolean()
      .optional()
      .describe(
        'Whether to focus on finding component documentation and usage examples',
      ),
  }),
  execute: async ({
    url,
    includeLinks = false,
    maxDepth = 1,
    focusOnComponents = false,
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

      const scrapeOptions = {
        formats: ['markdown', 'html'] as ('markdown' | 'html')[],
        includeLinks: focusOnComponents ? true : includeLinks,
        ...(maxDepth > 1 && { maxDepth }),
        // For component libraries, increase depth to find documentation
        ...(focusOnComponents && { maxDepth: Math.max(maxDepth, 2) }),
      };

      const result = await firecrawl.scrape(url, scrapeOptions);

      // Analyze content for component library indicators
      const content = result.markdown || result.html || 'No content found';
      const isComponentLibrary =
        focusOnComponents ||
        content.toLowerCase().includes('component') ||
        content.toLowerCase().includes('props') ||
        content.toLowerCase().includes('installation') ||
        content.toLowerCase().includes('usage example') ||
        content.toLowerCase().includes('import') ||
        content.toLowerCase().includes('npm install');

      // Extract component-related information
      const componentInfo = isComponentLibrary
        ? {
            hasComponents: true,
            installationCommand: extractInstallationCommand(content),
            componentNames: extractComponentNames(content),
            propsInfo: extractPropsInfo(content),
            usageExamples: extractUsageExamples(content),
          }
        : null;

      return {
        success: true,
        url,
        title: result.metadata?.title || 'Untitled',
        description: result.metadata?.description || '',
        content,
        metadata: {
          language: result.metadata?.language,
          statusCode: result.metadata?.statusCode,
          sourceURL: result.metadata?.sourceURL,
        },
        links: includeLinks ? result.links : undefined,
        componentInfo,
        isComponentLibrary,
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
