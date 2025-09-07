import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: [
      // xAI Grok Models (if API key available)
      'chat-model',
      'chat-model-reasoning',
      'title-model',
      'artifact-model',
      // Google Gemini Models (if API key available)
      'gemini-chat',
      'gemini-reasoning',
      'gemini-title',
      'gemini-artifact',
      'gemini-fast',
      'gemini-pro',
      'gemini-vision',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      // xAI Grok Models (if API key available)
      'chat-model',
      'chat-model-reasoning',
      'title-model',
      'artifact-model',
      // Google Gemini Models (if API key available)
      'gemini-chat',
      'gemini-reasoning',
      'gemini-title',
      'gemini-artifact',
      'gemini-fast',
      'gemini-pro',
      'gemini-vision',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
