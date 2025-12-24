
export enum AppMode {
  IMAGE_GEN = 'IMAGE_GEN',
  IMAGE_EDIT = 'IMAGE_EDIT',
  VIDEO_GEN = 'VIDEO_GEN',
  THINKING_CHAT = 'THINKING_CHAT',
  GENERAL_CHAT = 'GENERAL_CHAT',
  SYSTEM_INFO = 'SYSTEM_INFO'
}

export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}
