
import React from 'react';

interface VipViewProps {
  onBack: () => void;
}

const VipView: React.FC<VipViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-mesh text-[#1c0d14]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Navigation Back */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-primary font-bold text-sm mb-12 hover:-translate-x-1 transition-transform group"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          返回首页
        </button>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="size-20 rounded-[2rem] bg-white shadow-2xl shadow-pink-200/50 flex items-center justify-center text-primary mb-8 animate-bounce-slow border border-pink-50 relative">
             <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl animate-pulse"></div>
            <span className="material-symbols-outlined text-4xl relative z-10">workspace_premium</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-[#1c0d14] mb-6 tracking-tight font-display">
            VIP 尊享 <span className="text-primary">高级特权</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl font-medium leading-relaxed">
            加入 VoiceClone Pro VIP 会员，不仅是身份的象征，更是为了让您的创意资产获得永恒的生命力与更强大的 AI 赋能。
          </p>
        </div>

        {/* Privilege Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          <PrivilegeCard 
            icon="fingerprint" 
            title="永久保留音色" 
            desc="普通用户音色保存期为30天，VIP用户音色将获得云端永久存储权限，随时待命，为您的品牌声音保驾护航。"
          />
          <PrivilegeCard 
            icon="cloud_done" 
            title="永久保留生成文件" 
            desc="所有生成的音频记录、文本草稿及合成历史均永久留存，支持多端同步检索与一键批量导出。"
          />
          <PrivilegeCard 
            icon="auto_awesome" 
            title="无限使用 AI 智能情感生成" 
            desc="解除生成次数限制，独享 VIP 专用极速算力通道，一键完成文本的情感化改写与口语化修饰。"
          />
        </div>

        {/* Recharge Rules Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#1c0d14] mb-2">充值规则</h2>
            <p className="text-gray-400 font-bold text-sm">清晰透明的计费标准，让您的每一分投入都物有所值</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <RuleCard 
              icon={<span className="text-2xl font-display leading-none">¥</span>}
              title="超值兑换比例"
              main="1 元 = 100 积分"
              sub="支持多种支付方式，积分永久有效"
            />
            <RuleCard 
              icon={<span className="material-symbols-outlined text-2xl">stars</span>}
              title="自动升级 VIP"
              main="单笔充值满 ¥299"
              sub="即可自动获得 VIP 会员资格"
              highlight
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white p-16 rounded-[3rem] border border-pink-100 shadow-2xl shadow-pink-50 flex flex-col items-center text-center relative overflow-hidden max-w-5xl mx-auto mb-16">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-pink-300 to-primary"></div>
          <h2 className="text-4xl font-black text-[#1c0d14] mb-4">现在开启您的专业创作之旅</h2>
          <p className="text-gray-400 font-bold mb-12">限时福利：年度会员额外赠送 2000 积分</p>
          
          <div className="flex justify-center w-full mb-12">
            <button className="h-16 px-16 bg-gradient-to-r from-primary to-[#ff7eb3] text-white text-xl font-black rounded-full shadow-[0_20px_50px_-10px_rgba(245,61,153,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 group">
              立即升级
              <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">bolt</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 rounded-full border border-green-100/50">
               <span className="material-symbols-outlined text-green-500 text-lg font-bold">verified</span>
               <span className="text-xs font-black text-green-700">安全加密保障</span>
             </div>
          </div>
        </div>

        {/* Bottom Consumption Reference */}
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">timer</span>
            消耗参考：1000 积分 ≈ 600 秒（大概可生成 10 分钟高品质语音）
          </p>
        </div>
      </div>

      <style>{`
        .animate-bounce-slow {
          animation: bounce 4s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
      `}</style>
    </div>
  );
};

const PrivilegeCard: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-pink-50 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-pink-100 group">
    <div className="size-16 rounded-2xl bg-pink-50 text-primary flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl font-black text-[#1c0d14] mb-4">{title}</h3>
    <p className="text-gray-500 text-sm font-medium leading-relaxed">{desc}</p>
  </div>
);

const RuleCard: React.FC<{ icon: React.ReactNode, title: string, main: string, sub: string, highlight?: boolean }> = ({ icon, title, main, sub, highlight }) => (
  <div className={`p-12 rounded-[2.5rem] border transition-all flex flex-col items-center text-center ${
    highlight 
      ? 'bg-white border-primary/20 shadow-[0_20px_60px_-15px_rgba(245,61,153,0.1)]' 
      : 'bg-white border-gray-50 shadow-sm'
  }`}>
    <div className={`size-14 rounded-2xl flex items-center justify-center mb-8 ${
      highlight ? 'bg-primary text-white shadow-lg shadow-pink-200' : 'bg-gray-100/50 text-gray-400'
    }`}>
      {icon}
    </div>
    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{title}</h4>
    <p className={`text-2xl font-black mb-3 ${highlight ? 'text-primary' : 'text-[#1c0d14]'}`}>{main}</p>
    <p className="text-[11px] font-bold text-gray-400 leading-relaxed max-w-[180px]">{sub}</p>
  </div>
);

export default VipView;
