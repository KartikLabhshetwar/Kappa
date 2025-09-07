import { tool } from 'ai';
import { z } from 'zod';

interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export const generateComponent = tool({
  description:
    'Generate production-ready React components from API documentation and structured data. Creates TypeScript components with proper validation, error handling, and modern React patterns. Integrates seamlessly with data from browseWeb tool.',
  inputSchema: z.object({
    componentName: z
      .string()
      .describe('Name of the React component to generate'),
    apiDescription: z
      .string()
      .describe(
        'Description of the API or feature the component should implement',
      ),
    props: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          required: z.boolean(),
          description: z.string(),
        }),
      )
      .describe('Props that the component should accept'),
    uiLibrary: z
      .string()
      .optional()
      .describe(
        'UI library to use for styling (e.g., "tailwind", "chakra", "mantine")',
      ),
    includeExamples: z
      .boolean()
      .optional()
      .describe('Whether to include usage examples'),
    integrationMode: z
      .boolean()
      .optional()
      .describe(
        'Whether to generate an integration wrapper for an existing component library',
      ),
    libraryInfo: z
      .object({
        name: z
          .string()
          .describe(
            'Name of the component library (e.g., BillingSDK, shadcn/ui)',
          ),
        componentName: z
          .string()
          .describe('Name of the specific component to integrate'),
        importPath: z.string().describe('Import path for the component'),
        installationCommand: z
          .string()
          .describe('Command to install the library'),
      })
      .optional()
      .describe('Information about the component library to integrate with'),
    apiData: z
      .object({
        endpoints: z
          .array(
            z.object({
              path: z.string().describe('API endpoint path'),
              method: z.string().describe('HTTP method (GET, POST, etc.)'),
              description: z.string().describe('Endpoint description'),
            }),
          )
          .optional(),
        authentication: z
          .object({
            type: z.string().optional(),
            token: z.string().optional(),
          })
          .optional(),
        baseUrl: z.string().optional(),
        sdkInfo: z
          .object({
            name: z.string().optional(),
            version: z.string().optional(),
          })
          .optional(),
      })
      .optional()
      .describe('Structured API data from browseWeb tool for integration'),
    componentType: z
      .enum([
        'form',
        'display',
        'interactive',
        'layout',
        'data-table',
        'api-integration',
      ])
      .optional()
      .describe('Type of component to generate for better optimization'),
  }),
  execute: async ({
    componentName,
    apiDescription,
    props,
    uiLibrary = 'tailwind',
    includeExamples = true,
    integrationMode = false,
    libraryInfo,
    apiData,
    componentType = 'api-integration',
  }: {
    componentName: string;
    apiDescription: string;
    props: ComponentProp[];
    uiLibrary?: string;
    includeExamples?: boolean;
    integrationMode?: boolean;
    libraryInfo?: {
      name: string;
      componentName: string;
      importPath: string;
      installationCommand: string;
    };
    apiData?: {
      endpoints?: Array<{
        path: string;
        method: string;
        description: string;
      }>;
      authentication?: {
        type?: string;
        token?: string;
      };
      baseUrl?: string;
      sdkInfo?: {
        name?: string;
        version?: string;
      };
    };
    componentType?:
      | 'form'
      | 'display'
      | 'interactive'
      | 'layout'
      | 'data-table'
      | 'api-integration';
  }) => {
    try {
      // Generate simplified props interface
      const propsInterface = props
        .map(
          (prop: ComponentProp) =>
            `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`,
        )
        .join('\n');

      // Generate minimal API interfaces
      const apiInterfaces = apiData?.endpoints
        ? `interface ApiResponse {
  data: any;
  success: boolean;
}`
        : '';

      // Generate minimal prop validation
      const propValidation =
        props.length > 0
          ? `  // Props validation
  if (!props) {
    throw new Error('Props are required');
  }`
          : '';

      // Generate simplified API integration
      const apiIntegrationCode = apiData?.endpoints
        ? `
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const endpoint = apiData?.endpoints?.[0];
        const url = apiData?.baseUrl ? \`\${apiData.baseUrl}\${endpoint?.path}\` : '/api/endpoint';
        const response = await fetch(url);
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'API Error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);`
        : '';

      // Generate UI library specific component body
      const getComponentBody = () => {
        const propList = props.map((p) => p.name).join(', ');

        const getFormComponent = () => {
          switch (uiLibrary) {
            case 'base-ui':
              return `<form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input</label>
          <Input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter value" />
        </div>
        <Button type="submit" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
          Submit
        </Button>
      </form>`;
            case 'origin-ui':
              return `<form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input</label>
          <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800" placeholder="Enter value" />
        </div>
        <button type="submit" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Submit
        </button>
      </form>`;
            default:
              return `<form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input</label>
          <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800" placeholder="Enter value" />
        </div>
        <button type="submit" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Submit
        </button>
      </form>`;
          }
        };

        const getDataTableComponent = () => {
          switch (uiLibrary) {
            case 'base-ui':
              return `<div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Column</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{item.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>`;
            case 'origin-ui':
              return `<div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Column</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{item.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>`;
            default:
              return `<div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">Column</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 text-sm text-gray-900 dark:text-gray-100">{item.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>`;
          }
        };

        switch (componentType) {
          case 'form':
            return getFormComponent();
          case 'data-table':
            return getDataTableComponent();
          default:
            return `<div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">${componentName}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Props: {${propList}}</p>
      </div>`;
        }
      };

      // Generate UI library specific imports
      const getUIImports = () => {
        switch (uiLibrary) {
          case 'base-ui':
            return `import { Button, Input, Select, Dialog, Popover } from '@base-ui-components/react';`;
          case 'origin-ui':
            return `// Origin UI components (copy-paste approach - no imports needed)`;
          case 'chakra':
            return `import { Button, Input, Select, Box, VStack, HStack } from '@chakra-ui/react';`;
          case 'mantine':
            return `import { Button, TextInput, Select, Paper, Stack } from '@mantine/core';`;
          default:
            return `// Tailwind CSS only - no UI library imports`;
        }
      };

      // Generate UI library specific component patterns
      const getUIComponentPattern = (baseContent: string) => {
        switch (uiLibrary) {
          case 'base-ui':
            return baseContent.replace(
              /className="([^"]*)"/g,
              (match, classes) => {
                // Base UI components with Tailwind styling
                return `className="${classes}"`;
              },
            );
          case 'origin-ui':
            return baseContent; // Origin UI uses copy-paste components with Tailwind
          case 'chakra':
            return baseContent
              .replace(/<div/g, '<Box')
              .replace(/<\/div>/g, '</Box>');
          case 'mantine':
            return baseContent
              .replace(/<div/g, '<Paper')
              .replace(/<\/div>/g, '</Paper>');
          default:
            return baseContent; // Pure Tailwind CSS
        }
      };

      // Generate simplified component code
      const componentCode = `import React, { useState, useEffect } from 'react';
${getUIImports()}
${apiInterfaces}

interface ${componentName}Props {
${propsInterface}
}

export function ${componentName}({ ${props.map((p: ComponentProp) => p.name).join(', ')} }: ${componentName}Props) {
${propValidation}
${apiIntegrationCode}

  if (loading) {
    return <div className="p-4 text-center text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">Error: {error}</div>;
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
${getUIComponentPattern(getComponentBody())}
    </div>
  );
}

export default ${componentName};`;

      // Generate UI library specific usage examples
      const usageExamples = includeExamples
        ? `// Basic usage
<${componentName} 
  ${props.map((p) => `${p.name}="example"`).join('\n  ')} 
/>

// TypeScript usage
const MyComponent: React.FC<${componentName}Props> = (props) => {
  return <${componentName} {...props} />;
};

// UI Library: ${uiLibrary}
${uiLibrary === 'base-ui' ? '// Uses @base-ui-components/react for unstyled, accessible components' : ''}
${uiLibrary === 'origin-ui' ? '// Uses Origin UI copy-paste components with Tailwind CSS' : ''}
${uiLibrary === 'tailwind' ? '// Uses pure Tailwind CSS for styling' : ''}`
        : '';

      return {
        success: true,
        componentName,
        code: componentCode,
        usageExamples,
        props: props.map((prop: ComponentProp) => ({
          name: prop.name,
          type: prop.type,
          required: prop.required,
          description: prop.description,
        })),
        uiLibrary,
        componentType,
        apiIntegration: !!apiData?.endpoints,
        metadata: {
          hasApiData: !!apiData,
          endpointsCount: apiData?.endpoints?.length || 0,
          hasAuthentication: !!apiData?.authentication,
          baseUrl: apiData?.baseUrl,
          integrationMode,
          libraryInfo: libraryInfo?.name,
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        componentName,
      };
    }
  },
});
