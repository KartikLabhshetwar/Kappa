'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ComponentPreviewProps {
  componentCode: string;
  componentName: string;
  className?: string;
}

export function ComponentPreview({
  componentCode,
  componentName,
  className,
}: ComponentPreviewProps) {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handlePreview = () => {
    try {
      setPreviewError(null);
      setIsPreviewVisible(true);
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : 'Preview failed',
      );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Component Preview: {componentName}
        </h3>
        <button
          type="button"
          onClick={handlePreview}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {isPreviewVisible && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Live Preview
            </h4>
          </div>
          <div className="p-4 bg-white dark:bg-gray-900">
            {previewError ? (
              <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                <p className="font-medium">Preview Error:</p>
                <p>{previewError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {componentName}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Example prop:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        Example value
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Note: This is a static preview. The actual component would
                  render with your provided props.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Generated Code
          </h4>
        </div>
        <div className="p-4 bg-gray-900 text-gray-100 overflow-x-auto">
          <pre className="text-sm">
            <code>{componentCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
