import { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { CommandDashboard } from './components/CommandDashboard';
import { LivestockManagement } from './components/LivestockManagement';
import { AlertsPanel } from './components/AlertsPanel';
import { MapTracking } from './components/MapTracking';
import { FarmerManagement } from './components/FarmerManagement';
import { DiseaseIntelligence } from './components/DiseaseIntelligence';
import { SustainabilityAnalytics } from './components/SustainabilityAnalytics';
import { AnimalDigitalTwin } from './components/AnimalDigitalTwin';
import { Button } from './components/ui/button';
import {
  LayoutDashboard, Users, Bell, Map, UserCog, LogOut, Menu, X,
  ChevronRight, Beef, Biohazard, Leaf, Satellite, Activity, Shield, Sun, Moon
} from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { supabase } from './utils/supabase/client';
import { projectId } from './utils/supabase/info';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'livestock' | 'alerts' | 'map' | 'farmers' | 'disease' | 'sustainability' | 'digital-twin';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | undefined>(undefined);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('agritrack-theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('agritrack-theme', 'light'); }
  };

  const handleAuthSuccess = (token: string, demoUser?: { name: string; email: string; role: string; farmLocation?: string }) => {
    setAccessToken(token);
    setUser(demoUser ?? { name: 'Demo Operator', email: 'demo@agritrack.co.bw', role: 'farmer', farmLocation: 'Botswana Operations' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleViewAnimal = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setCurrentView('digital-twin');
  };

  const navGroups = [
    {
      label: 'OPERATIONS',
      items: [
        { id: 'dashboard' as View, label: 'Command Center', icon: LayoutDashboard },
        { id: 'livestock' as View, label: 'Herd Registry', icon: Beef },
        { id: 'map' as View, label: 'GPS Tracking', icon: Satellite },
      ]
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'disease' as View, label: 'Disease Intelligence', icon: Biohazard },
        { id: 'digital-twin' as View, label: 'Animal Digital Twin', icon: Activity },
        { id: 'sustainability' as View, label: 'Sustainability', icon: Leaf },
      ]
    },
    {
      label: 'MONITORING',
      items: [
        { id: 'alerts' as View, label: 'Alert Center', icon: Bell },
        ...(user?.role === 'admin' ? [{ id: 'farmers' as View, label: 'Farmer Registry', icon: Users }] : []),
      ]
    }
  ];

  if (!accessToken) return <AuthPage onAuthSuccess={handleAuthSuccess} />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      {/* Ruminant farm animal background — cattle grazing at low opacity */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=80"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', opacity: isDark ? 0.1 : 0.07 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 70% 50% at 15% 0%, rgba(74,222,128,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 55% 45% at 85% 100%, rgba(217,119,6,0.07) 0%, transparent 60%)
          `,
        }} />
      </div>

      <Toaster />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100vh' }}>
        {/* Sidebar Desktop */}
        <motion.aside
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)', boxShadow: '4px 0 32px rgba(0,0,0,0.25)', flexShrink: 0 }}
          className="hidden lg:flex flex-col w-72"
        >
          {/* Logo */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--sidebar-border)' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Beef size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h1 style={{ color: 'var(--sidebar-foreground)', fontWeight: 700, fontSize: 17, lineHeight: 1.2, margin: 0 }}>AgriTrack Pro</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} className="animate-pulse" />
                  <p style={{ color: 'var(--primary)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', margin: 0 }}>INTELLIGENCE PLATFORM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-slate-500 text-[10px] font-semibold tracking-widest mb-2 px-3">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        }`}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Icon className={`size-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isActive && (
                          <motion.div layoutId="activeIndicator">
                            <ChevronRight className="size-3.5 text-emerald-400" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* System Status */}
          <div style={{ borderTop: '1px solid var(--sidebar-border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: 12, border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p style={{ color: 'var(--sidebar-foreground)', fontSize: 13, fontWeight: 500, margin: 0 }} className="truncate">{user?.name || 'Operator'}</p>
                <span style={{ fontSize: 10, background: 'rgba(74,222,128,0.12)', color: 'var(--primary)', border: '1px solid rgba(74,222,128,0.25)', padding: '2px 8px', borderRadius: 999, fontWeight: 600, textTransform: 'capitalize' }}>{user?.role || 'farmer'}</span>
              </div>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={11} />
                {user?.farmLocation || 'Botswana Operations'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--sidebar-border)', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 13, fontWeight: 500 }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              style={{ width: '100%', color: 'var(--muted-foreground)', fontSize: 13, height: 36 }}
            >
              <LogOut size={14} style={{ marginRight: 8 }} />
              Sign Out
            </Button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile Header */}
          <motion.header
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            style={{ background: 'var(--sidebar)', borderBottom: '1px solid var(--sidebar-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', flexShrink: 0 }}
            className="lg:hidden"
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Beef size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h1 style={{ color: 'var(--sidebar-foreground)', fontWeight: 700, fontSize: 15, margin: 0 }}>AgriTrack Pro</h1>
                  <p style={{ color: 'var(--primary)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', margin: 0 }}>INTELLIGENCE PLATFORM</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
                  <LogOut className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-400 hover:text-white">
                  {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.nav
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid var(--sidebar-border)', background: 'var(--sidebar)' }}
                  className="overflow-hidden"
                >
                  <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
                    {navGroups.flatMap(g => g.items).map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.nav>
              )}
            </AnimatePresence>
          </motion.header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {currentView === 'dashboard' && (
                  <CommandDashboard
                    accessToken={accessToken}
                    userRole={user?.role || 'farmer'}
                    onViewAnimal={handleViewAnimal}
                    onNavigate={(view) => setCurrentView(view as View)}
                  />
                )}
                {currentView === 'livestock' && <LivestockManagement accessToken={accessToken} />}
                {currentView === 'alerts' && <AlertsPanel accessToken={accessToken} />}
                {currentView === 'map' && <MapTracking accessToken={accessToken} />}
                {currentView === 'disease' && <DiseaseIntelligence accessToken={accessToken} onViewAnimal={handleViewAnimal} />}
                {currentView === 'sustainability' && <SustainabilityAnalytics accessToken={accessToken} />}
                {currentView === 'digital-twin' && <AnimalDigitalTwin accessToken={accessToken} initialAnimalId={selectedAnimalId} />}
                {currentView === 'farmers' && user?.role === 'admin' && <FarmerManagement accessToken={accessToken} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
