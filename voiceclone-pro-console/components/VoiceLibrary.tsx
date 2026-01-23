
import React, { useState } from 'react';
import { Voice, VoiceType } from '../types';

interface VoiceLibraryProps {
  voices: Voice[];
  selectedVoiceId: string;
  onSelectVoice: (id: string) => void;
  onManageVoices: () => void;
}

const VoiceLibrary: React.FC<VoiceLibraryProps> = ({ voices, selectedVoiceId, onSelectVoice, onManageVoices }) => {
  const [activeTab, setActiveTab] = useState<VoiceType>('user');

  const filteredVoices = voices.filter(v => v.type === activeTab);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#e8cedb] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#fce7f3] bg-white">
        <h3 className="text-sm font-bold text-[#1c0d14] flex items-center gap-2 mb-4 px-1">
          <span className="material-symbols-outlined text-primary text-xl">settings_voice</span>
          我的声音库
        </h3>
        <div className="flex p-1 bg-gray-50/50 border border-[#e8cedb] rounded-xl">
          <button 
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'user' ? 'bg-primary text-white shadow-lg shadow-pink-100' : 'text-gray-400 hover:text-primary'}`}
          >
            我的创作
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'system' ? 'bg-primary text-white shadow-lg shadow-pink-100' : 'text-gray-400 hover:text-primary'}`}
          >
            系统预设
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {filteredVoices.map(voice => (
          <div 
            key={voice.id}
            onClick={() => voice.status === 'ready' && onSelectVoice(voice.id)}
            className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedVoiceId === voice.id 
                ? 'border-primary bg-white shadow-[0_8px_30px_rgb(245,61,153,0.12)]' 
                : 'border-transparent bg-gray-50/30 hover:border-primary/20 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`size-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all overflow-visible ${
                selectedVoiceId === voice.id && voice.status === 'ready' ? 'bg-primary text-white shadow-lg shadow-pink-200' : 'bg-pink-100/50 text-primary'
              }`}>
                {voice.status === 'training' ? (
                  <div className="relative flex items-center justify-center size-11">
                    <svg className="size-full absolute -rotate-90 overflow-visible p-1">
                      {/* Track */}
                      <circle 
                        cx="18" cy="18" r="16" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        fill="transparent" 
                        className="text-pink-100 opacity-40" 
                      />
                      {/* Progress */}
                      <circle 
                        cx="18" cy="18" r="16" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        fill="transparent" 
                        strokeDasharray={100.5} 
                        strokeDashoffset={100.5 - (100.5 * (voice.progress || 0) / 100)} 
                        strokeLinecap="round"
                        className="text-primary transition-all duration-1000 drop-shadow-[0_0_2px_rgba(245,61,153,0.3)]" 
                      />
                    </svg>
                    <span className="material-symbols-outlined text-[16px] text-primary animate-[spin_4s_linear_infinite] relative z-10">sync</span>
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-[24px]">account_circle</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-black truncate text-[#1c0d14]">{voice.name}</p>
                  {voice.status === 'ready' && voice.id === selectedVoiceId && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-black leading-none flex items-center shadow-sm animate-[fadeIn_0.2s]">
                      已选择
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400">
                    {voice.status === 'training' ? (
                      <span className="text-primary font-black">正在克隆 {voice.progress}%</span>
                    ) : (
                      `${voice.createdDate} 创建`
                    )}
                  </p>
                  {selectedVoiceId === voice.id && voice.status === 'ready' && (
                    <span className="material-symbols-outlined text-primary text-lg animate-[fadeIn_0.3s]">check_circle</span>
                  )}
                </div>
              </div>
            </div>
            
            {voice.status === 'training' && (
              <div className="mt-3 w-full bg-gray-100 h-1 rounded-full overflow-hidden relative">
                <div 
                  className="bg-primary h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(245,61,153,0.4)]" 
                  style={{ width: `${voice.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredVoices.length === 0 && (
          <div className="py-16 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-gray-100 text-6xl">cloud_off</span>
            <p className="text-xs font-black text-gray-300 italic">暂无可用声音</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-[#fce7f3] bg-white">
        <button 
          onClick={onManageVoices}
          className="w-full flex items-center justify-center gap-2 h-12 bg-white border-2 border-gray-100 rounded-xl text-sm font-black text-gray-500 hover:border-primary/20 hover:text-primary hover:shadow-xl transition-all group"
        >
          <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">mic</span>
          管理我的音色
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default VoiceLibrary;
