
import React, { useState, useEffect } from 'react';
import { GenerationRecord } from '../types';

interface HistoryListProps {
  history: GenerationRecord[];
  isLoggedIn: boolean;
  onClear: () => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, isLoggedIn, onClear, onDelete }) => {
  // 存储每个音频的实际时长（秒）
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});

  // 动态加载音频元数据获取时长
  useEffect(() => {
    const loadAudioDurations = async () => {
      const newDurations: Record<string, number> = {};

      for (const record of history) {
        // 只处理有 audioUrl 且尚未加载时长的记录
        if (record.audioUrl && !audioDurations[record.id]) {
          try {
            const audio = new Audio();

            // 创建 Promise 来等待音频元数据加载
            const duration = await new Promise<number>((resolve, reject) => {
              audio.addEventListener('loadedmetadata', () => {
                resolve(audio.duration);
              });

              audio.addEventListener('error', () => {
                reject(new Error('Failed to load audio'));
              });

              // 设置超时避免永久等待
              setTimeout(() => reject(new Error('Timeout')), 5000);

              audio.src = record.audioUrl!;
            });

            newDurations[record.id] = duration;
          } catch (error) {
            console.warn(`Failed to load duration for audio ${record.id}:`, error);
          }
        }
      }

      // 只有当有新的时长数据时才更新状态
      if (Object.keys(newDurations).length > 0) {
        setAudioDurations(prev => ({ ...prev, ...newDurations }));
      }
    };

    loadAudioDurations();
  }, [history, audioDurations]);

  // 格式化时长显示（秒 -> MM:SS）
  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlay = (audioUrl?: string) => {
    if (!audioUrl) {
      alert('音频文件尚未生成或不可用');
      return;
    }
    // 创建音频元素并播放
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('播放失败:', err);
      alert('播放失败，请稍后重试');
    });
  };

  const handleDownload = (audioUrl?: string, voiceName?: string, format?: string) => {
    if (!audioUrl) {
      alert('音频文件尚未生成或不可用');
      return;
    }
    
    // 根据格式确定文件扩展名，默认为mp3
    let fileExt = 'mp3';
    if (format) {
      // format可能是 'mp3', 'wav', 'pcm', 'opus'
      if (format === 'pcm') {
        fileExt = 'wav'; // PCM通常以WAV容器封装
      } else {
        fileExt = format;
      }
    }
    
    // 创建临时下载链接
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${voiceName || 'audio'}_${Date.now()}.${fileExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          <h3 className="text-[#1c0d14] text-xl font-bold font-display">生成历史</h3>
        </div>
        {isLoggedIn && history.length > 0 && (
          <button 
            onClick={onClear}
            className="text-xs text-[#9c4973] hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            清空记录
          </button>
        )}
      </div>
      
      <div className="history-scroll overflow-y-auto max-h-[400px] flex flex-col gap-3 pr-1">
        {history.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-4">
            <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 shadow-inner">
               <span className="material-symbols-outlined text-4xl">audio_file</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-400">暂无生成记录</h4>
              {!isLoggedIn && (
                <p className="text-[11px] text-gray-300 font-bold mt-1">登录后即可永久保存并同步您的合成记录</p>
              )}
            </div>
          </div>
        ) : (
          history.map(record => (
            <div 
              key={record.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-background-light/50 border border-transparent hover:border-primary/20 hover:bg-white transition-all group"
            >
              <button
                onClick={() => handlePlay(record.audioUrl)}
                className="size-10 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                title="播放"
              >
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
              
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`text-xs font-bold text-white px-1.5 py-0.5 rounded leading-none flex-shrink-0 ${
                      record.voiceName.includes('男') ? 'bg-primary/40' : 'bg-primary/60'
                    }`}>
                      {record.voiceName}
                    </span>
                    <p className="text-sm font-medium text-[#1c0d14] truncate">
                      {record.text}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#9c4973]/60 whitespace-nowrap">
                    {record.date}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-1.5 bg-[#e8cedb] rounded-full relative group/progress overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-primary/60 rounded-full group-hover/progress:bg-primary transition-colors"
                      style={{ width: `${record.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-display text-gray-400">
                    {record.currentTime} / {audioDurations[record.id] ? formatDuration(audioDurations[record.id]) : record.duration}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(record.audioUrl, record.voiceName, record.format)}
                  className="size-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 active:scale-95 transition-all"
                  title="下载"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
                <button 
                  onClick={() => onDelete(record.id)}
                  className="size-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all" 
                  title="删除"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
        
        {history.length > 0 && !isLoggedIn && (
           <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/10 text-center">
              <p className="text-[10px] font-black text-primary">您当前处于体验模式，刷新页面后记录将清空</p>
           </div>
        )}
      </div>
    </>
  );
};

export default HistoryList;
