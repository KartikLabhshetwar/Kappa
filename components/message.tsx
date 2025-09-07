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

              if (
                type === 'tool-search' ||
                type === 'tool-searchContext' ||
                type === 'tool-searchQNA' ||
                type === 'tool-extract' ||
                type === 'tool-browseWeb'
              ) {
                const { toolCallId, state } = part;

                return (
                  <Tool key={toolCallId} defaultOpen={true}>
                    <ToolHeader type={type} state={state} />
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
                                {/* Search Summary */}
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
                                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                        {type === 'tool-search' &&
                                          'Web Search Results'}
                                        {type === 'tool-searchContext' &&
                                          'Context Search Results'}
                                        {type === 'tool-searchQNA' &&
                                          'Q&A Search Results'}
                                        {type === 'tool-extract' &&
                                          'Content Extraction Results'}
                                        {type === 'tool-browseWeb' &&
                                          'Web Crawling Results'}
                                      </h4>
                                      {(part.output.query ||
                                        part.output.url) && (
                                        <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                                          {part.output.query
                                            ? `Query: ${part.output.query}`
                                            : `URL: ${part.output.url}`}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-2 text-xs text-green-600 dark:text-green-400">
                                        <span className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                                          {type.replace('tool-', '')}
                                        </span>
                                        {(part.output.results ||
                                          part.output.content) && (
                                          <span className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                                            {part.output.results
                                              ? `${part.output.results.length} results`
                                              : 'Content extracted'}
                                          </span>
                                        )}
                                        {part.output.responseTime && (
                                          <span className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                                            {part.output.responseTime}ms
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* AI Answer */}
                                {part.output.answer && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
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
                                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      AI Answer
                                    </h5>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                      {part.output.answer}
                                    </p>
                                  </div>
                                )}

                                {/* BrowseWeb Content */}
                                {type === 'tool-browseWeb' &&
                                  part.output.content && (
                                    <div className="space-y-3">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
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
                                        Crawled Content
                                      </h5>
                                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                          <div
                                            dangerouslySetInnerHTML={{
                                              __html: part.output.content,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                {/* Search Results */}
                                {part.output.results &&
                                  part.output.results.length > 0 && (
                                    <div className="space-y-3">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
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
                                        Search Results
                                      </h5>
                                      <div className="space-y-2">
                                        {part.output.results.map(
                                          (result: any, index: number) => (
                                            <div
                                              key={`${result.url}-${index}`}
                                              className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border"
                                            >
                                              <div className="flex items-start gap-3">
                                                <div className="shrink-0 size-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                                                  {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <h6 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                                    <a
                                                      href={result.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    >
                                                      {result.title}
                                                    </a>
                                                  </h6>
                                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {result.url}
                                                  </p>
                                                  {result.content && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                                      {result.content}
                                                    </p>
                                                  )}
                                                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                    {result.score && (
                                                      <span>
                                                        Score:{' '}
                                                        {result.score.toFixed(
                                                          2,
                                                        )}
                                                      </span>
                                                    )}
                                                    {result.publishedDate && (
                                                      <span>
                                                        •{' '}
                                                        {new Date(
                                                          result.publishedDate,
                                                        ).toLocaleDateString()}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Images */}
                                {part.output.images &&
                                  part.output.images.length > 0 && (
                                    <div className="space-y-3">
                                      <h5 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
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
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                        Related Images
                                      </h5>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {part.output.images.map(
                                          (image: any, index: number) => (
                                            <div
                                              key={`${image.url}-${index}`}
                                              className="relative group"
                                            >
                                              <img
                                                src={image.url}
                                                alt={
                                                  image.description ||
                                                  `Image ${index + 1}`
                                                }
                                                className="w-full h-24 object-cover rounded-lg border"
                                              />
                                              {image.description && (
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                  <p className="text-white text-xs text-center p-2">
                                                    {image.description}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          ),
                                        )}
                                      </div>
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
