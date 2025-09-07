import { z } from 'zod';
import type { getWeather } from './ai/tools/get-weather';
import type { createDocument } from './ai/tools/create-document';
import type { updateDocument } from './ai/tools/update-document';
import type { requestSuggestions } from './ai/tools/request-suggestions';
import type { tavilyTools } from './tools/tavily';
import type { generateComponent } from './ai/tools/generate-component';
import type { browseWeb } from './ai/tools/browse-web';
import type { InferUITool, UIMessage } from 'ai';

import type { ArtifactKind } from '@/components/artifact';
import type { Suggestion } from './db/schema';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type browseWebTool = InferUITool<typeof browseWeb>;
type tavilyToolsType = ReturnType<typeof tavilyTools>;
type searchTool = InferUITool<NonNullable<tavilyToolsType['search']>>;
type searchContextTool = InferUITool<
  NonNullable<tavilyToolsType['searchContext']>
>;
type searchQNATool = InferUITool<NonNullable<tavilyToolsType['searchQNA']>>;
type extractTool = InferUITool<NonNullable<tavilyToolsType['extract']>>;
type generateComponentTool = InferUITool<typeof generateComponent>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  browseWeb: browseWebTool;
  search: searchTool;
  searchContext: searchContextTool;
  searchQNA: searchQNATool;
  extract: extractTool;
  generateComponent: generateComponentTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
