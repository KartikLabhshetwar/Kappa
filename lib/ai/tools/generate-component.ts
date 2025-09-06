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
    'Generate React components from API documentation. Can create custom components OR integration wrappers for existing component libraries. Use integration mode when working with established libraries like BillingSDK, shadcn/ui, etc.',
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
  }),
  execute: async ({
    componentName,
    apiDescription,
    props,
    uiLibrary = 'tailwind',
    includeExamples = true,
    integrationMode = false,
    libraryInfo,
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
  }) => {
    try {
      // If integration mode is enabled, generate integration wrapper
      if (integrationMode && libraryInfo) {
        return generateIntegrationWrapper(
          componentName,
          apiDescription,
          props,
          libraryInfo,
          includeExamples,
        );
      }

      // Generate TypeScript interface for props
      const propsInterface = props
        .map(
          (prop: ComponentProp) =>
            `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type}; // ${prop.description}`,
        )
        .join('\n');

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

      // Generate component code
      const componentCode = `import React from 'react';
import { cn } from '@/lib/utils';

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

  return (
    <div className={cn(
      "p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800",
      "border-gray-200 dark:border-gray-700"
    )}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
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
          .join('\n        ')}
      </div>
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

// Helper function to generate integration wrapper
function generateIntegrationWrapper(
  componentName: string,
  apiDescription: string,
  props: ComponentProp[],
  libraryInfo: {
    name: string;
    componentName: string;
    importPath: string;
    installationCommand: string;
  },
  includeExamples: boolean,
) {
  const propsInterface = props
    .map(
      (prop: ComponentProp) =>
        `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type}; // ${prop.description}`,
    )
    .join('\n');

  const integrationCode = `import React, { useState, useEffect } from 'react';
import { ${libraryInfo.componentName} } from '${libraryInfo.importPath}';

interface ${componentName}Props {
${propsInterface}
}

/**
 * ${componentName} - Integration wrapper for ${libraryInfo.name} ${libraryInfo.componentName}
 * 
 * This component:
 * - Fetches data from your API
 * - Transforms data to match ${libraryInfo.componentName} props
 * - Handles loading and error states
 * - Uses the ${libraryInfo.name} component for rendering
 * 
 * @param props - Integration component props
 * @returns JSX element
 */
export function ${componentName}({ 
  ${props.map((p) => p.name).join(', ')} 
}: ${componentName}Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with your actual API endpoint
        const response = await fetch(\`/api/data?${props.map((p) => `${p.name}=$\{${p.name}\}`).join('&')}\`);
        
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const apiData = await response.json();
        
        // TODO: Transform data to match ${libraryInfo.componentName} props
        const transformedData = apiData.map((item: any) => ({
          // Map your API data to ${libraryInfo.componentName} props
          // Example: id: item.id, name: item.name, etc.
        }));
        
        setData(transformedData);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [${props.map((p) => p.name).join(', ')}]);

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
      <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
        <h3 className="font-semibold mb-2">Error loading data</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div>
      <${libraryInfo.componentName} 
        data={data}
        // Pass any additional props as needed
      />
    </div>
  );
}

export default ${componentName};`;

  const usageExamples = includeExamples
    ? `
// Installation
${libraryInfo.installationCommand}

// Basic usage
import { ${componentName} } from './${componentName}';

function App() {
  return (
    <div>
      <${componentName} 
        ${props.map((p) => `${p.name}={${p.type === 'string' ? `"example"` : p.type === 'number' ? '42' : 'true'}}`).join('\n        ')}
      />
    </div>
  );
}

// Library component usage (for reference)
import { ${libraryInfo.componentName} } from '${libraryInfo.importPath}';

<${libraryInfo.componentName} 
  data={yourData}
  // Other props as needed
/>`
    : '';

  const setupInstructions = `
## Setup Instructions

### 1. Install the Component Library
\`\`\`bash
${libraryInfo.installationCommand}
\`\`\`

### 2. Configure API Endpoint
Update the API endpoint in the component:
\`\`\`typescript
const response = await fetch(\`/api/data?${props.map((p) => `${p.name}=$\{${p.name}\}`).join('&')}\`);
\`\`\`

### 3. Customize Data Transformation
Modify the data transformation logic to match your API response structure.

### 4. Import and Use
\`\`\`typescript
import { ${componentName} } from './components/${componentName}';
\`\`\`

## Key Features

- ✅ **Data Fetching**: Automatically fetches data from your API
- ✅ **Data Transformation**: Converts API data to ${libraryInfo.componentName} format
- ✅ **Error Handling**: Comprehensive error states and retry functionality
- ✅ **Loading States**: Professional loading indicators
- ✅ **TypeScript**: Full type safety with proper interfaces
- ✅ **Reusable**: Easy to integrate into any React application
- ✅ **Library Integration**: Uses ${libraryInfo.name} for professional UI

## Dependencies

- React 18+
- ${libraryInfo.name}
- TypeScript (recommended)
`;

  return {
    success: true,
    componentName,
    code: integrationCode,
    usageExamples,
    setupInstructions,
    integrationMode: true,
    libraryInfo,
    generatedAt: new Date().toISOString(),
  };
}
