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
    'Generate React components from API documentation. Creates typed components with proper validation and usage examples.',
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
  }),
  execute: async ({
    componentName,
    apiDescription,
    props,
    uiLibrary = 'tailwind',
    includeExamples = true,
  }: {
    componentName: string;
    apiDescription: string;
    props: ComponentProp[];
    uiLibrary?: string;
    includeExamples?: boolean;
  }) => {
    try {
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
