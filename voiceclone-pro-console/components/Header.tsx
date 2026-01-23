
import React, { useState, useRef, useEffect } from 'react';
import { AppView } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentView: AppView;
  isLoggedIn: boolean;
  onNavigate: (view: AppView, section?: any) => void;
  onLogout: () => void;
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, isLoggedIn, onNavigate, onLogout, onLoginClick }) => {
  const { points } = useAuth();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#fce7f3]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => onNavigate(AppView.HOME)}
        >
          <div className="size-9 flex items-center justify-center bg-primary rounded-xl text-white shadow-lg shadow-pink-200 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">graphic_eq</span>
          </div>
          <span className="text-xl font-bold tracking-tight font-display text-[#1c0d14]">
            VoiceClone <span className="text-primary">Pro</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-10">
          <button 
            onClick={() => onNavigate(AppView.HOME)}
            className={`text-sm font-bold transition-all ${currentView === AppView.HOME ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
          >
            首页
          </button>
          <button 
            onClick={() => onNavigate(AppView.WORKSPACE)}
            className={`text-sm font-bold transition-all ${currentView === AppView.WORKSPACE ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
          >
            语音生成
          </button>
          <button 
            onClick={() => onNavigate(AppView.VOICE_LIBRARY)}
            className={`text-sm font-bold transition-all ${currentView === AppView.VOICE_LIBRARY ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
          >
            声音库
          </button>
          <button 
            onClick={() => onNavigate(AppView.VIP)}
            className={`text-sm font-bold transition-all ${currentView === AppView.VIP ? 'text-primary font-black' : 'text-gray-500 hover:text-primary'}`}
          >
            充值/VIP
          </button>
          <button 
            onClick={() => onNavigate(AppView.ACCOUNT, 'info')}
            className={`text-sm font-bold transition-all ${currentView === AppView.ACCOUNT ? 'text-primary font-black' : 'text-gray-500 hover:text-primary'}`}
          >
            个人账号
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {/* Points Pill - Styled like screenshot */}
              <div 
                onClick={() => onNavigate(AppView.ACCOUNT, 'points')}
                className="flex items-center h-10 pl-4 pr-1 bg-pink-50/50 rounded-full border border-pink-100/50 cursor-pointer hover:bg-pink-100 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2 mr-3">
                  <span className="material-symbols-outlined text-[#f53d99] text-[18px] font-bold">payments</span>
                  <span className="text-sm font-black text-[#f53d99]">{points}</span>
                </div>
                <div className="size-8 rounded-full bg-[#f53d99] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-pink-100">
                  <span className="material-symbols-outlined text-lg">add</span>
                </div>
              </div>

              {/* Settings Icon - Outlined style from screenshot */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-primary/5 hover:text-primary transition-all border border-gray-100 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                </button>
                
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#fce7f3] rounded-2xl shadow-xl py-2 z-50 animate-[fadeIn_0.2s]">
                    <button 
                      onClick={() => { onNavigate(AppView.ACCOUNT, 'security'); setShowSettingsMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50 hover:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">shield</span>
                      安全中心
                    </button>
                    <div className="h-px bg-gray-50 my-1"></div>
                    <button 
                      onClick={() => { onLogout(); setShowSettingsMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      退出登录
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Icon - Pink circle border style from screenshot */}
              <button 
                onClick={() => onNavigate(AppView.ACCOUNT, 'info')}
                className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-white text-primary hover:bg-pink-50 transition-all border-2 border-primary shadow-sm"
              >
                <span className="material-symbols-outlined text-[22px]">account_circle</span>
              </button>
            </>
          ) : (
            <button 
              onClick={onLoginClick}
              className="px-6 py-2 bg-[#f53d99] text-white text-xs font-black rounded-xl shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all"
            >
              登录 / 注册
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
