
export enum AppView {
  HOME = 'home',
  WORKSPACE = 'workspace',
  HISTORY = 'history',
  VOICE_LIBRARY = 'voice_library',
  ACCOUNT = 'account',
  VIP = 'vip'
}

export type VoiceType = 'user' | 'predefined';

export interface Voice {
  id: string;
  name: string;
  type: VoiceType;
  status: 'ready' | 'training';
  progress?: number;
  createdDate: string;
  tag?: string;
  isPinned?: boolean;
}

export interface GenerationRecord {
  id: string;
  voiceName: string;
  text: string;
  date: string;
  duration: string;
  currentTime: string;
  progress: number;
  audioUrl?: string;
  status?: string;
  format?: string; // 音频格式: mp3, wav, pcm, opus
}
