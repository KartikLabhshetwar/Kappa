import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createXai } from '@ai-sdk/xai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

// Create provider instances with API keys
const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Log provider configuration status
console.log('🔧 AI Provider Configuration:', {
  hasXaiKey: !!process.env.XAI_API_KEY,
  hasGoogleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  isTestEnvironment,
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        // xAI Grok Models (only if API key is available)
        ...(process.env.XAI_API_KEY && {
          'chat-model': xai('grok-2-vision-1212'),
          'chat-model-reasoning': wrapLanguageModel({
            model: xai('grok-3-mini-beta'),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
          }),
        }),

        // Google Gemini Models (only if API key is available)
        ...(process.env.GOOGLE_GENERATIVE_AI_API_KEY && {
          'gemini-chat': google('gemini-2.5-flash'),
          'gemini-reasoning': wrapLanguageModel({
            model: google('gemini-2.5-pro'),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
          }),
          'gemini-title': google('gemini-2.5-flash'),
          'gemini-artifact': google('gemini-2.5-pro'),
          'gemini-fast': google('gemini-2.5-flash'),
          'gemini-pro': google('gemini-2.5-pro'),
          'gemini-vision': google('gemini-2.5-flash'),
        }),

        // Core models - always available using the best available provider
        'title-model': process.env.XAI_API_KEY
          ? xai('grok-2-1212')
          : process.env.GOOGLE_GENERATIVE_AI_API_KEY
            ? google('gemini-2.5-flash')
            : (() => {
                throw new Error('No AI provider available');
              })(),

        'artifact-model': process.env.XAI_API_KEY
          ? xai('grok-2-1212')
          : process.env.GOOGLE_GENERATIVE_AI_API_KEY
            ? google('gemini-2.5-pro')
            : (() => {
                throw new Error('No AI provider available');
              })(),
      },
    });
