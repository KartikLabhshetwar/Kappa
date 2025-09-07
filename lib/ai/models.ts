export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: 'xai' | 'google';
}

export const chatModels: Array<ChatModel> = [
  // xAI Grok Models
  {
    id: 'chat-model',
    name: 'Grok Vision',
    description: 'Advanced multimodal model with vision and text capabilities',
    provider: 'xai',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Grok Reasoning',
    description:
      'Uses advanced chain-of-thought reasoning for complex problems',
    provider: 'xai',
  },

  // Google Gemini Models
  {
    id: 'gemini-chat',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient Google Gemini model for general tasks',
    provider: 'google',
  },
  {
    id: 'gemini-reasoning',
    name: 'Gemini 2.5 Pro',
    description:
      'Advanced Google Gemini model with enhanced reasoning capabilities',
    provider: 'google',
  },
  {
    id: 'gemini-fast',
    name: 'Gemini Fast',
    description: 'Ultra-fast Gemini model for quick responses',
    provider: 'google',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Most capable Gemini model for complex tasks',
    provider: 'google',
  },
  {
    id: 'gemini-vision',
    name: 'Gemini Vision',
    description: 'Multimodal Gemini model with vision capabilities',
    provider: 'google',
  },
];
