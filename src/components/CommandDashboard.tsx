import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Beef, AlertTriangle, Activity, Users, Heart, TrendingUp, TrendingDown,
  MapPin, Thermometer, Droplets, Zap, Clock, ChevronRight, Leaf, Biohazard,
  CheckCircle2, XCircle, BarChart3, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { projectId } from '../utils/supabase/info';
import { motion } from 'motion/react';

interface Props {
  accessToken: string;
  userRole: string;
  onViewAnimal: (id: string) => void;
  onNavigate: (view: string) => void;
}

const DEMO_HEALTH_TREND = [
  { time: '00:00', healthy: 89, at_risk: 8, critical: 3 },
  { time: '04:00', healthy: 91, at_risk: 6, critical: 3 },
  { time: '08:00', healthy: 88, at_risk: 9, critical: 3 },
  { time: '12:00', healthy: 85, at_risk: 11, critical: 4 },
  { time: '16:00', healthy: 87, at_risk: 10, critical: 3 },
  { time: '20:00', healthy: 90, at_risk: 7, critical: 3 },
  { time: 'Now', healthy: 88, at_risk: 9, critical: 3 },
];

const DEMO_ACTIVITY = [
  { day: 'Mon', grazing: 7.2, rumination: 6.8, resting: 10 },
  { day: 'Tue', grazing: 6.9, rumination: 7.1, resting: 10 },
  { day: 'Wed', grazing: 7.5, rumination: 6.5, resting: 10 },
  { day: 'Thu', grazing: 6.8, rumination: 7.2, resting: 10 },
  { day: 'Fri', grazing: 7.1, rumination: 6.9, resting: 10 },
  { day: 'Sat', grazing: 7.4, rumination: 7.0, resting: 9.6 },
  { day: 'Sun', grazing: 7.0, rumination: 6.7, resting: 10.3 },
];

const DEMO_ANIMALS = [
  { id: 'demo-1', rfidTag: 'BW-RFID-0041', breed: 'Brahman', healthStatus: 'healthy', location: { name: 'North Pasture' }, riskScore: 12, temp: 38.6 },
  { id: 'demo-2', rfidTag: 'BW-RFID-0042', breed: 'Tuli', healthStatus: 'healthy', location: { name: 'South Grazing' }, riskScore: 8, temp: 38.4 },
  { id: 'demo-3', rfidTag: 'BW-RFID-0043', breed: 'Nguni', healthStatus: 'sick', location: { name: 'Isolation Block' }, riskScore: 74, temp: 39.8 },
  { id: 'demo-4', rfidTag: 'BW-RFID-0044', breed: 'Bonsmara', healthStatus: 'healthy', location: { name: 'East Paddock' }, riskScore: 19, temp: 38.7 },
  { id: 'demo-5', rfidTag: 'BW-RFID-0045', breed: 'Simmental', healthStatus: 'treatment', location: { name: 'Vet Bay' }, riskScore: 55, temp: 39.2 },
  { id: 'demo-6', rfidTag: 'BW-RFID-0046', breed: 'Brahman', healthStatus: 'healthy', location: { name: 'North Pasture' }, riskScore: 7, temp: 38.3 },
];

const DEMO_ANOMALIES = [
  { time: '14:32', animal: 'BW-RFID-0043', type: 'Elevated Temperature', severity: 'critical', detail: '39.8°C — fever threshold exceeded' },
  { time: '13:15', animal: 'BW-RFID-0045', type: 'Digestive Instability', severity: 'high', detail: 'Rumen pH 5.8 — acidosis risk' },
  { time: '11:44', animal: 'BW-RFID-0041', type: 'Reduced Rumination', severity: 'medium', detail: 'Activity 34% below baseline' },
  { time: '09:02', animal: 'BW-RFID-0047', type: 'Boundary Crossing', severity: 'low', detail: 'Moved outside designated grazing zone' },
];

const healthColors = { healthy: '#22c55e', at_risk: '#f59e0b', critical: '#ef4444' };
const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  high: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  low: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, accent }: any) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400 }}>
      <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
              <Icon className="size-5" />
            </div>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {trend}
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{title}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
            <p className="text-slate-500 text-xs">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CommandDashboard({ accessToken, userRole, onViewAnimal, onNavigate }: Props) {
  const [stats, setStats] = useState({ totalLivestock: 0, activeAlerts: 0, healthyAnimals: 0, totalFarmers: 0 });
  const [livestock, setLivestock] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, livestockRes, alertsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/stats`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/alerts`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
      ]);
      const [statsData, livestockData, alertsData] = await Promise.all([statsRes.json(), livestockRes.json(), alertsRes.json()]);
      if (statsRes.ok) setStats(statsData);
      if (livestockRes.ok) setLivestock(livestockData.livestock || []);
      if (alertsRes.ok) setAlerts(alertsData.alerts || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const displayLivestock = livestock.length > 0 ? livestock.slice(0, 6) : DEMO_ANIMALS;
  const displayAlerts = alerts.length > 0 ? alerts.slice(0, 4) : [];
  const totalCount = stats.totalLivestock || DEMO_ANIMALS.length;
  const healthyCount = stats.healthyAnimals || DEMO_ANIMALS.filter(a => a.healthStatus === 'healthy').length;
  const alertCount = stats.activeAlerts || 2;
  const healthRate = totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 88;

  const pieData = [
    { name: 'Healthy', value: healthyCount || 4 },
    { name: 'At Risk', value: Math.max(0, totalCount - healthyCount - (livestock.filter((a: any) => a.healthStatus === 'sick').length || 1)) || 1 },
    { name: 'Critical', value: livestock.filter((a: any) => a.healthStatus === 'sick').length || 1 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}{p.dataKey.includes('grazing') || p.dataKey.includes('rumination') || p.dataKey.includes('resting') ? 'h' : '%'}</p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
            <Activity className="size-10 mx-auto text-emerald-400" />
          </motion.div>
          <p className="text-slate-400 text-sm">Loading intelligence data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-white">Command Center</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Livestock Intelligence Overview — Botswana Operations
          </p>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="size-3" />
            {lastUpdated.toLocaleTimeString()}
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Herd"
          value={totalCount}
          subtitle={`${healthyCount} healthy`}
          icon={Beef}
          trend="+3 this week"
          trendUp={true}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          title="Health Rate"
          value={`${healthRate}%`}
          subtitle="Animals in good condition"
          icon={Heart}
          trend={healthRate >= 85 ? '+2% vs yesterday' : '-1% vs yesterday'}
          trendUp={healthRate >= 85}
          accent="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          title="Active Alerts"
          value={alertCount}
          subtitle="Require attention"
          icon={AlertTriangle}
          trend={alertCount > 3 ? 'High activity' : 'Normal'}
          trendUp={false}
          accent="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          title="Sustainability"
          value="78/100"
          subtitle="Herd avg score"
          icon={Leaf}
          trend="+4 pts this month"
          trendUp={true}
          accent="bg-green-500/15 text-green-400"
        />
      </div>

      {/* Secondary Stats */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Registered Farmers" value={stats.totalFarmers || 12} subtitle="Active operators" icon={Users} accent="bg-purple-500/15 text-purple-400" />
          <StatCard title="Avg Rumen Temp" value="38.7°C" subtitle="Normal range 38–39.5°C" icon={Thermometer} accent="bg-orange-500/15 text-orange-400" />
          <StatCard title="Avg Rumen pH" value="6.7" subtitle="Healthy: 6.5–7.0" icon={Droplets} accent="bg-cyan-500/15 text-cyan-400" />
          <StatCard title="Disease Risk Index" value="Low" subtitle="Herd-wide assessment" icon={Biohazard} accent="bg-emerald-500/15 text-emerald-400" />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Trend Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="size-4 text-emerald-400" />
                  Herd Health Distribution — 24h
                </CardTitle>
                <span className="text-xs text-slate-500">% of herd</span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={DEMO_HEALTH_TREND}>
                  <defs>
                    <linearGradient id="healthy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="at_risk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="critical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="healthy" name="Healthy" stroke="#22c55e" strokeWidth={2} fill="url(#healthy)" />
                  <Area type="monotone" dataKey="at_risk" name="At Risk" stroke="#f59e0b" strokeWidth={2} fill="url(#at_risk)" />
                  <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={2} fill="url(#critical)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Health Distribution Pie */}
        <div>
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
                <Activity className="size-4 text-amber-400" />
                Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={['#22c55e', '#f59e0b', '#ef4444'][i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ['#22c55e', '#f59e0b', '#ef4444'][i] }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-slate-200 font-medium">{d.value} animals</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity & Animals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grazing Activity Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
                <Zap className="size-4 text-amber-400" />
                Herd Activity — 7-Day Pattern (hrs/day)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={DEMO_ACTIVITY} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Bar dataKey="grazing" name="Grazing" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="rumination" name="Rumination" fill="#fb923c" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="resting" name="Resting" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Anomalies */}
        <div>
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-400" />
                  Recent Anomalies
                </CardTitle>
                <button onClick={() => onNavigate('disease')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5">
                  View all <ChevronRight className="size-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(displayAlerts.length > 0 ? displayAlerts.map((a: any) => ({
                time: new Date(a.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                animal: a.animalId?.slice(0, 12) || 'Unknown',
                type: a.type,
                severity: a.severity,
                detail: a.message
              })) : DEMO_ANOMALIES).map((anomaly, i) => {
                const s = severityConfig[anomaly.severity] || severityConfig.low;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-3 rounded-lg border ${s.bg} ${s.border}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-xs font-semibold ${s.color}`}>{anomaly.type}</p>
                      <span className="text-slate-500 text-[10px] flex-shrink-0">{anomaly.time}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{anomaly.detail}</p>
                    <p className="text-slate-600 text-[10px] mt-1 font-mono">{anomaly.animal}</p>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Animal Status */}
      <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
              <MapPin className="size-4 text-emerald-400" />
              Live Animal Status
            </CardTitle>
            <button onClick={() => onNavigate('livestock')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5">
              Manage herd <ChevronRight className="size-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayLivestock.map((animal: any, i) => {
              const riskScore = animal.riskScore ?? Math.floor(Math.random() * 30);
              const temp = animal.temp ?? (38.3 + Math.random() * 1.5).toFixed(1);
              const statusColors: Record<string, string> = {
                healthy: 'bg-emerald-500/10 border-emerald-500/20',
                sick: 'bg-red-500/10 border-red-500/20',
                treatment: 'bg-amber-500/10 border-amber-500/20',
              };
              const statusDot: Record<string, string> = {
                healthy: 'bg-emerald-400',
                sick: 'bg-red-400',
                treatment: 'bg-amber-400',
              };
              return (
                <motion.button
                  key={animal.id}
                  onClick={() => onViewAnimal(animal.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  className={`p-4 rounded-xl border text-left transition-all ${statusColors[animal.healthStatus] || statusColors.healthy} hover:border-emerald-500/40`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-slate-200 font-semibold text-sm">{animal.breed}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{animal.rfidTag}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusDot[animal.healthStatus] || statusDot.healthy} animate-pulse`} />
                      <span className={`text-xs font-medium capitalize ${
                        animal.healthStatus === 'healthy' ? 'text-emerald-400' :
                        animal.healthStatus === 'sick' ? 'text-red-400' : 'text-amber-400'
                      }`}>{animal.healthStatus}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-slate-400 text-[10px]">Temp</p>
                      <p className="text-slate-200 text-xs font-medium">{temp}°C</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-[10px]">Risk</p>
                      <p className={`text-xs font-bold ${riskScore > 60 ? 'text-red-400' : riskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{riskScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-[10px]">Zone</p>
                      <p className="text-slate-300 text-[10px] truncate">{animal.location?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Disease Intelligence', icon: Biohazard, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 hover:border-red-500/40', view: 'disease' },
          { label: 'GPS Tracking', icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40', view: 'map' },
          { label: 'Sustainability Report', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20 hover:border-green-500/40', view: 'sustainability' },
          { label: 'Alert Center', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40', view: 'alerts' },
        ].map((action) => (
          <motion.button
            key={action.view}
            onClick={() => onNavigate(action.view)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl border text-left transition-all ${action.bg}`}
          >
            <action.icon className={`size-5 mb-2 ${action.color}`} />
            <p className="text-slate-300 text-sm font-medium">{action.label}</p>
            <ChevronRight className="size-3 text-slate-500 mt-1" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
