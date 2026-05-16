import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Leaf, TrendingUp, TrendingDown, Droplets, Wind, Sun,
  BarChart3, Map, Activity, CheckCircle2, AlertTriangle, Globe
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import { projectId } from '../utils/supabase/info';
import { motion } from 'motion/react';

interface Props {
  accessToken: string;
}

const SUSTAINABILITY_TREND = [
  { month: 'Oct', score: 68, methane: 82, landUse: 74, water: 71 },
  { month: 'Nov', score: 70, methane: 80, landUse: 76, water: 73 },
  { month: 'Dec', score: 69, methane: 81, landUse: 75, water: 72 },
  { month: 'Jan', score: 72, methane: 78, landUse: 78, water: 75 },
  { month: 'Feb', score: 74, methane: 76, landUse: 79, water: 76 },
  { month: 'Mar', score: 76, methane: 74, landUse: 81, water: 78 },
  { month: 'Apr', score: 78, methane: 72, landUse: 82, water: 80 },
];

const ANIMAL_SCORES = [
  { rfid: 'BW-0041', breed: 'Brahman', score: 82, methane: 'Low', grazing: 'Optimal', water: 'Efficient' },
  { rfid: 'BW-0042', breed: 'Tuli', score: 87, methane: 'Very Low', grazing: 'Optimal', water: 'Efficient' },
  { rfid: 'BW-0043', breed: 'Nguni', score: 55, methane: 'High', grazing: 'Disrupted', water: 'Normal' },
  { rfid: 'BW-0044', breed: 'Bonsmara', score: 79, methane: 'Low', grazing: 'Good', water: 'Efficient' },
  { rfid: 'BW-0045', breed: 'Simmental', score: 65, methane: 'Medium', grazing: 'Reduced', water: 'Normal' },
  { rfid: 'BW-0046', breed: 'Brahman', score: 84, methane: 'Low', grazing: 'Optimal', water: 'Efficient' },
];

const GRAZING_ZONES = [
  { name: 'North Pasture', usage: 68, capacity: 85, status: 'optimal', animals: 4, area: '12 ha' },
  { name: 'South Grazing', usage: 45, capacity: 90, status: 'underused', animals: 3, area: '18 ha' },
  { name: 'East Paddock', usage: 82, capacity: 85, status: 'near-limit', animals: 6, area: '10 ha' },
  { name: 'West Rangeland', usage: 28, capacity: 75, status: 'resting', animals: 0, area: '25 ha' },
  { name: 'Central Meadow', usage: 91, capacity: 85, status: 'overloaded', animals: 7, area: '8 ha' },
  { name: 'Riverbank Zone', usage: 55, capacity: 60, status: 'optimal', animals: 2, area: '6 ha' },
];

const RADAR_DATA = [
  { metric: 'Methane Control', value: 76 },
  { metric: 'Land Efficiency', value: 82 },
  { metric: 'Water Usage', value: 78 },
  { metric: 'Diet Quality', value: 84 },
  { metric: 'Herd Welfare', value: 79 },
  { metric: 'Carbon Score', value: 71 },
];

const METHANE_TREND = [
  { week: 'W1', methane: 88, target: 75 },
  { week: 'W2', methane: 85, target: 75 },
  { week: 'W3', methane: 82, target: 75 },
  { week: 'W4', methane: 79, target: 75 },
  { week: 'W5', methane: 76, target: 75 },
  { week: 'W6', methane: 74, target: 75 },
  { week: 'W7', methane: 72, target: 75 },
  { week: 'W8', methane: 70, target: 75 },
];

function HeatmapCell({ usage, capacity, name }: { usage: number; capacity: number; name: string }) {
  const pct = (usage / capacity) * 100;
  const color = pct >= 100 ? '#ef4444' : pct >= 90 ? '#f59e0b' : pct >= 60 ? '#22c55e' : pct >= 30 ? '#84cc16' : '#6366f1';
  const label = pct >= 100 ? 'Overloaded' : pct >= 90 ? 'Near Limit' : pct >= 60 ? 'Optimal' : pct >= 30 ? 'Underused' : 'Resting';
  return (
    <div
      className="relative rounded-xl p-3 flex flex-col justify-between min-h-[80px] border"
      style={{ background: `${color}15`, borderColor: `${color}30` }}
    >
      <div
        className="absolute bottom-0 left-0 rounded-b-xl"
        style={{ width: '100%', height: `${Math.min(100, pct)}%`, background: `${color}12`, transition: 'height 0.5s ease' }}
      />
      <div className="relative z-10">
        <p className="text-slate-200 text-xs font-semibold leading-tight">{name}</p>
        <p className="text-slate-500 text-[10px]">{usage}% / {capacity}% cap</p>
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
        <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

export function SustainabilityAnalytics({ accessToken }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'grazing' | 'methane' | 'animals'>('overview');
  const [livestock, setLivestock] = useState<any[]>([]);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(r => r.json()).then(d => {
      if (d.livestock) setLivestock(d.livestock);
    }).catch(() => {});
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  const avgScore = Math.round(ANIMAL_SCORES.reduce((s, a) => s + a.score, 0) / ANIMAL_SCORES.length);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Leaf className="size-6 text-green-400" />
          Sustainability Analytics
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">Environmental intelligence — grazing, methane reduction & land efficiency</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Herd Sustainability Score', value: `${avgScore}/100`, sub: '+8 pts since Oct', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', up: true },
          { label: 'Methane Reduction', value: '−18%', sub: 'vs baseline (8 weeks)', icon: Wind, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', up: true },
          { label: 'Land Use Efficiency', value: '82%', sub: '6 of 6 zones monitored', icon: Map, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', up: true },
          { label: 'Overloaded Zones', value: '1', sub: 'Central Meadow — alert', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', up: false },
        ].map((item) => (
          <Card key={item.label} className={`bg-slate-900/70 border ${item.bg} shadow-lg`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <item.icon className={`size-5 ${item.color}`} />
                <div className={`flex items-center gap-1 text-xs ${item.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {item.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                </div>
              </div>
              <p className="text-white text-xl font-bold">{item.value}</p>
              <p className="text-slate-400 text-[11px] mt-0.5">{item.label}</p>
              <p className="text-slate-600 text-[10px]">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-1">
        {(['overview', 'grazing', 'methane', 'animals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'animals' ? 'Per Animal' : tab === 'methane' ? 'Methane' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="size-4 text-green-400" />
                  Sustainability Score — 7 Month Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={SUSTAINABILITY_TREND}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[50, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    <Area type="monotone" dataKey="score" name="Overall Score" stroke="#22c55e" strokeWidth={2.5} fill="url(#scoreGrad)" />
                    <Line type="monotone" dataKey="landUse" name="Land Use" stroke="#fb923c" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="water" name="Water Efficiency" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-sm font-semibold">Environmental Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Radar name="Herd Average" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {RADAR_DATA.map(d => (
                  <div key={d.metric} className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">{d.metric}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${d.value}%` }} />
                      </div>
                      <span className="text-slate-300 text-[10px] w-7 text-right">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'grazing' && (
        <div className="space-y-6">
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
                  <Map className="size-4 text-emerald-400" />
                  Grazing Zone Heatmap
                </CardTitle>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  {[{ color: '#6366f1', label: 'Resting' }, { color: '#84cc16', label: 'Underused' }, { color: '#22c55e', label: 'Optimal' }, { color: '#f59e0b', label: 'Near Limit' }, { color: '#ef4444', label: 'Overloaded' }].map(l => (
                    <div key={l.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                      <span>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {GRAZING_ZONES.map(zone => (
                  <HeatmapCell key={zone.name} usage={zone.usage} capacity={zone.capacity} name={zone.name} />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-sm font-semibold">Zone Usage vs Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={GRAZING_ZONES} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} width={85} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="capacity" name="Capacity" fill="#334155" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="usage" name="Current Usage" fill="#22c55e" radius={[0, 4, 4, 0]}>
                      {GRAZING_ZONES.map((zone, i) => (
                        <Cell key={i} fill={zone.usage / zone.capacity >= 1 ? '#ef4444' : zone.usage / zone.capacity >= 0.9 ? '#f59e0b' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-sm font-semibold">Zone Status Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {GRAZING_ZONES.map(zone => {
                  const pct = Math.round((zone.usage / zone.capacity) * 100);
                  const statusColor = pct >= 100 ? 'text-red-400' : pct >= 90 ? 'text-amber-400' : pct >= 30 ? 'text-emerald-400' : 'text-lime-400';
                  const statusIcon = pct >= 100 ? AlertTriangle : pct >= 90 ? AlertTriangle : CheckCircle2;
                  const StatusIcon = statusIcon;
                  return (
                    <div key={zone.name} className="flex items-center gap-3 py-1.5 border-b border-slate-800/60 last:border-0">
                      <StatusIcon className={`size-4 flex-shrink-0 ${statusColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-xs font-medium truncate">{zone.name}</p>
                        <p className="text-slate-500 text-[10px]">{zone.area} · {zone.animals} animals</p>
                      </div>
                      <span className={`text-xs font-semibold ${statusColor}`}>{pct}%</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'methane' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
                <Wind className="size-4 text-violet-400" />
                Methane Reduction — 8 Week Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={METHANE_TREND}>
                  <defs>
                    <linearGradient id="methaneGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[60, 100]} unit=" g/d" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="methane" name="Methane Output (g/day)" stroke="#a78bfa" strokeWidth={2} fill="url(#methaneGrad)" />
                  <Line type="monotone" dataKey="target" name="Target (75 g/d)" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-slate-400 text-xs mb-2">Current Average Methane Output</p>
                  <p className="text-white text-3xl font-bold">70 g<span className="text-slate-400 text-lg font-normal">/day</span></p>
                  <p className="text-emerald-400 text-sm flex items-center gap-1 mt-1">
                    <TrendingDown className="size-3" /> −18 g/day since Oct (20.5% reduction)
                  </p>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="space-y-3">
                  {[
                    { label: 'Target', value: 75, unit: 'g/day', achieved: true },
                    { label: 'Industry Average (Southern Africa)', value: 110, unit: 'g/day', achieved: false },
                    { label: 'Optimal (Best Practice)', value: 60, unit: 'g/day', achieved: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.achieved
                          ? <CheckCircle2 className="size-3.5 text-emerald-400" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                        }
                        <span className="text-slate-400 text-xs">{item.label}</span>
                      </div>
                      <span className={`text-xs font-semibold ${item.achieved ? 'text-emerald-400' : 'text-slate-400'}`}>{item.value} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-950/40 border border-emerald-500/20 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Globe className="size-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-300 font-semibold text-sm mb-1">Climate Impact</p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Your herd's methane reduction of 18% equates to approximately <span className="text-emerald-400 font-medium">2.4 tonnes CO₂ equivalent</span> saved per month. This exceeds the AgriSmart Africa 2026 voluntary reduction target of 15%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
              <CardContent className="p-4">
                <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Digestive Efficiency by Animal</p>
                <div className="space-y-2.5">
                  {ANIMAL_SCORES.map(a => (
                    <div key={a.rfid} className="flex items-center gap-3">
                      <span className="text-slate-500 text-[10px] font-mono w-14 flex-shrink-0">{a.rfid}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${a.score}%`,
                            background: a.score >= 80 ? '#22c55e' : a.score >= 65 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-slate-300 text-[10px] w-7 text-right">{a.score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'animals' && (
        <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-emerald-400" />
              Per-Animal Sustainability Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['RFID Tag', 'Breed', 'Sustainability Score', 'Methane Output', 'Grazing Behavior', 'Water Usage'].map(h => (
                      <th key={h} className="text-left text-slate-400 text-[11px] font-medium py-2.5 px-3 first:pl-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {[...ANIMAL_SCORES, ...(livestock.filter((a: any) => !ANIMAL_SCORES.find(s => s.rfid.endsWith(a.rfidTag?.slice(-4)))).slice(0, 3).map((a: any) => ({
                    rfid: a.rfidTag,
                    breed: a.breed,
                    score: Math.floor(60 + Math.random() * 30),
                    methane: 'Normal',
                    grazing: a.healthStatus === 'healthy' ? 'Good' : 'Reduced',
                    water: 'Normal'
                  })))].map((animal) => (
                    <tr key={animal.rfid} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 first:pl-0 font-mono text-xs text-slate-300">{animal.rfid}</td>
                      <td className="py-3 px-3 text-slate-300 text-xs">{animal.breed}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${animal.score}%`,
                                background: animal.score >= 80 ? '#22c55e' : animal.score >= 65 ? '#f59e0b' : '#ef4444'
                              }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${animal.score >= 80 ? 'text-emerald-400' : animal.score >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{animal.score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          animal.methane === 'Very Low' ? 'bg-emerald-500/15 text-emerald-400' :
                          animal.methane === 'Low' ? 'bg-green-500/15 text-green-400' :
                          animal.methane === 'Medium' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>{animal.methane}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] ${
                          animal.grazing === 'Optimal' ? 'text-emerald-400' :
                          animal.grazing === 'Good' ? 'text-green-400' :
                          animal.grazing === 'Reduced' ? 'text-amber-400' : 'text-red-400'
                        }`}>{animal.grazing}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{animal.water}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
