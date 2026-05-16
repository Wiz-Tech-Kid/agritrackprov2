import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, Satellite, Shield, Leaf, Activity, ChevronRight, Beef, Sun, Moon } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { motion } from 'motion/react';

interface DemoUser {
  name: string;
  email: string;
  role: string;
  farmLocation?: string;
}

interface AuthPageProps {
  onAuthSuccess: (accessToken: string, demoUser?: DemoUser) => void;
}

const DEMO_ACCOUNTS: { label: string; sub: string; color: string; borderColor: string; iconColor: string; user: DemoUser }[] = [
  {
    label: 'Enter as Admin',
    sub: 'Full platform access · all farms · Farmer Registry',
    color: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.35)',
    iconColor: '#4ade80',
    user: { name: 'Demo Administrator', email: 'admin@agritrack.co.bw', role: 'admin', farmLocation: 'Botswana HQ' },
  },
  {
    label: 'Enter as Farmer',
    sub: 'Single-farm view · herd management · alerts',
    color: 'rgba(217,119,6,0.1)',
    borderColor: 'rgba(217,119,6,0.35)',
    iconColor: '#f59e0b',
    user: { name: 'Kgomotso Sithole', email: 'farmer@agritrack.co.bw', role: 'farmer', farmLocation: 'Maun District, BW' },
  },
];

const FEATURES = [
  { icon: Satellite, label: 'Real-time GPS tracking with rumen bolus sensors' },
  { icon: Activity, label: 'Disease risk detection & digestive health analytics' },
  { icon: Leaf, label: 'Sustainability scoring & grazing optimisation' },
  { icon: Shield, label: 'AI-powered veterinary action recommendations' },
];

const DARK: Record<string, string> = {
  bg:      '#0b1c0e',
  panel:   '#0d2010',
  card:    '#102214',
  border:  'rgba(74,222,128,0.14)',
  text1:   '#d1fae5',
  text2:   '#a7f3d0',
  text3:   '#6ee7b7',
  text4:   '#5ea872',
  text5:   '#3d7554',
  primary: '#4ade80',
  accent:  '#f59e0b',
  inputBg: '#162d1b',
};
const LIGHT: Record<string, string> = {
  bg:      '#f4faf0',
  panel:   '#e8f5e0',
  card:    '#ffffff',
  border:  'rgba(22,163,74,0.18)',
  text1:   '#1a2e1c',
  text2:   '#14532d',
  text3:   '#166534',
  text4:   '#4d7c61',
  text5:   '#6aab7c',
  primary: '#16a34a',
  accent:  '#d97706',
  inputBg: '#ecfdf1',
};

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<'farmer' | 'admin'>('farmer');
  const [farmLocation, setFarmLocation] = useState('');

  const C = isDark ? DARK : LIGHT;

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('agritrack-theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('agritrack-theme', 'light'); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
      if (data.session?.access_token) onAuthSuccess(data.session.access_token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ email: signupEmail, password: signupPassword, name: signupName, role: signupRole, farmLocation })
        }
      );
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Signup failed'); setLoading(false); return; }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: signupEmail, password: signupPassword });
      if (signInError) { setError('Account created. Please sign in.'); setLoading(false); return; }
      if (data.session?.access_token) onAuthSuccess(data.session.access_token);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: C.inputBg, border: `1px solid ${C.border}`, color: C.text1, height: '44px',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: C.bg, position: 'relative', overflow: 'hidden' }}>

      {/* Cattle background image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <img
          src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=80"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', opacity: isDark ? 0.12 : 0.06 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${C.bg} 0%, transparent 100%)` }} />
      </div>

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 99,
          background: isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.1)',
          border: `1px solid ${C.border}`, cursor: 'pointer',
          color: C.primary, fontSize: 12, fontWeight: 600,
        }}
      >
        {isDark ? <Sun size={13} /> : <Moon size={13} />}
        {isDark ? 'Light' : 'Dark'}
      </button>

      {/* ── Left Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between"
        style={{ width: '52%', background: C.panel, padding: '56px', position: 'relative', overflow: 'hidden', zIndex: 1 }}
      >
        {/* Accent blobs */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 400, height: 400, background: `radial-gradient(circle, ${isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.08)'} 0%, transparent 70%)`, transform: 'translate(-40%, -40%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 320, height: 320, background: `radial-gradient(circle, ${isDark ? 'rgba(217,119,6,0.08)' : 'rgba(217,119,6,0.06)'} 0%, transparent 70%)`, transform: 'translate(33%, 33%)', pointerEvents: 'none' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 64 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: isDark ? 'rgba(74,222,128,0.12)' : 'rgba(22,163,74,0.1)',
              border: `1px solid ${isDark ? 'rgba(74,222,128,0.25)' : 'rgba(22,163,74,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Beef size={28} style={{ color: C.primary }} />
            </div>
            <div>
              <h1 style={{ color: C.text1, fontWeight: 700, fontSize: 22, margin: '0 0 4px', lineHeight: 1.2 }}>AgriTrack Pro</h1>
              <p style={{ color: C.primary, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', margin: 0 }}>
                LIVESTOCK INTELLIGENCE PLATFORM
              </p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}>
            <h2 style={{ color: C.text1, fontWeight: 700, fontSize: 40, lineHeight: 1.1, margin: '0 0 20px' }}>
              The Command Center<br />
              <span style={{ color: C.primary }}>for African Livestock</span>
            </h2>
            <p style={{ color: C.text4, fontSize: 17, lineHeight: 1.7, margin: 0, maxWidth: 420 }}>
              Real-time health monitoring, GPS tracking, and AI-powered disease intelligence for cattle, goats, and sheep across Botswana and beyond.
            </p>
          </motion.div>
        </div>

        {/* Features + footer */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.08)',
                border: `1px solid ${isDark ? 'rgba(74,222,128,0.22)' : 'rgba(22,163,74,0.18)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <feature.icon size={16} color={C.primary} />
              </div>
              <p style={{ color: C.text3, fontSize: 14, margin: 0 }}>{feature.label}</p>
            </motion.div>
          ))}

          <div style={{ paddingTop: 24, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
            <p style={{ color: C.text5, fontSize: 12, margin: 0 }}>
              Trusted by farmers and veterinary agencies across Southern Africa
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Right Panel / Form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'rgba(16,34,20,0.85)' : 'rgba(244,250,240,0.88)',
        padding: '48px 24px', position: 'relative', zIndex: 1
      }}>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 440 }}
        >
          {/* Mobile logo — hidden on large screens via inline media query workaround */}
          <style>{`@media (min-width: 1024px) { .auth-mobile-logo { display: none !important; } }`}</style>
          <div className="auth-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: isDark ? 'rgba(74,222,128,0.12)' : 'rgba(22,163,74,0.1)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Beef size={22} style={{ color: C.primary }} />
            </div>
            <h1 style={{ color: C.text1, fontWeight: 700, fontSize: 20, margin: 0 }}>AgriTrack Pro</h1>
          </div>

          {/* Card */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: 32, boxShadow: isDark ? '0 25px 50px rgba(0,0,0,0.5)' : '0 16px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: C.text1, fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>Welcome back</h3>
              <p style={{ color: C.text4, fontSize: 14, margin: 0 }}>Sign in to your livestock intelligence dashboard</p>
            </div>

            {/* ── Demo quick-login ── */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: C.text5, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', margin: '0 0 10px', textTransform: 'uppercase' }}>
                Demo access — no credentials needed
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.user.role}
                    onClick={() => onAuthSuccess('demo', account.user)}
                    style={{
                      background: account.color, border: `1px solid ${account.borderColor}`,
                      borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <p style={{ color: C.text1, fontWeight: 700, fontSize: 13, margin: '0 0 3px' }}>{account.label}</p>
                    <p style={{ color: C.text4, fontSize: 11, margin: 0, lineHeight: 1.4 }}>{account.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ color: C.text5, fontSize: 12 }}>or sign in with your account</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            <Tabs defaultValue="login">
              <TabsList
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%',
                  background: isDark ? 'rgba(11,28,14,0.8)' : C.inputBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: 4, marginBottom: 24, height: 'auto'
                }}
              >
                <TabsTrigger
                  value="login"
                  style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '8px 0' }}
                  className="text-white data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  style={{ borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '8px 0' }}
                  className="text-white data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              {/* ── Login ── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <Label style={{ color: C.text2, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                      Email address
                    </Label>
                    <Input
                      type="email"
                      placeholder="operator@agritrack.co.bw"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      style={inputStyle}
                      className="placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <Label style={{ color: C.text2, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                      Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      style={inputStyle}
                      className="placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#1a0505', border: '1px solid #7f1d1d', borderRadius: 8 }}>
                      <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
                      <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', height: 44, background: C.primary, color: isDark ? '#052e16' : '#ffffff', fontWeight: 600, fontSize: 14, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}
                    className="hover:opacity-90 transition-opacity"
                  >
                    {loading ? 'Signing in…' : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        Access Platform <ChevronRight size={16} />
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Register ── */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <Label style={{ color: C.text2, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Full Name</Label>
                    <Input placeholder="Kgomotso Sithole" value={signupName} onChange={e => setSignupName(e.target.value)} required style={inputStyle} className="placeholder:text-slate-500" />
                  </div>
                  <div>
                    <Label style={{ color: C.text2, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Email address</Label>
                    <Input type="email" placeholder="farmer@example.co.bw" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required style={inputStyle} className="placeholder:text-slate-500" />
                  </div>
                  <div>
                    <Label style={{ color: C.text2, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Password</Label>
                    <Input type="password" placeholder="••••••••" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required style={inputStyle} className="placeholder:text-slate-500" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <Label style={{ color: C.text2, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Role</Label>
                      <Select value={signupRole} onValueChange={v => setSignupRole(v as 'farmer' | 'admin')}>
                        <SelectTrigger style={{ ...inputStyle, width: '100%' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: C.card, border: `1px solid ${C.border}` }}>
                          <SelectItem value="farmer" style={{ color: C.text1 }}>Farmer</SelectItem>
                          <SelectItem value="admin" style={{ color: C.text1 }}>Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: C.text2, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Farm Location</Label>
                      <Input placeholder="Gaborone, BW" value={farmLocation} onChange={e => setFarmLocation(e.target.value)} style={inputStyle} className="placeholder:text-slate-500" />
                    </div>
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#1a0505', border: '1px solid #7f1d1d', borderRadius: 8 }}>
                      <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
                      <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', height: 44, background: C.primary, color: isDark ? '#052e16' : '#ffffff', fontWeight: 600, fontSize: 14, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}
                    className="hover:opacity-90 transition-opacity"
                  >
                    {loading ? 'Creating account…' : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        Create Account <ChevronRight size={16} />
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
