
import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_VOICES, INITIAL_HISTORY } from '../constants';
import { Voice } from '../types';
import { voiceAPI, ttsAPI } from '../services/api';
import { TTSTaskResponse } from '../types/api';
import VoiceLibrary from './VoiceLibrary';
import VoiceCloningSection from './VoiceCloningSection';
import SpeechSynthesisSection from './SpeechSynthesisSection';
import HistoryList from './HistoryList';

const EMOTION_TAG_MAP: Record<string, string> = {
  '开心': 'happy',
  '悲伤': 'sad',
  '愤怒': 'angry',
  '激动': 'excited',
  '平静': 'calm',
  '紧张': 'nervous',
  '自信': 'confident',
  '惊讶': 'surprised',
  '满意': 'satisfied',
  '欣喜': 'delighted',
  '恐惧': 'scared',
};

const normalizeEmotionTags = (inputText: string): string => {
  return inputText.replace(/\(([^()]+)\)/g, (match, rawTag) => {
    const trimmed = rawTag.trim();
    const mapped = EMOTION_TAG_MAP[trimmed];
    return mapped ? `(${mapped})` : match;
  });
};

const removeEmotionTags = (inputText: string): string => {
  return inputText.replace(/\(([^()]+)\)/g, '');
};

interface WorkspaceProps {
  isLoggedIn: boolean;
  onManageVoices: () => void;
  onViewVip: () => void;
  onLoginRequest: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ isLoggedIn, onManageVoices, onViewVip, onLoginRequest }) => {
  const [voices, setVoices] = useState<Voice[]>(INITIAL_VOICES);
  const [history, setHistory] = useState(isLoggedIn ? INITIAL_HISTORY : []);
  const [selectedVoiceId, setSelectedVoiceId] = useState('s1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttsTasks, setTtsTasks] = useState<TTSTaskResponse[]>([]);

  // Fetch user voices from backend
  const fetchVoices = useCallback(async () => {
    if (!isLoggedIn) {
      setVoices(INITIAL_VOICES);
      return;
    }

    try {
      const response = await voiceAPI.getList(1, 100);
      // Convert backend response to frontend Voice type
      const userVoices: Voice[] = response.data.map(v => ({
        id: String(v.id),
        name: v.name,
        type: 'user' as const,
        status: v.status === 'ready' ? 'ready' : 'training',
        progress: v.progress,
        createdDate: new Date(v.createdAt).toLocaleDateString(),
        isPinned: v.isPinned,
      }));
      // Combine user voices with system voices
      setVoices([...userVoices, ...INITIAL_VOICES]);
    } catch (err) {
      console.error('Failed to fetch voices:', err);
      setVoices(INITIAL_VOICES);
    }
  }, [isLoggedIn]);

  // Fetch TTS tasks from backend
  const fetchTTSTasks = useCallback(async () => {
    if (!isLoggedIn) {
      setTtsTasks([]);
      return;
    }

    try {
      const response = await ttsAPI.getList(1, 100);
      setTtsTasks(response.data);
    } catch (err) {
      console.error('Failed to fetch TTS tasks:', err);
    }
  }, [isLoggedIn]);

  // Fetch voices on mount and when login status changes
  useEffect(() => {
    fetchVoices();
    fetchTTSTasks();
  }, [fetchVoices, fetchTTSTasks]);

  // Poll for training voices status
  useEffect(() => {
    const trainingVoices = voices.filter(v => v.status === 'training' && v.type === 'user');
    if (trainingVoices.length === 0) return;

    const interval = setInterval(() => {
      fetchVoices();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [voices, fetchVoices]);

  // Poll for TTS tasks status
  useEffect(() => {
    const activeTasks = ttsTasks.filter(t => t.status === 'pending' || t.status === 'processing');
    if (activeTasks.length === 0) return;

    const interval = setInterval(() => {
      fetchTTSTasks();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [ttsTasks, fetchTTSTasks]);

  // Convert TTS tasks to history records
  const historyRecords = ttsTasks.map(task => {
    const cleanedText = removeEmotionTags(task.text);
    return {
      id: String(task.id),
      voiceName: task.voiceName,
      text: cleanedText.slice(0, 50) + (cleanedText.length > 50 ? '...' : ''),
      date: new Date(task.date).toLocaleString('zh-CN'),
      duration: task.audioDuration ? `${Math.floor(task.audioDuration / 60)}:${String(Math.floor(task.audioDuration % 60)).padStart(2, '0')}` : '--:--',
      currentTime: '00:00',
      progress: task.status === 'completed' ? 100 : (task.status === 'processing' ? 50 : 10),
      audioUrl: task.audioUrl,
      status: task.status,
    };
  });

  const handleStartGeneration = async (text: string, options: any) => {
    if (!text.trim() || !isLoggedIn) {
      if (!isLoggedIn) {
        onLoginRequest();
      }
      return;
    }

    setIsGenerating(true);
    try {
      const selectedVoice = voices.find(v => v.id === selectedVoiceId);
      if (!selectedVoice || selectedVoice.type === 'system') {
        alert('请选择一个已完成的用户音色');
        return;
      }

      const normalizedText = normalizeEmotionTags(text);
      const voiceId = parseInt(selectedVoice.id);
      const response = await ttsAPI.create({
        voiceId,
        text: normalizedText,
        emotion: options.emotion,
        speed: options.speed,
      });

      // Fetch updated TTS tasks list
      await fetchTTSTasks();
      alert('语音合成任务已提交，请稍后查看生成历史');
    } catch (err: any) {
      console.error('Failed to create TTS task:', err);
      alert(err.message || '语音合成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-background-light">
      <div className="max-w-[1440px] mx-auto px-6 h-full">
        <div className="flex flex-col gap-6 h-full">
          
          {/* Header Action Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-[#e8cedb] shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">dashboard</span>
              </div>
              <div>
                <h1 className="text-2xl font-black font-display tracking-tight">智能工作台</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-[#9c4973]">当前选择：{voices.find(v => v.id === selectedVoiceId)?.name || '未选择'}</p>
                  {!isLoggedIn && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-black border border-gray-200">体验模式</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-1 md:flex-none justify-end gap-3">
              <div className="flex items-center gap-3 bg-pink-50/50 px-4 py-2 rounded-2xl border border-pink-100 shadow-sm">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 leading-none uppercase tracking-tighter mb-1">可用积分</span>
                    <span className="text-lg font-black text-primary leading-none">{isLoggedIn ? '850' : '--'}</span>
                 </div>
                 <button 
                  onClick={() => !isLoggedIn ? onLoginRequest() : alert('立即进入充值流程')}
                  className="h-10 px-5 bg-primary text-white text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-100 flex items-center gap-2"
                 >
                    <span className="material-symbols-outlined text-base">bolt</span>
                    立即充值
                 </button>
              </div>
              
              <div className="flex gap-2">
                <button className="h-12 px-4 bg-white border border-[#e8cedb] rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">help_outline</span>
                  使用指南
                </button>
                <div className="relative group">
                  <button 
                    onClick={onViewVip}
                    className="h-12 px-4 bg-gradient-to-r from-[#1c0d14] to-[#442b38] text-white rounded-xl text-xs font-bold shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 overflow-hidden"
                  >
                    <span className="material-symbols-outlined text-lg text-yellow-400">stars</span>
                    VIP 专属特权
                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-3">
              <VoiceLibrary 
                voices={voices} 
                selectedVoiceId={selectedVoiceId} 
                onSelectVoice={setSelectedVoiceId}
                onManageVoices={onManageVoices}
              />
            </div>

            <div className="lg:col-span-9 flex flex-col gap-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <VoiceCloningSection
                  voices={voices}
                  isLoggedIn={isLoggedIn}
                  onLoginRequest={onLoginRequest}
                  onVoiceCreated={fetchVoices}
                />
                <SpeechSynthesisSection 
                  onGenerate={handleStartGeneration}
                  isGenerating={isGenerating}
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#e8cedb] shadow-sm">
                  <HistoryList
                    history={historyRecords}
                    isLoggedIn={isLoggedIn}
                    onClear={async () => {
                      // Clear all TTS tasks
                      for (const task of ttsTasks) {
                        try {
                          await ttsAPI.delete(task.id);
                        } catch (err) {
                          console.error('Failed to delete task:', err);
                        }
                      }
                      fetchTTSTasks();
                    }}
                    onDelete={async (id) => {
                      try {
                        await ttsAPI.delete(parseInt(id));
                        fetchTTSTasks();
                      } catch (err) {
                        console.error('Failed to delete task:', err);
                      }
                    }}
                  />
                </div>
                
                <div className="bg-gradient-to-r from-primary to-[#ff7eb3] p-8 rounded-3xl flex items-center justify-between text-white shadow-2xl shadow-pink-200 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="size-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-5xl">graphic_eq</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-black mb-1">实时预览播放器</h4>
                      <p className="text-sm font-bold opacity-80">就绪并等待音频生成...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <button className="size-12 rounded-full bg-white text-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-3xl">play_arrow</span>
                    </button>
                    <div className="hidden md:flex flex-col gap-1 w-48">
                      <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                        <div className="bg-white h-full w-0"></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold opacity-70">
                        <span>00:00</span>
                        <span>00:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
