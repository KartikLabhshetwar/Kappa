import { tool } from 'ai';
import { z } from 'zod';

interface ComponentLibraryInfo {
  name: string;
  componentName: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  installationCommand: string;
  importPath: string;
  usageExample: string;
}

export const generateIntegration = tool({
  description:
    'Generate React integration components that use existing component libraries (like BillingSDK, shadcn/ui, etc.) instead of creating custom components from scratch.',
  inputSchema: z.object({
    integrationName: z
      .string()
      .describe('Name of the integration component to generate'),
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
        props: z
          .array(
            z.object({
              name: z.string(),
              type: z.string(),
              required: z.boolean(),
              description: z.string(),
            }),
          )
          .describe('Props that the library component accepts'),
        installationCommand: z
          .string()
          .describe('Command to install the library'),
        importPath: z.string().describe('Import path for the component'),
        usageExample: z
          .string()
          .describe('Basic usage example from the library docs'),
      })
      .describe('Information about the component library to integrate'),
    dataSource: z
      .object({
        apiEndpoint: z.string().describe('API endpoint to fetch data from'),
        dataTransformation: z
          .string()
          .describe(
            'How to transform API data to match library component props',
          ),
        errorHandling: z.string().describe('Error handling strategy'),
      })
      .describe('Information about data source and transformation'),
    additionalProps: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          required: z.boolean(),
          description: z.string(),
        }),
      )
      .optional()
      .describe('Additional props for the integration component'),
  }),
  execute: async ({
    integrationName,
    libraryInfo,
    dataSource,
    additionalProps = [],
  }: {
    integrationName: string;
    libraryInfo: ComponentLibraryInfo;
    dataSource: {
      apiEndpoint: string;
      dataTransformation: string;
      errorHandling: string;
    };
    additionalProps?: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
  }) => {
    try {
      // Generate TypeScript interface for integration props
      const allProps = [
        ...additionalProps,
        {
          name: 'userId',
          type: 'string',
          required: true,
          description: 'User ID for data fetching',
        },
        {
          name: 'onError',
          type: '(error: Error) => void',
          required: false,
          description: 'Error callback function',
        },
        {
          name: 'className',
          type: 'string',
          required: false,
          description: 'Additional CSS classes',
        },
      ];

      const propsInterface = allProps
        .map(
          (prop) =>
            `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type}; // ${prop.description}`,
        )
        .join('\n');

      // Generate data transformation function
      const dataTransformationCode = `
  // Transform API data to match library component props
  const transformApiData = (apiData: any[]): ${libraryInfo.componentName}Props[] => {
    return apiData.map((item) => ({
      ${libraryInfo.props
        .map(
          (prop) =>
            `${prop.name}: ${
              dataSource.dataTransformation.includes(prop.name)
                ? `item.${prop.name}`
                : `item.${prop.name.toLowerCase()}`
            },`,
        )
        .join('\n      ')}
    }));
  };`;

      // Generate integration component
      const integrationCode = `import React, { useState, useEffect } from 'react';
import { ${libraryInfo.componentName}, type ${libraryInfo.componentName}Props } from '${libraryInfo.importPath}';

interface ${integrationName}Props {
${propsInterface}
}

/**
 * ${integrationName} - Integration component that fetches data and renders using ${libraryInfo.name}
 * 
 * This component:
 * - Fetches data from ${dataSource.apiEndpoint}
 * - Transforms data to match ${libraryInfo.componentName} props
 * - Handles loading and error states
 * - Uses the ${libraryInfo.name} component for rendering
 * 
 * @param props - Integration component props
 * @returns JSX element
 */
export function ${integrationName}({ 
  userId, 
  onError, 
  className,
  ...additionalProps 
}: ${integrationName}Props) {
  const [data, setData] = useState<${libraryInfo.componentName}Props[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

${dataTransformationCode}

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data from API
        const response = await fetch(\`${dataSource.apiEndpoint}?userId=\${userId}\`);
        
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const apiData = await response.json();
        
        // Transform data to match library component props
        const transformedData = transformApiData(apiData);
        setData(transformedData);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [userId, onError]);

  if (loading) {
    return (
      <div className={\`p-4 text-center \${className || ''}\`}>
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
      <div className={\`p-4 text-red-500 bg-red-50 rounded-lg border border-red-200 \${className || ''}\`}>
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
      <div className={\`p-4 text-center text-gray-500 \${className || ''}\`}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <${libraryInfo.componentName} 
        data={data}
        {...additionalProps}
      />
    </div>
  );
}

export default ${integrationName};`;

      // Generate usage examples
      const usageExamples = `
// Installation
${libraryInfo.installationCommand}

// Basic usage
import { ${integrationName} } from './${integrationName}';

function App() {
  const handleError = (error: Error) => {
    console.error('Integration error:', error);
  };

  return (
    <div>
      <${integrationName} 
        userId="user123"
        onError={handleError}
        className="w-full max-w-4xl mx-auto"
      />
    </div>
  );
}

// With additional props
<${integrationName} 
  userId="user123"
  onError={(error) => console.error(error)}
  className="custom-styling"
  ${additionalProps
    .map(
      (prop) =>
        `${prop.name}={${
          prop.type === 'string'
            ? `"example value"`
            : prop.type === 'number'
              ? '42'
              : prop.type === 'boolean'
                ? 'true'
                : 'null'
        }}`,
    )
    .join('\n  ')}
/>

// Library component usage (for reference)
${libraryInfo.usageExample}`;

      // Generate setup instructions
      const setupInstructions = `
## Setup Instructions

### 1. Install the Component Library
\`\`\`bash
${libraryInfo.installationCommand}
\`\`\`

### 2. Import and Use the Integration Component
\`\`\`typescript
import { ${integrationName} } from './components/${integrationName}';
\`\`\`

### 3. Configure API Endpoint
Update the API endpoint in the component:
\`\`\`typescript
const response = await fetch(\`${dataSource.apiEndpoint}?userId=\${userId}\`);
\`\`\`

### 4. Customize Data Transformation
Modify the \`transformApiData\` function to match your API response structure.

### 5. Handle Errors
Implement proper error handling in your application:
\`\`\`typescript
const handleError = (error: Error) => {
  // Your error handling logic
  console.error('Integration error:', error);
};
\`\`\`

## Key Features

- ✅ **Data Fetching**: Automatically fetches data from your API
- ✅ **Data Transformation**: Converts API data to library component format
- ✅ **Error Handling**: Comprehensive error states and retry functionality
- ✅ **Loading States**: Professional loading indicators
- ✅ **TypeScript**: Full type safety with proper interfaces
- ✅ **Reusable**: Easy to integrate into any React application
- ✅ **Customizable**: Accepts additional props for flexibility

## Dependencies

- React 18+
- ${libraryInfo.name}
- TypeScript (recommended)
`;

      return {
        success: true,
        integrationName,
        code: integrationCode,
        usageExamples,
        setupInstructions,
        libraryInfo: {
          name: libraryInfo.name,
          componentName: libraryInfo.componentName,
          installationCommand: libraryInfo.installationCommand,
          importPath: libraryInfo.importPath,
        },
        dataSource: {
          apiEndpoint: dataSource.apiEndpoint,
          dataTransformation: dataSource.dataTransformation,
          errorHandling: dataSource.errorHandling,
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        integrationName,
      };
    }
  },
});
