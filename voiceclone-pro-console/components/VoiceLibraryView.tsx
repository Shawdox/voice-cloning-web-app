
import React, { useState } from 'react';
import { INITIAL_VOICES } from '../constants';
import { Voice, VoiceType } from '../types';

interface VoiceLibraryViewProps {
  onBack: () => void;
}

const VoiceLibraryView: React.FC<VoiceLibraryViewProps> = ({ onBack }) => {
  const [voices, setVoices] = useState<Voice[]>(INITIAL_VOICES);
  const [filter, setFilter] = useState<VoiceType | 'all'>('all');

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个声音吗？删除后无法恢复。')) {
      setVoices(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleTogglePin = (id: string) => {
    setVoices(prev => prev.map(v => 
      v.id === id ? { ...v, isPinned: !v.isPinned } : v
    ));
  };

  const filteredVoices = voices
    .filter(v => filter === 'all' || v.type === filter)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-mesh">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-primary font-bold text-sm mb-4 hover:translate-x-1 transition-transform"
            >
              <span className="material-symbols-outlined text-lg rotate-180">arrow_forward</span>
              返回工作台
            </button>
            <h1 className="text-4xl font-black font-display tracking-tight text-[#1c0d14]">我的声音库</h1>
            <p className="text-gray-500 mt-2 font-medium">管理、编辑和克隆您的个性化数字声纹</p>
          </div>
          <button className="h-14 px-8 bg-gradient-to-r from-pink-500 to-primary text-white font-black rounded-2xl shadow-xl shadow-pink-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
            <span className="material-symbols-outlined">add_circle</span>
            克隆新声音
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-white/40 p-3 rounded-full border border-white shadow-sm backdrop-blur-md w-fit mx-auto md:mx-0">
          <FilterButton 
            active={filter === 'all'} 
            label="全部音色" 
            onClick={() => setFilter('all')} 
            count={voices.length} 
          />
          <FilterButton 
            active={filter === 'user'} 
            label="我的创作" 
            onClick={() => setFilter('user')} 
            count={voices.filter(v => v.type === 'user').length} 
          />
          <FilterButton 
            active={filter === 'system'} 
            label="系统预设" 
            onClick={() => setFilter('system')} 
            count={voices.filter(v => v.type === 'system').length} 
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredVoices.map(voice => (
            <div 
              key={voice.id}
              className={`group bg-white rounded-3xl border ${voice.isPinned ? 'border-primary/40 ring-1 ring-primary/10' : 'border-[#e8cedb]'} p-6 shadow-sm hover:shadow-2xl hover:shadow-pink-100 hover:-translate-y-2 transition-all duration-300 flex flex-col relative overflow-hidden`}
            >
              {voice.isPinned && (
                <div className="absolute top-0 right-0">
                   <div className="bg-primary text-white text-[10px] font-black px-4 py-1 rotate-45 translate-x-3 -translate-y-1 shadow-sm">置顶</div>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className={`size-14 rounded-full flex items-center justify-center shadow-lg relative ${
                  voice.type === 'user' ? 'bg-primary text-white shadow-pink-100' : 'bg-gray-100 text-gray-500 shadow-gray-100'
                }`}>
                  <span className="material-symbols-outlined text-3xl">
                    {voice.status === 'training' ? 'progress_activity' : 'account_circle'}
                  </span>
                  {voice.status === 'training' && (
                    <div className="absolute inset-0 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  )}
                </div>
                <div className="flex gap-1">
                   {voice.type === 'user' && (
                    <button 
                      onClick={() => handleDelete(voice.id)}
                      className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="删除"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                   )}
                   <button 
                    onClick={() => handleTogglePin(voice.id)}
                    className={`size-9 rounded-xl flex items-center justify-center transition-all ${voice.isPinned ? 'text-primary bg-pink-50' : 'text-gray-400 hover:text-primary hover:bg-pink-50'}`}
                    title={voice.isPinned ? "取消置顶" : "置顶声音"}
                   >
                    <span className="material-symbols-outlined text-[20px]">{voice.isPinned ? 'keep_off' : 'keep'}</span>
                  </button>
                   <button className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-pink-50 transition-all">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-black text-[#1c0d14] mb-1">{voice.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    voice.type === 'user' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {voice.type === 'user' ? '我的创作' : '系统预设'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">{voice.createdDate}</span>
                </div>

                {voice.status === 'training' ? (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-[11px] font-black text-primary mb-1">
                      <span>正在训练中...</span>
                      <span>{voice.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-pink-50 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${voice.progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">情感饱满</span>
                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">多语种支持</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-primary cursor-pointer hover:underline group/play">
                  <span className="material-symbols-outlined text-xl group-hover/play:scale-110 transition-transform">play_circle</span>
                  <span className="text-xs font-black">试听样品</span>
                </div>
                <button 
                  disabled={voice.status === 'training'}
                  className="px-6 py-2 bg-gray-50 hover:bg-primary hover:text-white transition-all rounded-xl text-xs font-black text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  应用音色
                </button>
              </div>
            </div>
          ))}

          {filteredVoices.length === 0 && (
            <div className="col-span-full py-32 text-center flex flex-col items-center gap-4">
              <div className="size-24 rounded-full bg-white flex items-center justify-center text-gray-200 shadow-inner">
                <span className="material-symbols-outlined text-6xl">voice_over_off</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-400">未找到匹配的音色</h3>
                <p className="text-sm text-gray-300 font-bold mt-1">您可以尝试更改筛选条件或克隆一个新声音</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterButton: React.FC<{ active: boolean; label: string; onClick: () => void; count: number }> = ({ active, label, onClick, count }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-3 ${
      active ? 'bg-primary text-white shadow-xl shadow-pink-200 scale-105' : 'text-gray-500 hover:bg-white hover:text-primary hover:shadow-md'
    }`}
  >
    {label}
    <span className={`text-[11px] px-2 py-0.5 rounded-lg ${active ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-400'}`}>
      {count}
    </span>
  </button>
);

export default VoiceLibraryView;
