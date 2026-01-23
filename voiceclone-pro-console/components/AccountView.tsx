
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Transaction } from '../types/api';

interface AccountViewProps {
  initialSection?: 'recharge' | 'points' | 'info' | 'security';
  onLogout?: () => void;
  isVip?: boolean;
}

const AccountView: React.FC<AccountViewProps> = ({ initialSection = 'recharge', onLogout, isVip = false }) => {
  const { user, points } = useAuth();
  const [activeSection, setActiveSection] = useState<'recharge' | 'points' | 'info' | 'security'>(initialSection);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.points.getTransactions();
        setTransactions(response.data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    try {
      await api.user.changePassword(oldPassword, newPassword);
      setPasswordSuccess('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.message || '密码修改失败');
    }
  };

  const rechargePacks = [
    { id: 1, title: '初级积分包', points: 1000, price: 10, desc: '1:100 比例，可生成约 600s 语音' },
    { id: 2, title: '专业 VIP 包', points: 29900, price: 299, desc: '单笔满额自动转永久 VIP 特权', highlight: true },
    { id: 3, title: '商用特惠包', points: 50000, price: 450, desc: '更低单价，适合大批量合成需求' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-mesh">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="lg:w-72 flex flex-col gap-4">
            {/* User Profile Card */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-[#e8cedb] shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner relative group">
                <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">account_circle</span>
                <div className="absolute bottom-1 right-1 size-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              {isVip && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-[10px] font-black text-white shadow-sm mb-3">
                  <span className="material-symbols-outlined text-xs">workspace_premium</span>
                  VIP
                </div>
              )}

              <h3 className="text-xl font-black text-[#1c0d14]">{user?.nickname || user?.email || '用户'}</h3>
              <p className="text-xs font-bold text-gray-400 mt-1">ID: {user?.id}</p>
              
              {/* Large Pink Points Card - Styled like screenshot */}
              <div 
                onClick={() => setActiveSection('points')}
                className="mt-8 px-6 py-6 bg-[#f53d99] rounded-[2rem] w-full text-white shadow-xl shadow-pink-100 flex flex-col items-center group cursor-pointer active:scale-95 transition-all relative overflow-hidden"
              >
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <span className="text-4xl font-black mb-1">{points}</span>
                 <span className="text-[11px] font-black opacity-80 uppercase tracking-widest">当前可用积分</span>
              </div>
            </div>

            {/* Nav Menu Groups */}
            <div className="bg-white rounded-3xl border border-[#e8cedb] shadow-sm p-4 flex flex-col gap-4">
              <div>
                <h4 className="px-2 text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                   <span className="material-symbols-outlined text-base">shopping_cart</span>
                   充值中心
                </h4>
                <div className="flex flex-col gap-1">
                  <NavButton icon="shopping_cart" label="立即充值" active={activeSection === 'recharge'} onClick={() => setActiveSection('recharge')} />
                  <NavButton icon="payments" label="积分使用记录" active={activeSection === 'points'} onClick={() => setActiveSection('points')} />
                </div>
              </div>

              <div className="h-px bg-gray-50"></div>

              <div>
                <h4 className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <span className="material-symbols-outlined text-base">info</span>
                   基本信息
                </h4>
                <div className="flex flex-col gap-1">
                  <NavButton icon="person" label="基本信息" active={activeSection === 'info'} onClick={() => setActiveSection('info')} />
                  <NavButton icon="shield" label="安全设置" active={activeSection === 'security'} onClick={() => setActiveSection('security')} />
                </div>
              </div>

              <div className="mt-2 pt-4 border-t border-gray-50">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  退出登录
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-[2rem] border border-[#e8cedb] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-8 border-b border-[#fce7f3] bg-[#fcf8fa]">
              <h2 className="text-2xl font-black text-[#1c0d14] flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl">
                  {activeSection === 'info' && 'person'}
                  {activeSection === 'points' && 'payments'}
                  {activeSection === 'recharge' && 'shopping_cart'}
                  {activeSection === 'security' && 'shield'}
                </span>
                {activeSection === 'recharge' && '积分充值面板'}
                {activeSection === 'points' && '积分变动历史'}
                {activeSection === 'info' && '基本信息'}
                {activeSection === 'security' && '账户安全中心'}
              </h2>
            </div>

            <div className="p-8 flex-1">
              {activeSection === 'recharge' && (
                <div className="space-y-10 animate-[fadeIn_0.3s]">
                  <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="size-14 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                          <span className="material-symbols-outlined text-3xl">stars</span>
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-primary">充值 ¥299 自动转 VIP</h4>
                          <p className="text-xs font-bold text-gray-400">单笔充值满额即可解锁永久 VIP 特权，享受无限 AI 辅助生成</p>
                       </div>
                    </div>
                    <div className="text-xs font-black text-primary bg-white px-4 py-2 rounded-full border border-primary/20">
                      消耗估算：1000 积分 ≈ 600 秒语音
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {rechargePacks.map(pack => (
                      <div 
                        key={pack.id} 
                        className={`p-6 rounded-3xl border-2 transition-all group hover:-translate-y-2 flex flex-col cursor-pointer ${
                          pack.highlight 
                            ? 'border-primary bg-primary/[0.02] shadow-xl shadow-pink-100' 
                            : 'border-gray-100 bg-white hover:border-primary/20 shadow-sm'
                        }`}
                      >
                        {pack.highlight && (
                          <div className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full w-fit mb-4">尊享 VIP</div>
                        )}
                        <h4 className="text-lg font-black text-[#1c0d14]">{pack.title}</h4>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl font-black text-[#1c0d14]">{pack.points}</span>
                          <span className="text-sm font-bold text-gray-400">积分</span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-gray-400 leading-relaxed">{pack.desc}</p>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-2xl font-black text-primary">¥{pack.price}</span>
                          <button className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                            pack.highlight ? 'bg-primary text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-400 group-hover:bg-primary group-hover:text-white'
                          }`}>
                            <span className="material-symbols-outlined">shopping_cart</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#fcf8fa] p-6 rounded-2xl border border-dashed border-[#e8cedb]">
                    <h5 className="text-xs font-black text-gray-700 mb-2">充值规则：</h5>
                    <ul className="text-[10px] text-gray-400 space-y-1.5 font-medium list-disc ml-4">
                      <li>积分充值即时到账，永久有效。</li>
                      <li>充值比例为 1 元 = 100 积分。</li>
                      <li>1000 积分大约可以生成 600 秒（10 分钟）声音。</li>
                      <li>单笔充值满 299 元自动升级为永久 VIP。</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'points' && (
                <div className="space-y-10 animate-[fadeIn_0.3s]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PointStatCard label="账户余额" value={points.toString()} icon="savings" color="text-primary" highlight />
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-gray-400 mt-4">加载中...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">暂无积分变动记录</p>
                    </div>
                  ) : (
                    <div className="border border-[#fce7f3] rounded-3xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-[#fcf8fa] text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                          <tr>
                            <th className="px-6 py-5">变动时间</th>
                            <th className="px-6 py-5">操作类型</th>
                            <th className="px-6 py-5">积分变动</th>
                            <th className="px-6 py-5">业务备注</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {transactions.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-5 text-xs font-bold text-gray-500">
                                {new Date(t.createdAt).toLocaleString('zh-CN')}
                              </td>
                              <td className="px-6 py-5 text-sm font-black text-gray-700">{t.type}</td>
                              <td className={`px-6 py-5 text-sm font-black ${t.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {t.amount > 0 ? `+${t.amount}` : t.amount}
                              </td>
                              <td className="px-6 py-5 text-xs font-medium text-gray-400">{t.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'info' && (
                <div className="max-w-2xl space-y-8 animate-[fadeIn_0.3s]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label="用户昵称" value={user?.nickname || user?.email || '未设置'} />
                    <InfoField label="绑定手机" value={user?.phone || '未绑定'} />
                    <InfoField label="注册时间" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'} />
                    <InfoField label="VIP等级" value={isVip ? `VIP ${user?.vipLevel}` : '普通用户'} />
                  </div>
                  <div className="pt-8 border-t border-gray-100">
                    <h4 className="text-sm font-black text-gray-700 mb-4">关联社交账号</h4>
                    <div className="flex gap-4">
                      <button className="flex items-center gap-3 px-6 py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all font-bold text-sm">
                        <img src="https://img.icons8.com/color/48/weixing.png" className="size-5" alt="wechat" />
                        已绑定
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="max-w-md space-y-6 animate-[fadeIn_0.3s]">
                  <form onSubmit={handlePasswordChange}>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 px-1">当前密码</label>
                        <input
                          type="password"
                          placeholder="请输入当前密码"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                          className="w-full h-12 rounded-xl border-[#e8cedb] bg-[#fcf8fa] focus:ring-primary/20 text-sm font-bold px-4"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 px-1">新密码</label>
                        <input
                          type="password"
                          placeholder="请输入新密码"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full h-12 rounded-xl border-[#e8cedb] bg-[#fcf8fa] focus:ring-primary/20 text-sm font-bold px-4"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 px-1">确认新密码</label>
                        <input
                          type="password"
                          placeholder="请再次输入新密码"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full h-12 rounded-xl border-[#e8cedb] bg-[#fcf8fa] focus:ring-primary/20 text-sm font-bold px-4"
                        />
                      </div>
                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-2xl text-sm font-bold">
                          {passwordSuccess}
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-pink-200 hover:-translate-y-1 transition-all mt-4"
                      >
                        更新安全密码
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const NavButton: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black transition-all group relative overflow-hidden ${
      active 
        ? 'bg-primary/10 text-primary' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
    }`}
  >
    <span className="material-symbols-outlined text-[18px]">{icon}</span>
    {label}
    {active && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
    )}
  </button>
);

const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-4 bg-[#fcf8fa] rounded-2xl border border-[#fce7f3]">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-black text-[#1c0d14]">{value}</p>
  </div>
);

const PointStatCard: React.FC<{ label: string; value: string; icon: string; color: string; highlight?: boolean }> = ({ label, value, icon, color, highlight }) => (
  <div className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between h-36 ${highlight ? 'bg-primary/5 border-primary/20 shadow-lg shadow-pink-50' : 'bg-white border-gray-100 shadow-sm'}`}>
    <div className={`size-10 rounded-2xl bg-white flex items-center justify-center ${color} shadow-sm`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-[#1c0d14]">{value}</p>
    </div>
  </div>
);

export default AccountView;
