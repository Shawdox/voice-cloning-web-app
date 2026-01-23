
import React from 'react';

interface LandingPageProps {
  isLoggedIn: boolean;
  onStart: () => void;
  onLoginRequest: () => void;
  onViewVip: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ isLoggedIn, onStart, onLoginRequest, onViewVip }) => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-mesh py-24 lg:py-40 pt-48 flex items-center justify-center min-h-[85vh]">
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* V3 Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-pink-100 text-primary text-xs font-bold mb-10 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              全新 V3 引擎现已发布，合成效果更自然
            </div>

            <h1 className="text-6xl lg:text-8xl font-black leading-tight tracking-tight mb-8 text-[#1c0d14]">
              AI 声音克隆，<span className="text-primary">即刻开启</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-500 mb-14 max-w-3xl leading-relaxed font-medium">
              仅需几秒钟的样本，即可复刻极致真实的数字声纹。无论是在播客、教育还<br className="hidden lg:block" />是创意内容中，让您的文字充满情感与温度。
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <button 
                onClick={onStart}
                className="group flex items-center justify-center gap-3 min-w-[240px] h-16 bg-gradient-to-r from-primary to-[#ff7eb3] text-white text-xl font-black rounded-full shadow-[0_15px_30px_-5px_rgba(245,61,153,0.4)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-5px_rgba(245,61,153,0.5)] transition-all"
              >
                免费开始体验
                <span className="material-symbols-outlined font-black">arrow_forward</span>
              </button>
              
              {!isLoggedIn && (
                <button 
                  onClick={onLoginRequest}
                  className="flex items-center justify-center gap-2 min-w-[240px] h-16 bg-white text-gray-700 border border-gray-100 text-xl font-bold rounded-full hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm"
                >
                  登录 / 注册
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium bg-gray-50/50 px-4 py-2 rounded-full border border-gray-100">
              <span className="material-symbols-outlined text-base">info</span>
              体验版无需登录，高级功能及保存记录需登录
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-60"></div>
        <div className="absolute bottom-10 right-10 w-[700px] h-[700px] bg-primary/10 blur-[150px] rounded-full translate-x-1/4 translate-y-1/4 opacity-60"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">为什么选择我们？</h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="bolt" 
              title="极速克隆" 
              desc="采用毫秒级推理架构，上传 10 秒音频即可生成声纹模型，支持流式实时合成，满足各种实时交互场景需求。"
            />
            <FeatureCard 
              icon="waves" 
              title="自然语音" 
              desc="基于深度神经网络的学习算法，精准捕捉呼吸感、重音和情感起伏，让 AI 生成的声音像真人一样自然。"
            />
            <FeatureCard 
              icon="verified_user" 
              title="安全保障" 
              desc="严格的声音权限管理，支持添加数字水印防止非法滥用。您的训练数据经过端到端加密，隐私有保障。"
            />
          </div>
        </div>
      </section>

      {/* VIP Entrance Teaser */}
      <section className="py-20 bg-pink-50/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-pink-100 rounded-full text-primary text-[10px] font-black mb-6">
            <span className="material-symbols-outlined text-sm">stars</span>
            专业级方案
          </div>
          <h2 className="text-3xl font-black mb-6">更强大的特权，专为创作者准备</h2>
          <p className="text-gray-500 font-medium mb-10">
            想要永久保留您的每一个珍贵音色吗？或者需要无限次的 AI 辅助文案改写？
          </p>
          <button 
            onClick={onViewVip}
            className="px-10 py-4 bg-white border-2 border-primary text-primary font-black rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl shadow-pink-100"
          >
            查看 VIP 专属特权详情
          </button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="p-10 rounded-[2.5rem] bg-gray-50/50 border border-transparent hover:border-pink-100 hover:bg-white transition-all group hover:shadow-2xl hover:shadow-pink-50">
    <div className="size-16 rounded-3xl bg-white flex items-center justify-center text-primary shadow-sm mb-8 group-hover:scale-110 transition-transform">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl font-black mb-4">{title}</h3>
    <p className="text-gray-500 leading-relaxed text-sm font-medium">{desc}</p>
  </div>
);

export default LandingPage;
