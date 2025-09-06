'use client';

import { cn } from '@/lib/utils';
import { type ComponentProps, memo, type ReactNode } from 'react';
import { Streamdown } from 'streamdown';

type ResponseProps = ComponentProps<typeof Streamdown>;

// Helper function to check if children contain block-level elements
const hasBlockElements = (children: ReactNode): boolean => {
  if (!children) return false;

  if (Array.isArray(children)) {
    return children.some((child) => hasBlockElements(child));
  }

  if (typeof children === 'object' && children !== null && 'type' in children) {
    const child = children as any;
    // Check if it's a div or other block element
    if (
      child.type === 'div' ||
      (child.props &&
        (child.props.className?.includes('code-block') ||
          child.props.className?.includes('my-4') ||
          child.props['data-code-block-container']))
    ) {
      return true;
    }

    // Recursively check nested children
    if (child.props?.children) {
      return hasBlockElements(child.props.children);
    }
  }

  return false;
};

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-words [&_code]:whitespace-pre-wrap',
        className,
      )}
      components={{
        p: ({ children, ...props }) => {
          // If this paragraph contains block-level elements, render as div instead
          if (hasBlockElements(children)) {
            return <div {...props}>{children}</div>;
          }

          // Regular paragraph
          return <p {...props}>{children}</p>;
        },
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

Response.displayName = 'Response';
