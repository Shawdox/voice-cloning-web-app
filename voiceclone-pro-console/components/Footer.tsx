
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="size-7 flex items-center justify-center bg-primary rounded-lg text-white">
                <span className="material-symbols-outlined text-base">graphic_eq</span>
              </div>
              <span className="text-lg font-bold font-display">VoiceClone Pro</span>
            </div>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              面向未来的 AI 语音交互引擎，为内容创作者提供最优质的声音合成服务。
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <FooterColumn title="产品" links={['控制台', 'API 开发文档', '声音库']} />
            <FooterColumn title="支持" links={['服务条款', '隐私政策', '联系支持']} />
            <FooterColumn title="社区" links={['微信公众号', 'Discord']} />
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p className="font-display">© 2024 VoiceClone Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <span>粤ICP备2024000000号-1</span>
            <span>Powered by MiniMax Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterColumn: React.FC<{ title: string; links: string[] }> = ({ title, links }) => (
  <div className="flex flex-col gap-4">
    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
    {links.map(link => (
      <a key={link} className="text-sm text-gray-600 hover:text-primary transition-colors" href="#">{link}</a>
    ))}
  </div>
);

export default Footer;
