'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Response } from './elements/response';
import { MessageContent } from './elements/message';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from './elements/tool';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { CodeBlock } from './elements/code-block';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
  isArtifactVisible,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  isArtifactVisible: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn('flex items-start gap-3', {
            'w-full': mode === 'edit',
            'max-w-xl ml-auto justify-end mr-6':
              message.role === 'user' && mode !== 'edit',
            'justify-start -ml-3': message.role === 'assistant',
          })}
        >
          {message.role === 'assistant' && (
            <div className="flex justify-center items-center mt-1 rounded-full ring-1 size-8 shrink-0 ring-border bg-background">
              <SparklesIcon size={14} />
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
              'w-full': message.role === 'assistant',
              'w-fit': message.role === 'user',
            })}
          >
            {attachmentsFromMessage.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row gap-2 justify-end"
              >
                {attachmentsFromMessage.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      name: attachment.filename ?? 'file',
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning' && part.text?.trim().length > 0) {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 rounded-full opacity-0 h-fit text-muted-foreground group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <MessageContent
                        data-testid="message-content"
                        className={cn('justify-start items-start text-left', {
                          'bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white [&_a]:text-blue-500 [&_a]:underline [&_a]:hover:text-blue-300':
                            message.role === 'user',
                          'bg-transparent -ml-4 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300':
                            message.role === 'assistant',
                        })}
                      >
                        <Response>{sanitizeText(part.text)}</Response>
                      </MessageContent>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div
                      key={key}
                      className="flex flex-row gap-3 items-start w-full"
                    >
                      <div className="size-8" />
                      <div className="flex-1 min-w-0">
                        <MessageEditor
                          key={message.id}
                          message={message}
                          setMode={setMode}
                          setMessages={setMessages}
                          regenerate={regenerate}
                        />
                      </div>
                    </div>
                  );
                }
              }

              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type="tool-getWeather" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={part.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={<Weather weatherAtLocation={part.output} />}
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }

              if (type === 'tool-createDocument') {
                const { toolCallId } = part;

                if (part.output && 'error' in part.output) {
                  return (
                    <div
                      key={toolCallId}
                      className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200 dark:bg-red-950/50"
                    >
                      Error creating document: {String(part.output.error)}
                    </div>
                  );
                }

                return (
                  <DocumentPreview
                    key={toolCallId}
                    isReadonly={isReadonly}
                    result={part.output}
                  />
                );
              }

              if (type === 'tool-updateDocument') {
                const { toolCallId } = part;

                if (part.output && 'error' in part.output) {
                  return (
                    <div
                      key={toolCallId}
                      className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200 dark:bg-red-950/50"
                    >
                      Error updating document: {String(part.output.error)}
                    </div>
                  );
                }

                return (
                  <div key={toolCallId} className="relative">
                    <DocumentPreview
                      isReadonly={isReadonly}
                      result={part.output}
                      args={{ ...part.output, isUpdate: true }}
                    />
                  </div>
                );
              }

              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type="tool-requestSuggestions" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={part.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={
                            'error' in part.output ? (
                              <div className="p-2 text-red-500 rounded border">
                                Error: {String(part.output.error)}
                              </div>
                            ) : (
                              <DocumentToolResult
                                type="request-suggestions"
                                result={part.output}
                                isReadonly={isReadonly}
                              />
                            )
                          }
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }

              if (type === 'tool-browseWeb') {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type="tool-browseWeb" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={part.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={
                            'error' in part.output ? (
                              <div className="p-2 text-red-500 rounded border">
                                Error: {String(part.output.error)}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Research Summary */}
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-start gap-3">
                                    <div className="shrink-0 size-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                      <svg
                                        className="size-4 text-blue-600 dark:text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        {part.output.title ||
                                          'Web Research Results'}
                                      </h4>
                                      {part.output.description && (
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                                          {part.output.description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-2 text-xs text-blue-600 dark:text-blue-400">
                                        <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                                          {(part.output as any).mode ||
                                            (part.output as any).researchType ||
                                            'research'}
                                        </span>
                                        {part.output.metadata?.sourcesCount && (
                                          <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                                            {part.output.metadata.sourcesCount}{' '}
                                            sources
                                          </span>
                                        )}
                                        {part.output.metadata?.totalPages && (
                                          <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                                            {part.output.metadata.totalPages}{' '}
                                            pages
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Research Activities */}
                                {part.output.activities &&
                                  part.output.activities.length > 0 && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                        <svg
                                          className="size-4 text-gray-600 dark:text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                          />
                                        </svg>
                                        Research Progress
                                      </h5>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {part.output.activities.map(
                                          (
                                            activity: string,
                                            activityIndex: number,
                                          ) => (
                                            <div
                                              key={`activity-${part.output.url}-${activityIndex}-${activity.slice(0, 20)}`}
                                              className="text-xs text-gray-600 dark:text-gray-400 font-mono"
                                            >
                                              {activity}
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Content Preview */}
                                {part.output.content && (
                                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                      <svg
                                        className="size-4 text-gray-600 dark:text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      Content Analysis
                                    </h5>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto">
                                      {(() => {
                                        const output = part.output as any;
                                        if (
                                          typeof output.content === 'string'
                                        ) {
                                          return `${output.content.substring(0, 500)}${output.content.length > 500 ? '...' : ''}`;
                                        }
                                        if (Array.isArray(output.content)) {
                                          return `Found ${output.content.length} pages of content`;
                                        }
                                        if (Array.isArray(output.data)) {
                                          return `Found ${output.data.length} pages of content`;
                                        }
                                        const content =
                                          output.content || output.data || {};
                                        return `${JSON.stringify(content, null, 2).substring(0, 500)}...`;
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {/* Sources */}
                                {part.output.sources &&
                                  part.output.sources.length > 0 && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                        <svg
                                          className="size-4 text-gray-600 dark:text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                          />
                                        </svg>
                                        Sources ({part.output.sources.length})
                                      </h5>
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {part.output.sources
                                          .slice(0, 5)
                                          .map(
                                            (
                                              source: any,
                                              sourceIndex: number,
                                            ) => (
                                              <div
                                                key={`source-${part.output.url}-${sourceIndex}-${source.url}`}
                                                className="text-xs text-gray-600 dark:text-gray-400"
                                              >
                                                <div className="font-medium truncate">
                                                  {source.title || source.url}
                                                </div>
                                                <div className="text-gray-500 dark:text-gray-500 truncate">
                                                  {source.url}
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        {part.output.sources.length > 5 && (
                                          <div className="text-xs text-gray-500 dark:text-gray-500">
                                            ... and{' '}
                                            {part.output.sources.length - 5}{' '}
                                            more sources
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* URL Reference */}
                                <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  <strong>URL:</strong> {part.output.url}
                                </div>
                              </div>
                            )
                          }
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }

              if (type === 'tool-generateComponent') {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type="tool-generateComponent" state={state} />
                    <ToolContent>
                      {state === 'input-available' && (
                        <ToolInput input={part.input} />
                      )}
                      {state === 'output-available' && (
                        <ToolOutput
                          output={
                            'error' in part.output ? (
                              <div className="p-2 text-red-500 rounded border">
                                Error: {String(part.output.error)}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Component Summary */}
                                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex items-start gap-3">
                                    <div className="shrink-0 size-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                                      <svg
                                        className="size-4 text-green-600 dark:text-green-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                        Generated Component:{' '}
                                        {part.output.componentName}
                                      </h4>
                                      <div className="flex flex-wrap gap-2 text-xs text-green-600 dark:text-green-400">
                                        <span className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                                          {part.output.uiLibrary || 'tailwind'}
                                        </span>
                                        <span className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                                          {part.output.props?.length || 0} props
                                        </span>
                                        {part.output.generatedAt && (
                                          <span className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                                            {new Date(
                                              part.output.generatedAt,
                                            ).toLocaleTimeString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Component Code */}
                                {part.output.code && (
                                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                      <svg
                                        className="size-4 text-gray-600 dark:text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                        />
                                      </svg>
                                      Component Code
                                    </h5>
                                    <CodeBlock
                                      code={part.output.code}
                                      language="tsx"
                                    />
                                  </div>
                                )}

                                {/* Props Information */}
                                {part.output.props &&
                                  part.output.props.length > 0 && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                        <svg
                                          className="size-4 text-gray-600 dark:text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                          />
                                        </svg>
                                        Component Props
                                      </h5>
                                      <div className="space-y-2">
                                        {part.output.props.map(
                                          (prop: any, propIndex: number) => (
                                            <div
                                              key={`prop-${part.output.componentName}-${propIndex}-${prop.name}`}
                                              className="text-sm text-gray-700 dark:text-gray-300"
                                            >
                                              <span className="font-mono text-blue-600 dark:text-blue-400">
                                                {prop.name}
                                              </span>
                                              <span className="text-gray-500 dark:text-gray-500">
                                                : {prop.type}
                                              </span>
                                              {prop.required && (
                                                <span className="text-red-500 dark:text-red-400 ml-1">
                                                  *
                                                </span>
                                              )}
                                              <div className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                                                {prop.description}
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Usage Examples */}
                                {part.output.usageExamples && (
                                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                      <svg
                                        className="size-4 text-gray-600 dark:text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      Usage Examples
                                    </h5>
                                    <CodeBlock
                                      code={part.output.usageExamples}
                                      language="tsx"
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          }
                          errorText={undefined}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div className="flex items-start gap-3 justify-start -ml-3">
        <div className="flex justify-center items-center mt-1 rounded-full ring-1 size-8 shrink-0 ring-border bg-background">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <MessageContent className="bg-transparent -ml-4">
            <div className="text-muted-foreground">Hmm...</div>
          </MessageContent>
        </div>
      </div>
    </motion.div>
  );
};
