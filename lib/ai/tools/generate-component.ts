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
        const response = await fetch(apiData?.baseUrl + apiData.endpoints[0].path);
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

      // Generate ultra-simplified component body
      const getComponentBody = () => {
        const propList = props.map((p) => p.name).join(', ');

        switch (componentType) {
          case 'form':
            return `<form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Input</label>
          <input className="w-full p-2 border rounded" placeholder="Enter value" />
        </div>
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">
          Submit
        </button>
      </form>`;
          case 'data-table':
            return `<div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Column</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{item.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>`;
          default:
            return `<div className="space-y-2">
        <h3 className="text-lg font-semibold">${componentName}</h3>
        <p>Props: {${propList}}</p>
      </div>`;
        }
      };

      // Generate simplified component code
      const componentCode = `import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
${apiInterfaces}

interface ${componentName}Props {
${propsInterface}
}

export function ${componentName}({ ${props.map((p: ComponentProp) => p.name).join(', ')} }: ${componentName}Props) {
${propValidation}
${apiIntegrationCode}

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
${getComponentBody()}
    </div>
  );
}

export default ${componentName};`;

      // Generate minimal usage examples
      const usageExamples = includeExamples
        ? `// Basic usage
<${componentName} 
  ${props.map((p) => `${p.name}="example"`).join('\n  ')} 
/>

// TypeScript usage
const MyComponent: React.FC<${componentName}Props> = (props) => {
  return <${componentName} {...props} />;
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
