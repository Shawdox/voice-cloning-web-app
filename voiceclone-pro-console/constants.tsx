
import { Voice, GenerationRecord } from './types';

// @deprecated - Use voiceAPI.getPredefined() instead. This constant is no longer used.
// Kept for backward compatibility only.
export const INITIAL_VOICES: Voice[] = [];

export const INITIAL_HISTORY: GenerationRecord[] = [
  {
    id: 'h1',
    voiceName: '温暖女声',
    text: '“今天的天气真不错，适合出去散散步，感受一下大自然的美好...”',
    date: '2023-11-22 14:30',
    duration: '03:45',
    currentTime: '01:12',
    progress: 35
  },
  {
    id: 'h2',
    voiceName: '深沉男低音',
    text: '“深度学习在语音合成领域的应用已经非常成熟，目前的克隆技术已经能够实现...”',
    date: '2023-11-21 10:15',
    duration: '00:58',
    currentTime: '00:00',
    progress: 0
  }
];
