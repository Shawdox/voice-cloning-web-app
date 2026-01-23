
import React from 'react';
import { GenerationRecord } from '../types';

interface HistoryListProps {
  history: GenerationRecord[];
  isLoggedIn: boolean;
  onClear: () => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, isLoggedIn, onClear, onDelete }) => {
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
              <button className="size-10 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
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
                    {record.currentTime} / {record.duration}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button className="size-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 active:scale-95 transition-all" title="下载">
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
