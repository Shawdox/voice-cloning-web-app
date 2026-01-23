
import React, { useState } from 'react';
import { Voice } from '../types';

interface VoiceCloningSectionProps {
  voices: Voice[];
  isLoggedIn: boolean;
  onLoginRequest?: () => void;
}

const VoiceCloningSection: React.FC<VoiceCloningSectionProps> = ({ voices, isLoggedIn, onLoginRequest }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Filter voices that are currently in the 'training' status
  const trainingVoices = voices.filter(v => v.status === 'training');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isLoggedIn) {
      if (onLoginRequest) onLoginRequest();
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn) {
      if (onLoginRequest) onLoginRequest();
      return;
    }
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    console.log(`Received file: ${file.name}, size: ${file.size} bytes`);
    alert(`文件 "${file.name}" 已接收！准备开始声音克隆。`);
  };

  return (
    <div className="flex flex-col gap-5 bg-white p-6 rounded-2xl border border-[#e8cedb] shadow-sm h-full relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-primary text-white size-8 rounded-full text-sm font-black shadow-lg shadow-pink-100 italic">1</span>
          <h3 className="text-[#1c0d14] text-xl font-black font-display tracking-tight">声音克隆</h3>
        </div>
        {trainingVoices.length > 0 && (
          <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-full animate-pulse">
            {trainingVoices.length} 个任务进行中
          </span>
        )}
      </div>
      
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-none flex flex-col items-center justify-center gap-6 rounded-3xl border-2 transition-all duration-300 ease-out group cursor-pointer relative overflow-hidden min-h-[220px] ${
          isDragging 
            ? 'border-primary bg-pink-100/40 ring-4 ring-primary/10 scale-[1.01] border-solid shadow-inner' 
            : 'border-dashed border-pink-200 bg-white hover:border-primary/40 hover:bg-gray-50/30'
        }`}
      >
        <input 
          type="file" 
          onChange={handleFileInput}
          disabled={!isLoggedIn}
          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          accept=".mp3,.wav" 
        />
        
        {!isLoggedIn && (
          <div 
            onClick={() => onLoginRequest?.()}
            className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-white/70 transition-colors"
          >
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <p className="text-xs font-black text-[#1c0d14] mb-1">高级功能限制</p>
            <p className="text-[10px] font-bold text-gray-400 mb-4">请登录后开启您的专属声音克隆任务</p>
            <button className="px-6 py-2 bg-primary text-white text-[11px] font-black rounded-full shadow-lg shadow-pink-100 hover:scale-105 active:scale-95 transition-all">
              点击登录
            </button>
          </div>
        )}

        {/* Dynamic Border Animation for dragging */}
        {isDragging && (
          <div className="absolute inset-0 border-2 border-primary rounded-3xl animate-[pulse_1.5s_infinite] opacity-50 pointer-events-none"></div>
        )}

        <div className={`size-16 rounded-full flex items-center justify-center text-primary transition-all duration-500 shadow-inner ${
          isDragging ? 'scale-125 bg-primary text-white shadow-xl shadow-pink-200' : 'bg-pink-50 group-hover:scale-110'
        }`}>
          <span className={`material-symbols-outlined text-4xl transition-all duration-300 ${isDragging ? 'translate-y-0.5' : ''}`}>
            {isDragging ? 'download' : 'cloud_upload'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className={`text-[#1c0d14] text-sm font-black transition-all duration-300 ${isDragging ? 'text-primary scale-110' : ''}`}>
            {isDragging ? '松开以上传音频' : '上传参考音频文件'}
          </p>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">限 MP3, WAV 格式</p>
        </div>
      </div>

      {/* Training Tasks Section */}
      {trainingVoices.length > 0 && (
        <div className="flex-1 mt-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-primary text-lg">cyclone</span>
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest">正在克隆的任务</h4>
          </div>
          
          <div className="space-y-3">
            {trainingVoices.map(voice => (
              <div key={voice.id} className="p-4 rounded-2xl bg-[#fcf8fa] border border-[#fce7f3] shadow-sm animate-[fadeIn_0.3s]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#1c0d14]">{voice.name}</p>
                      <p className="text-[10px] font-bold text-gray-400">正在进行神经网络声纹优化...</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-primary bg-white px-2 py-0.5 rounded-lg border border-pink-50 shadow-sm">
                    {voice.progress}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner border border-pink-50">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-[#ff7eb3] transition-all duration-1000 ease-out rounded-full relative"
                      style={{ width: `${voice.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1">
                    <span>训练开始</span>
                    <span>约需 5 分钟</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.02); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default VoiceCloningSection;
