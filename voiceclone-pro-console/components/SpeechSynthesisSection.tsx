
import React, { useState, useEffect, useRef } from 'react';

interface SpeechSynthesisSectionProps {
  onGenerate: (text: string, options: any) => void;
  isGenerating: boolean;
}

const SpeechSynthesisSection: React.FC<SpeechSynthesisSectionProps> = ({ 
  onGenerate, 
  isGenerating 
}) => {
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1.4);
  const [displaySpeed, setDisplaySpeed] = useState(1.4);
  const [emotion, setEmotion] = useState('自然 (默认)');
  const [format, setFormat] = useState('WAV (无损)');
  const [showTips, setShowTips] = useState(true);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [vipTrialCount, setVipTrialCount] = useState(3);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interpolation for speed display
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setDisplaySpeed(prev => {
        const diff = speed - prev;
        if (Math.abs(diff) < 0.01) return speed;
        return prev + diff * 0.2;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [speed]);

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setText(content.slice(0, 2000));
      }
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  const insertTag = (tag: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + `(${tag})` + text.substring(end);
    
    setText(newText);
    
    // Focus back and set cursor position after the inserted tag
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + tag.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleAiGenerate = () => {
    if (vipTrialCount <= 0) {
      alert('您的试用次数已用完，请升级 VIP 继续使用智能生成功能。');
      return;
    }

    setIsAiGenerating(true);
    // Simulate AI text generation / optimization
    setTimeout(() => {
      const suggestions = [
        "(欣喜) 在这个瞬息万变的世界里，唯有真实的情感能穿越喧嚣，抵达人心深处。",
        "(深情) 每一道声纹都是独一无二的灵魂印记，我们在数字世界为你保留这份珍贵的温度。",
        "(自信) 让声音不仅仅是信息的载体，更是情感的纽带，跨越空间的距离。"
      ];
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      setText(prev => (prev ? prev + "\n" + randomSuggestion : randomSuggestion));
      setVipTrialCount(prev => prev - 1);
      setIsAiGenerating(false);
    }, 1500);
  };

  const emotionTags = [
    { label: '开心', icon: 'sentiment_very_satisfied' },
    { label: '悲伤', icon: 'sentiment_very_dissatisfied' },
    { label: '愤怒', icon: 'mood_bad' },
    { label: '激动', icon: 'bolt' },
    { label: '平静', icon: 'self_improvement' },
    { label: '紧张', icon: 'scuba_diving' },
    { label: '自信', icon: 'verified' },
    { label: '惊讶', icon: 'error_outline' },
    { label: '满意', icon: 'thumb_up' },
    { label: '欣喜', icon: 'celebration' },
    { label: '温柔', icon: 'favorite' },
    { label: '严厉', icon: 'gavel' },
    { label: '调皮', icon: 'auto_fix_high' },
    { label: '恐惧', icon: 'privacy_tip' }
  ];

  return (
    <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-[#e8cedb] shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-primary text-white size-8 rounded-full text-sm font-black shadow-lg shadow-pink-100 italic">2</span>
          <h3 className="text-[#1c0d14] text-xl font-black font-display tracking-tight">语音合成</h3>
        </div>
        <button 
          onClick={() => setShowTips(!showTips)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${showTips ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400 hover:text-primary hover:bg-pink-50'}`}
        >
          <span className="material-symbols-outlined text-sm">lightbulb</span>
          {showTips ? '隐藏提示' : '操作提示'}
        </button>
      </div>

      {showTips && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          {/* VIP Feature Block */}
          <div className="bg-gradient-to-br from-[#fdf4ff] to-white border border-[#f5d0fe] p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-white border border-[#f5d0fe] flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-[#701a75]">VIP 专属智能生成</h4>
                    <span className="text-[10px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-md shadow-sm">PRO</span>
                  </div>
                  <p className="text-[11px] text-[#a21caf] font-bold mt-1">基于大模型智能改写文本，使其更符合口语表达与情感需求。</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">
                    普通用户可以试用 <span className="text-[#a21caf] font-black">{vipTrialCount}</span> 次
                  </p>
                </div>
              </div>
              <button 
                onClick={handleAiGenerate}
                disabled={isAiGenerating}
                className="h-10 px-6 bg-[#701a75] hover:bg-[#a21caf] text-white text-xs font-black rounded-xl shadow-lg shadow-purple-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 group-hover:scale-105 active:scale-95"
              >
                {isAiGenerating ? (
                   <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">magic_button</span>
                )}
                一键智能生成
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50/50 to-white border border-pink-100/50 p-5 rounded-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">psychology</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-[#9c4973] mb-1">细粒度情感控制</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    您可以直接在文本中加入 <span className="text-primary font-black px-1.5 py-0.5 bg-white rounded border border-pink-100">(情感)</span> 标签来控制局部语气的表达。
                  </p>
                </div>
              </div>

              {/* How it works visual demo */}
              <div className="bg-[#1c0d14]/5 rounded-xl p-3 font-mono text-[11px] text-gray-600 relative group/demo">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
                <div className="space-y-1">
                  <p><span className="text-primary">(开心)</span> 今天的天气真好啊！</p>
                  <p><span className="text-primary">(悲伤)</span> 听到这个消息我很难过。</p>
                  <p><span className="text-primary">(激动)</span> 这简直太不可思议了！</p>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
                {emotionTags.map(tag => (
                  <button
                    key={tag.label}
                    onClick={() => insertTag(tag.label)}
                    className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white border border-pink-100 rounded-xl text-[10px] font-black text-gray-600 hover:border-primary hover:text-primary hover:shadow-md transition-all group"
                  >
                    <span className="material-symbols-outlined text-lg text-pink-300 group-hover:text-primary group-hover:scale-110 transition-transform">{tag.icon}</span>
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <label className="text-[#1c0d14] text-sm font-bold">输入待合成文本</label>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".txt" 
              onChange={onFileChange}
            />
            <button 
              onClick={() => setText('')}
              className="text-[11px] text-gray-400 hover:text-red-500 font-bold transition-colors"
            >
              清空文本
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-primary hover:underline font-bold"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              上传文本文件
            </button>
          </div>
        </div>
        <div 
          className="relative group"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <textarea 
            ref={textAreaRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            className={`form-input flex w-full min-w-0 flex-1 resize-none rounded-2xl text-[#1c0d14] focus:outline-0 focus:ring-4 focus:ring-primary/10 border transition-all min-h-[220px] placeholder:text-[#9c4973]/30 p-5 text-sm font-medium leading-relaxed ${
              isDraggingFile 
                ? 'border-primary bg-pink-50 ring-4 ring-primary/10' 
                : 'border-[#e8cedb] bg-[#fcf8fa]'
            }`} 
            placeholder="请输入您想要合成的文本内容，或者拖拽 .txt 文件到此处..."
          ></textarea>
          
          {isDraggingFile && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl border-2 border-dashed border-primary animate-pulse">
              <span className="material-symbols-outlined text-5xl text-primary mb-2">move_to_inbox</span>
              <p className="text-primary font-black text-sm">松开以导入文本</p>
            </div>
          )}

          <div className="absolute bottom-4 right-4 text-[11px] text-[#9c4973] font-bold bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-pink-50 shadow-sm">
            {text.length} / 2000 字
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#fcf8fa] p-5 rounded-2xl border border-[#fce7f3]">
          <div className="flex justify-between items-center mb-6 px-1">
            <span className="text-sm font-bold text-gray-700">合成语速</span>
            <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 transition-all duration-300 transform active:scale-110">
              {displaySpeed.toFixed(1)}x
            </span>
          </div>
          <div className="px-2">
            <input 
              className="w-full h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary slider-thumb-pink" 
              max="2.0" min="0.5" step="0.1" type="range" 
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
            />
            <div className="flex justify-between mt-4 px-1">
              {[0.5, 1.0, 1.5, 2.0].map(val => (
                <button 
                  key={val}
                  onClick={() => setSpeed(val)}
                  className={`text-[11px] font-black transition-all duration-200 ${
                    Math.abs(speed - val) < 0.05 
                      ? 'text-primary scale-110' 
                      : 'text-gray-400 hover:text-primary'
                  }`}
                >
                  {val.toFixed(1)}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-700 px-1">整体情感倾向</span>
            <select 
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="form-select h-12 rounded-xl border-[#e8cedb] bg-[#fcf8fa] focus:ring-primary/20 focus:border-primary text-sm font-bold text-gray-700 px-4 transition-all"
            >
              <option>自然 (默认)</option>
              <option>饱满</option>
              <option>低沉</option>
              <option>激昂</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-700 px-1">输出格式</span>
            <select 
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="form-select h-12 rounded-xl border-[#e8cedb] bg-[#fcf8fa] focus:ring-primary/20 focus:border-primary text-sm font-bold text-gray-700 px-4 transition-all"
            >
              <option>WAV (无损)</option>
              <option>MP3 (192kbps)</option>
              <option>MP3 (320kbps)</option>
            </select>
          </div>
        </div>

        <button 
          disabled={isGenerating || !text.trim()}
          onClick={() => onGenerate(text, { speed, emotion, format })}
          className={`group flex items-center justify-center gap-3 w-full h-14 text-white text-lg font-black rounded-2xl shadow-xl transition-all duration-500 relative overflow-hidden ${
            isGenerating || !text.trim() 
              ? 'bg-gray-200 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-gray-200 to-gray-400 hover:from-primary hover:to-[#ff7eb3] active:scale-[0.98]'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin size-5 border-3 border-white border-t-transparent rounded-full"></div>
              <span>正在为您合成音频...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined transition-transform group-hover:scale-125 group-hover:rotate-12">bolt</span>
              <span className={!text.trim() ? 'text-gray-400' : 'text-white'}>开始生成音频</span>
            </>
          )}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SpeechSynthesisSection;
