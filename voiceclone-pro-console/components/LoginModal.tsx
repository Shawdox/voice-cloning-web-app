
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, APIError } from '../services/api';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const { login } = useAuth();
  const [loginStep, setLoginStep] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'sms'>('sms');
  const [registerMethod, setRegisterMethod] = useState<'phone' | 'email'>('phone');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginStep === 'login') {
        let response;
        if (loginMethod === 'sms') {
          response = await api.auth.loginWithSMS(phone, smsCode);
        } else {
          response = await api.auth.login(loginId, password);
        }
        await login(response.token);
        onLogin();
      } else {
        // Registration
        if (!agreedToTerms) {
          setError('请先阅读并同意相关法律与安全条款');
          setLoading(false);
          return;
        }
        const response = await api.auth.register(
          registerMethod === 'email' ? email : phone,
          password,
          registerMethod === 'phone' ? phone : undefined,
          registerMethod === 'phone' ? smsCode : undefined
        );
        await login(response.token);
        onLogin();
      }
    } catch (err) {
      setError(err instanceof APIError ? err.message : '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = () => {
    setLoginStep(loginStep === 'login' ? 'register' : 'login');
    setAgreedToTerms(false);
    setError('');
    // Reset to default methods when switching steps
    if (loginStep === 'login') {
      setRegisterMethod('phone');
    } else {
      setLoginMethod('sms');
    }
  };

  const handleSendCode = async () => {
    if (countdown > 0) return;
    setIsSendingCode(true);
    setError('');

    try {
      await api.auth.sendSMS(phone);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof APIError ? err.message : '发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div 
        className="absolute inset-0 bg-[#1c0d14]/60 backdrop-blur-sm animate-[fadeIn_0.2s]" 
        onClick={onClose}
      ></div>
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-[scaleIn_0.3s]">
        <div className="p-8 pt-10 text-center">
          <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-pink-100">
            <span className="material-symbols-outlined text-3xl">graphic_eq</span>
          </div>
          <h2 className="text-2xl font-black text-[#1c0d14] mb-2 font-display">
            {loginStep === 'login' ? '欢迎回来' : '开启创意之旅'}
          </h2>
          <p className="text-sm text-gray-400 font-bold mb-6">
            {loginStep === 'login' ? '使用您的账号登录 VoiceClone Pro' : '快速完成注册，开启智能克隆'}
          </p>

          {/* Toggles for Login/Register Methods */}
          <div className="flex p-1 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
            {loginStep === 'login' ? (
              <>
                <button 
                  onClick={() => setLoginMethod('sms')}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${loginMethod === 'sms' ? 'bg-white text-primary shadow-sm border border-pink-50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span className="material-symbols-outlined text-base">sms</span>
                  验证码登录
                </button>
                <button 
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${loginMethod === 'password' ? 'bg-white text-primary shadow-sm border border-pink-50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span className="material-symbols-outlined text-base">key</span>
                  密码登录
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setRegisterMethod('phone')}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${registerMethod === 'phone' ? 'bg-white text-primary shadow-sm border border-pink-50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span className="material-symbols-outlined text-base">smartphone</span>
                  手机号注册
                </button>
                <button 
                  onClick={() => setRegisterMethod('email')}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${registerMethod === 'email' ? 'bg-white text-primary shadow-sm border border-pink-50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span className="material-symbols-outlined text-base">mail</span>
                  邮箱注册
                </button>
              </>
            )}
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginStep === 'login' ? (
              <>
                {loginMethod === 'password' ? (
                  <>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">alternate_email</span>
                      <input
                        type="text"
                        placeholder="手机号 / 电子邮箱"
                        required
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                      <input
                        type="password"
                        placeholder="登录密码"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="flex justify-end px-1">
                      <button type="button" className="text-xs font-bold text-primary hover:underline">忘记密码？</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">smartphone</span>
                      <input
                        type="tel"
                        placeholder="请输入手机号码"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">verified_user</span>
                        <input
                          type="text"
                          placeholder="验证码"
                          required
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || isSendingCode}
                        className="px-4 h-14 bg-white border border-gray-100 text-[11px] font-black text-primary rounded-2xl hover:bg-gray-50 disabled:opacity-50 min-w-[100px] transition-all"
                      >
                        {countdown > 0 ? `${countdown}s 后重发` : isSendingCode ? '发送中...' : '获取验证码'}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {registerMethod === 'phone' ? (
                  <>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">smartphone</span>
                      <input
                        type="tel"
                        placeholder="请输入手机号码"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">verified_user</span>
                        <input
                          type="text"
                          placeholder="验证码"
                          required
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || isSendingCode}
                        className="px-4 h-14 bg-white border border-gray-100 text-[11px] font-black text-primary rounded-2xl hover:bg-gray-50 disabled:opacity-50 min-w-[100px] transition-all"
                      >
                        {countdown > 0 ? `${countdown}s 后重发` : isSendingCode ? '发送中...' : '获取验证码'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">alternate_email</span>
                    <input
                      type="email"
                      placeholder="常用电子邮箱地址"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                )}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                  <input
                    type="password"
                    placeholder="请设置登录密码"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="flex items-start gap-2 px-1 py-2 text-left">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-200 rounded focus:ring-primary/20 cursor-pointer"
                      required
                    />
                  </div>
                  <label htmlFor="terms" className="text-[11px] font-bold text-gray-500 leading-normal cursor-pointer select-none">
                    我已阅读并同意 <button type="button" className="text-primary hover:underline">《服务协议》</button> 及 <button type="button" className="text-primary hover:underline">《法律与安全条款》</button>
                  </label>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={(loginStep === 'register' && !agreedToTerms) || loading}
              className={`w-full h-14 font-black rounded-2xl transition-all mt-4 ${
                (loginStep === 'register' && !agreedToTerms) || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-primary text-white shadow-xl shadow-pink-200 hover:-translate-y-1'
              }`}
            >
              {loading ? '处理中...' : (loginStep === 'login' ? '立即登录' : '立即注册')}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-gray-300">
            <div className="h-px bg-gray-100 flex-1"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">或者通过</span>
            <div className="h-px bg-gray-100 flex-1"></div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <SocialLoginBtn icon="https://img.icons8.com/color/48/weixing.png" />
            <SocialLoginBtn icon="https://img.icons8.com/color/48/google-logo.png" />
            <SocialLoginBtn icon="https://img.icons8.com/ios-filled/50/000000/github.png" />
          </div>

          <p className="text-xs font-bold text-gray-400">
            {loginStep === 'login' ? '还没有账号？' : '已经有账号了？'}
            <button 
              onClick={toggleStep}
              className="text-primary hover:underline ml-1"
            >
              {loginStep === 'login' ? '立即注册' : '返回登录'}
            </button>
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium">
            登录即代表您同意我们的 <a href="#" className="underline">服务条款</a> 和 <a href="#" className="underline">隐私政策</a>
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

const SocialLoginBtn: React.FC<{ icon: string }> = ({ icon }) => (
  <button className="size-12 rounded-xl border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition-all active:scale-95">
    <img src={icon} className="size-6 object-contain" alt="social" />
  </button>
);

export default LoginModal;
