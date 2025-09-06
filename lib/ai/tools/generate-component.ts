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
        endpoints: z.array(z.any()).optional(),
        authentication: z.any().optional(),
        baseUrl: z.string().optional(),
        sdkInfo: z.any().optional(),
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
      endpoints?: any[];
      authentication?: any;
      baseUrl?: string;
      sdkInfo?: any;
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
      // Generate TypeScript interface for props
      const propsInterface = props
        .map(
          (prop: ComponentProp) =>
            `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type}; // ${prop.description}`,
        )
        .join('\n');

      // Generate API-related interfaces if apiData is provided
      const apiInterfaces = apiData?.endpoints
        ? `
interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responseSchema?: any;
}

interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
  status: number;
}

interface ApiError {
  message: string;
  code: string;
  details?: any;
}`
        : '';

      // Generate prop validation
      const propValidation = props
        .map((prop: ComponentProp) => {
          if (prop.type === 'string') {
            return `    if (typeof ${prop.name} !== 'string') {
      throw new Error('${prop.name} must be a string');
    }`;
          } else if (prop.type === 'number') {
            return `    if (typeof ${prop.name} !== 'number') {
      throw new Error('${prop.name} must be a number');
    }`;
          } else if (prop.type === 'boolean') {
            return `    if (typeof ${prop.name} !== 'boolean') {
      throw new Error('${prop.name} must be a boolean');
    }`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');

      // Generate API integration logic if apiData is provided
      const apiIntegrationCode = apiData?.endpoints
        ? `
  // API Integration
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = async (endpoint: ApiEndpoint, params?: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = \`\${apiData?.baseUrl || ''}\${endpoint.path}\`;
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(apiData?.authentication?.type === 'bearer' && {
            'Authorization': \`Bearer \${apiData.authentication.token}\`
          }),
        },
        body: endpoint.method !== 'GET' ? JSON.stringify(params) : undefined,
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const result: ApiResponse = await response.json();
      setData(result.data);
      return result;
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        code: 'API_ERROR',
        details: err,
      };
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch data on component mount if endpoints are available
    if (apiData?.endpoints && apiData.endpoints.length > 0) {
      fetchData(apiData.endpoints[0]);
    }
  }, []);`
        : '';

      // Generate component-specific rendering logic based on componentType
      const getComponentBody = () => {
        switch (componentType) {
          case 'form':
            return `
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          ${props
            .map(
              (prop: ComponentProp) =>
                `<div>
            <label htmlFor={${prop.name}} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}
            </label>
            <input
              id={${prop.name}}
              type="${prop.type === 'number' ? 'number' : 'text'}"
              value={${prop.name}}
              onChange={(e) => set${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter ${prop.name}"
            />
          </div>`,
            )
            .join('\n          ')}
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit
        </button>
      </form>`;
          case 'data-table':
            return `
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              ${props
                .map(
                  (prop: ComponentProp) =>
                    `<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}
              </th>`,
                )
                .join('\n              ')}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => (
              <tr key={index}>
                ${props
                  .map(
                    (prop: ComponentProp) =>
                      `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {item.${prop.name} || '-'}
                </td>`,
                  )
                  .join('\n                ')}
              </tr>
            ))}
          </tbody>
        </table>
      </div>`;
          case 'display':
            return `
      <div className="space-y-4">
        ${props
          .map(
            (prop: ComponentProp) =>
              `<div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              ${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}:
            </span>
            <span className="text-sm text-gray-900 dark:text-white">
              {${prop.name}}
            </span>
          </div>`,
          )
          .join('\n        ')}
      </div>`;
          default:
            return `
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          ${componentName}
        </h3>
        <div className="space-y-2">
          ${props
            .map(
              (prop: ComponentProp) =>
                `<div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ${prop.name}:
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {${prop.name}}
              </span>
            </div>`,
            )
            .join('\n          ')}
        </div>
      </div>`;
        }
      };

      // Generate component code
      const componentCode = `import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
${apiInterfaces}

interface ${componentName}Props {
${propsInterface}
}

/**
 * ${componentName} - ${apiDescription}
 * 
 * @param props - Component props
 * @returns JSX element
 */
export function ${componentName}({ ${props.map((p: ComponentProp) => p.name).join(', ')} }: ${componentName}Props) {
  // Validate props
${propValidation}
${apiIntegrationCode}

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
        <h3 className="font-semibold mb-2">Error</h3>
        <p className="text-sm">{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm dark:bg-red-800 dark:hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800",
      "border-gray-200 dark:border-gray-700"
    )}>
${getComponentBody()}
    </div>
  );
}

export default ${componentName};`;

      // Generate usage examples
      const usageExamples = includeExamples
        ? `
// Usage Examples:

// Basic usage
<${componentName} 
  ${props
    .map(
      (prop: ComponentProp) =>
        `${prop.name}={${
          prop.type === 'string'
            ? `"example ${prop.name}"`
            : prop.type === 'number'
              ? '42'
              : prop.type === 'boolean'
                ? 'true'
                : 'null'
        }}`,
    )
    .join('\n  ')} 
/>

// With all props
<${componentName} 
  ${props
    .map(
      (prop: ComponentProp) =>
        `${prop.name}={${
          prop.type === 'string'
            ? `"${prop.name} value"`
            : prop.type === 'number'
              ? '100'
              : prop.type === 'boolean'
                ? 'false'
                : 'null'
        }}`,
    )
    .join('\n  ')} 
/>

// TypeScript usage
const MyComponent: React.FC<${componentName}Props> = (props) => {
  return <${componentName} {...props} />;
};

${
  apiData?.endpoints
    ? `
// API Integration Example
const ApiComponent = () => {
  const [apiData, setApiData] = useState({
    endpoints: ${JSON.stringify(apiData.endpoints, null, 2)},
    baseUrl: "${apiData.baseUrl || ''}",
    authentication: ${JSON.stringify(apiData.authentication || {}, null, 2)}
  });

  return (
    <${componentName} 
      ${props
        .map(
          (prop: ComponentProp) =>
            `${prop.name}={${
              prop.type === 'string'
                ? `"${prop.name} value"`
                : prop.type === 'number'
                  ? '42'
                  : prop.type === 'boolean'
                    ? 'true'
                    : 'null'
            }}`,
        )
        .join('\n      ')} 
      apiData={apiData}
    />
  );
};`
    : ''
}

// Error handling
const ErrorHandlingExample = () => {
  const [error, setError] = useState<string | null>(null);
  
  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      <${componentName} 
        ${props
          .map(
            (prop: ComponentProp) =>
              `${prop.name}={${
                prop.type === 'string'
                  ? `"${prop.name} value"`
                  : prop.type === 'number'
                    ? '42'
                    : prop.type === 'boolean'
                      ? 'true'
                      : 'null'
              }}`,
          )
          .join('\n        ')} 
      />
    </div>
  );
};`
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
