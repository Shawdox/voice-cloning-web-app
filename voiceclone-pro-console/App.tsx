
import React, { useState } from 'react';
import { AppView } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import Workspace from './components/Workspace';
import VoiceLibraryView from './components/VoiceLibraryView';
import AccountView from './components/AccountView';
import VipView from './components/VipView';
import LoginModal from './components/LoginModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { isLoggedIn, isVip, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [accountSection, setAccountSection] = useState<'recharge' | 'points' | 'info' | 'security'>('recharge');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('s1');

  // Auto-switch to WORKSPACE when logged in - DISABLED to prevent flickering
  // React.useEffect(() => {
  //   if (isLoggedIn && currentView === AppView.HOME) {
  //     setCurrentView(AppView.WORKSPACE);
  //   }
  // }, [isLoggedIn, currentView]);

  // Switch between views
  const handleNavigate = (view: AppView, section?: any) => {
    // WORKSPACE is accessible to guests
    const protectedViews = [AppView.VOICE_LIBRARY, AppView.ACCOUNT];

    if (!isLoggedIn && protectedViews.includes(view)) {
      setShowLoginModal(true);
      return;
    }

    setCurrentView(view);
    if (section && view === AppView.ACCOUNT) {
      setAccountSection(section);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    console.log('Login success, currentView:', currentView);
    // Don't auto-navigate - let user stay on current page
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      setCurrentView(AppView.HOME);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return (
          <LandingPage
            isLoggedIn={isLoggedIn}
            onStart={() => handleNavigate(AppView.WORKSPACE)}
            onLoginRequest={() => setShowLoginModal(true)}
            onViewVip={() => handleNavigate(AppView.VIP)}
          />
        );
      case AppView.WORKSPACE:
        return (
          <Workspace
            isLoggedIn={isLoggedIn}
            onManageVoices={() => handleNavigate(AppView.VOICE_LIBRARY)}
            onViewVip={() => handleNavigate(AppView.VIP)}
            onLoginRequest={() => setShowLoginModal(true)}
            initialSelectedVoiceId={selectedVoiceId}
            onVoiceChange={setSelectedVoiceId}
          />
        );
      case AppView.VOICE_LIBRARY:
        return (
          <VoiceLibraryView 
            onBack={() => handleNavigate(AppView.WORKSPACE)} 
            isLoggedIn={isLoggedIn} 
            onApplyVoice={(voiceId) => setSelectedVoiceId(voiceId)}
          />
        );
      case AppView.ACCOUNT:
        return (
          <AccountView
            isVip={isVip}
            initialSection={accountSection}
            onLogout={handleLogout}
          />
        );
      case AppView.VIP:
        return <VipView onBack={() => handleNavigate(AppView.HOME)} />;
      default:
        return (
          <LandingPage
            isLoggedIn={isLoggedIn}
            onStart={() => handleNavigate(AppView.WORKSPACE)}
            onLoginRequest={() => setShowLoginModal(true)}
            onViewVip={() => handleNavigate(AppView.VIP)}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentView={currentView}
        isLoggedIn={isLoggedIn}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
      />

      <main className="flex-grow">
        {renderContent()}
      </main>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      )}

      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
