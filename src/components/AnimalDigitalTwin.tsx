import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Thermometer, Droplets, Zap, MapPin, Activity, Heart,
  Clock, TrendingUp, TrendingDown, Leaf, Shield, AlertTriangle,
  ChevronDown, RefreshCw, Cpu
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { projectId } from '../utils/supabase/info';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  accessToken: string;
  initialAnimalId?: string;
}

const DEMO_ANIMALS = [
  {
    id: 'twin-1', rfidTag: 'BW-RFID-0041', breed: 'Brahman', age: 60, gender: 'Female',
    weight: 485, healthStatus: 'healthy', location: { name: 'North Pasture', lat: -24.628, lng: 25.923 },
    owner: 'Kgomotso Sithole',
    temp: 38.6, pH: 6.8, conductivity: 12.4, heartRate: 68, rumination: 7.2,
    riskScore: 12, sustainabilityScore: 82, digestiveEfficiency: 88,
    lastSeen: '3 min ago',
    history: [
      { day: 'Mon', temp: 38.4, pH: 6.9, risk: 10, grazing: 7.1 },
      { day: 'Tue', temp: 38.5, pH: 6.8, risk: 11, grazing: 7.3 },
      { day: 'Wed', temp: 38.7, pH: 6.7, risk: 15, grazing: 6.9 },
      { day: 'Thu', temp: 38.6, pH: 6.8, risk: 13, grazing: 7.4 },
      { day: 'Fri', temp: 38.5, pH: 6.9, risk: 11, grazing: 7.2 },
      { day: 'Sat', temp: 38.6, pH: 6.8, risk: 12, grazing: 7.1 },
      { day: 'Sun', temp: 38.6, pH: 6.8, risk: 12, grazing: 7.2 },
    ],
    radar: [
      { metric: 'Health', value: 88 },
      { metric: 'Activity', value: 75 },
      { metric: 'Digestion', value: 88 },
      { metric: 'Nutrition', value: 82 },
      { metric: 'Mobility', value: 90 },
      { metric: 'Stress', value: 78 },
    ],
    movements: [
      { time: '06:00', zone: 'North Pasture', activity: 'Grazing' },
      { time: '09:30', zone: 'Water Trough A', activity: 'Drinking' },
      { time: '11:15', zone: 'North Pasture', activity: 'Rumination' },
      { time: '13:00', zone: 'Shade Area', activity: 'Resting' },
      { time: '15:30', zone: 'North Pasture', activity: 'Grazing' },
      { time: '17:45', zone: 'Water Trough A', activity: 'Drinking' },
    ]
  },
  {
    id: 'twin-2', rfidTag: 'BW-RFID-0043', breed: 'Nguni', age: 36, gender: 'Female',
    weight: 342, healthStatus: 'sick', location: { name: 'Isolation Block', lat: -24.631, lng: 25.918 },
    owner: 'Thabo Mosweu',
    temp: 39.8, pH: 5.9, conductivity: 16.2, heartRate: 84, rumination: 4.1,
    riskScore: 74, sustainabilityScore: 55, digestiveEfficiency: 48,
    lastSeen: '14 min ago',
    history: [
      { day: 'Mon', temp: 38.7, pH: 6.5, risk: 22, grazing: 6.8 },
      { day: 'Tue', temp: 38.9, pH: 6.4, risk: 28, grazing: 6.2 },
      { day: 'Wed', temp: 39.1, pH: 6.2, risk: 38, grazing: 5.5 },
      { day: 'Thu', temp: 39.3, pH: 6.1, risk: 48, grazing: 4.8 },
      { day: 'Fri', temp: 39.5, pH: 6.0, risk: 58, grazing: 4.3 },
      { day: 'Sat', temp: 39.7, pH: 5.9, risk: 68, grazing: 4.1 },
      { day: 'Sun', temp: 39.8, pH: 5.9, risk: 74, grazing: 3.8 },
    ],
    radar: [
      { metric: 'Health', value: 32 },
      { metric: 'Activity', value: 42 },
      { metric: 'Digestion', value: 28 },
      { metric: 'Nutrition', value: 45 },
      { metric: 'Mobility', value: 55 },
      { metric: 'Stress', value: 35 },
    ],
    movements: [
      { time: '06:00', zone: 'Isolation Block', activity: 'Resting' },
      { time: '09:00', zone: 'Isolation Block', activity: 'Resting' },
      { time: '12:00', zone: 'Isolation Block', activity: 'Feeding (assisted)' },
      { time: '15:00', zone: 'Isolation Block', activity: 'Resting' },
    ]
  },
  {
    id: 'twin-3', rfidTag: 'BW-RFID-0045', breed: 'Simmental', age: 48, gender: 'Female',
    weight: 520, healthStatus: 'treatment', location: { name: 'Vet Bay', lat: -24.625, lng: 25.927 },
    owner: 'Kefilwe Mthombeni',
    temp: 39.2, pH: 6.1, conductivity: 14.8, heartRate: 76, rumination: 5.8,
    riskScore: 55, sustainabilityScore: 65, digestiveEfficiency: 62,
    lastSeen: '3 min ago',
    history: [
      { day: 'Mon', temp: 38.5, pH: 6.7, risk: 18, grazing: 7.0 },
      { day: 'Tue', temp: 38.7, pH: 6.5, risk: 24, grazing: 6.5 },
      { day: 'Wed', temp: 38.9, pH: 6.4, risk: 32, grazing: 6.1 },
      { day: 'Thu', temp: 39.0, pH: 6.3, risk: 40, grazing: 5.8 },
      { day: 'Fri', temp: 39.1, pH: 6.2, risk: 48, grazing: 5.5 },
      { day: 'Sat', temp: 39.2, pH: 6.1, risk: 52, grazing: 5.2 },
      { day: 'Sun', temp: 39.2, pH: 6.1, risk: 55, grazing: 5.0 },
    ],
    radar: [
      { metric: 'Health', value: 55 },
      { metric: 'Activity', value: 62 },
      { metric: 'Digestion', value: 52 },
      { metric: 'Nutrition', value: 65 },
      { metric: 'Mobility', value: 70 },
      { metric: 'Stress', value: 58 },
    ],
    movements: [
      { time: '06:00', zone: 'Vet Bay', activity: 'Resting' },
      { time: '09:00', zone: 'Vet Bay', activity: 'Feeding' },
      { time: '12:00', zone: 'Vet Bay', activity: 'Treatment' },
      { time: '15:00', zone: 'Vet Bay', activity: 'Resting' },
      { time: '17:00', zone: 'Vet Bay', activity: 'Feeding' },
    ]
  },
];

function BiologicalBody({ animal }: { animal: typeof DEMO_ANIMALS[0] }) {
  const statusColor = animal.healthStatus === 'healthy' ? '#22c55e' : animal.healthStatus === 'sick' ? '#ef4444' : '#f59e0b';
  const tempOk = animal.temp >= 38.0 && animal.temp <= 39.5;
  const pHOk = animal.pH >= 6.5 && animal.pH <= 7.0;

  return (
    <div className="relative flex items-center justify-center py-4">
      <svg viewBox="0 0 200 260" width="160" height="200" className="drop-shadow-lg">
        {/* Body outline - simplified cow silhouette */}
        <ellipse cx="100" cy="140" rx="65" ry="45" fill="#1e293b" stroke={statusColor} strokeWidth="2" opacity="0.9" />
        {/* Head */}
        <ellipse cx="160" cy="120" rx="25" ry="20" fill="#1e293b" stroke={statusColor} strokeWidth="2" opacity="0.9" />
        {/* Snout */}
        <ellipse cx="178" cy="128" rx="10" ry="7" fill="#0f172a" stroke={statusColor} strokeWidth="1.5" opacity="0.8" />
        {/* Legs */}
        {[[75, 180, 75, 230], [95, 180, 95, 230], [115, 180, 115, 230], [135, 180, 135, 228]].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={statusColor} strokeWidth="8" strokeLinecap="round" opacity="0.7" />
        ))}
        {/* Tail */}
        <path d="M 38 138 Q 20 130 22 148 Q 24 162 35 158" fill="none" stroke={statusColor} strokeWidth="4" strokeLinecap="round" opacity="0.7" />

        {/* Rumen indicator */}
        <ellipse cx="90" cy="145" rx="22" ry="18" fill={pHOk ? '#22c55e22' : '#ef444422'} stroke={pHOk ? '#22c55e' : '#ef4444'} strokeWidth="1.5" strokeDasharray="4 2">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <text x="90" y="149" textAnchor="middle" fill={pHOk ? '#22c55e' : '#ef4444'} fontSize="8" fontWeight="bold">pH {animal.pH}</text>

        {/* Heart/temp indicator */}
        <circle cx="115" cy="130" r="12" fill={tempOk ? '#22c55e22' : '#ef444422'} stroke={tempOk ? '#22c55e' : '#ef4444'} strokeWidth="1.5">
          <animate attributeName="r" values="10;13;10" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <text x="115" y="134" textAnchor="middle" fill={tempOk ? '#22c55e' : '#ef4444'} fontSize="7" fontWeight="bold">{animal.temp}°</text>

        {/* Sensor dot on ear */}
        <circle cx="148" cy="108" r="5" fill="#f59e0b" opacity="0.9">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {/* Status indicator */}
        <circle cx="100" cy="95" r="6" fill={statusColor} opacity="0.9">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Floating labels */}
      <div className="absolute top-2 right-0 text-right space-y-1">
        <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
          Bolus sensor active
        </div>
        <div className={`text-[10px] ${tempOk ? 'text-emerald-400' : 'text-red-400'} bg-slate-900/80 border border-slate-700/50 px-2 py-0.5 rounded-lg`}>
          {tempOk ? 'Temp normal' : 'Fever detected'}
        </div>
        <div className={`text-[10px] ${pHOk ? 'text-emerald-400' : 'text-red-400'} bg-slate-900/80 border border-slate-700/50 px-2 py-0.5 rounded-lg`}>
          {pHOk ? 'pH optimal' : 'Acidosis risk'}
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="70" height="70">
          <circle cx="35" cy="35" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
          <circle
            cx="35" cy="35" r={r} fill="none" stroke={color}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${c}`} strokeDashoffset={offset}
            transform="rotate(-90 35 35)"
          />
          <text x="35" y="40" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{value}</text>
        </svg>
      </div>
      <p className="text-slate-400 text-[10px] text-center leading-tight">{label}</p>
    </div>
  );
}

export function AnimalDigitalTwin({ accessToken, initialAnimalId }: Props) {
  const [selectedId, setSelectedId] = useState(initialAnimalId || DEMO_ANIMALS[0].id);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(r => r.json()).then(d => {
      if (d.livestock?.length) setLivestock(d.livestock);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialAnimalId) setSelectedId(initialAnimalId);
  }, [initialAnimalId]);

  const realAnimal = livestock.find((a: any) => a.id === selectedId);
  const demoAnimal = DEMO_ANIMALS.find(a => a.id === selectedId) || DEMO_ANIMALS[0];
  const animal = realAnimal ? {
    ...demoAnimal,
    id: realAnimal.id,
    rfidTag: realAnimal.rfidTag,
    breed: realAnimal.breed,
    age: realAnimal.age,
    gender: realAnimal.gender || 'Female',
    weight: realAnimal.weight || demoAnimal.weight,
    healthStatus: realAnimal.healthStatus,
    location: realAnimal.location || demoAnimal.location,
  } : demoAnimal;

  const allAnimals = [...DEMO_ANIMALS, ...livestock.filter((a: any) => !DEMO_ANIMALS.find(d => d.rfidTag === a.rfidTag)).map((a: any) => ({ ...DEMO_ANIMALS[0], id: a.id, rfidTag: a.rfidTag, breed: a.breed }))];

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

  const statusColors: Record<string, string> = {
    healthy: 'text-emerald-400',
    sick: 'text-red-400',
    treatment: 'text-amber-400',
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="size-6 text-amber-400" />
            Animal Digital Twin
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Live intelligent profile — sensor-driven biological state</p>
        </div>

        {/* Animal Selector */}
        <div className="relative">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 hover:border-emerald-500/30 transition-all"
          >
            <span className="font-mono text-emerald-400">{animal.rfidTag}</span>
            <span className="text-slate-400">— {animal.breed}</span>
            <ChevronDown className="size-4 text-slate-400" />
          </button>
          <AnimatePresence>
            {selectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {allAnimals.slice(0, 6).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedId(a.id); setSelectorOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${selectedId === a.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300'}`}
                  >
                    <div className="text-left">
                      <p className="font-mono text-xs">{a.rfidTag}</p>
                      <p className="text-slate-400 text-xs">{a.breed}</p>
                    </div>
                    <span className={`text-xs font-medium capitalize ${statusColors[a.healthStatus] || 'text-slate-400'}`}>
                      {a.healthStatus}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Visual + ID */}
        <div className="space-y-4">
          {/* Digital Twin Visual */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100 text-sm font-semibold">Biological Model</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${animal.healthStatus === 'healthy' ? 'bg-emerald-400' : animal.healthStatus === 'sick' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <span className={`text-xs font-medium capitalize ${statusColors[animal.healthStatus] || 'text-slate-400'}`}>{animal.healthStatus}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <BiologicalBody animal={animal} />
            </CardContent>
          </Card>

          {/* ID Card */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardContent className="p-4 space-y-2.5">
              <h3 className="text-white font-bold text-base">{animal.breed}</h3>
              {[
                { label: 'RFID Tag', value: animal.rfidTag },
                { label: 'Age', value: `${animal.age} months (${Math.floor(animal.age / 12)}y ${animal.age % 12}m)` },
                { label: 'Gender', value: animal.gender },
                { label: 'Weight', value: `${animal.weight} kg` },
                { label: 'Owner', value: animal.owner || 'On file' },
                { label: 'Zone', value: animal.location?.name || 'Unknown' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">{label}</span>
                  <span className="text-slate-200 text-xs font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Score Rings */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Performance Scores</p>
              <div className="grid grid-cols-3 gap-2">
                <ScoreRing value={100 - animal.riskScore} label="Health Index" color={animal.riskScore < 30 ? '#22c55e' : animal.riskScore < 60 ? '#f59e0b' : '#ef4444'} />
                <ScoreRing value={animal.sustainabilityScore} label="Sustainability" color="#22c55e" />
                <ScoreRing value={animal.digestiveEfficiency} label="Digestion" color="#f59e0b" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: Real-time Metrics + Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Sensor Readings */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Rumen Temp', value: `${animal.temp}°C`, status: animal.temp >= 38 && animal.temp <= 39.5 ? 'ok' : 'warn', icon: Thermometer, ref: '38–39.5°C' },
              { label: 'Rumen pH', value: animal.pH.toString(), status: animal.pH >= 6.5 && animal.pH <= 7.0 ? 'ok' : 'warn', icon: Droplets, ref: '6.5–7.0' },
              { label: 'Conductivity', value: `${animal.conductivity} mS`, status: animal.conductivity >= 8 && animal.conductivity <= 15 ? 'ok' : 'warn', icon: Zap, ref: '8–15 mS/cm' },
              { label: 'Heart Rate', value: `${animal.heartRate} bpm`, status: animal.heartRate >= 60 && animal.heartRate <= 80 ? 'ok' : 'warn', icon: Heart, ref: '60–80 bpm' },
            ].map((metric) => {
              const isOk = metric.status === 'ok';
              return (
                <Card key={metric.label} className={`bg-slate-900/70 border shadow-lg ${isOk ? 'border-slate-700/50' : 'border-amber-500/30'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <metric.icon className={`size-3.5 ${isOk ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span className="text-slate-400 text-[10px]">{metric.label}</span>
                    </div>
                    <p className={`text-xl font-bold ${isOk ? 'text-white' : 'text-amber-400'}`}>{metric.value}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">Normal: {metric.ref}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Health Trend */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" />
                7-Day Health Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={animal.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11 }} domain={[37, 41]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line yAxisId="left" type="monotone" dataKey="temp" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="risk" name="Risk Score" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                  <Line yAxisId="left" type="monotone" dataKey="pH" name="pH" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-sm font-semibold">Wellness Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={animal.radar}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar name="Score" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-emerald-400" />
                  Movement Log — Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {animal.movements.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${i === 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      {i < animal.movements.length - 1 && <div className="w-px h-5 bg-slate-700 mt-0.5" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-300 text-xs font-medium">{m.activity}</p>
                        <span className="text-slate-500 text-[10px] font-mono">{m.time}</span>
                      </div>
                      <p className="text-slate-500 text-[10px]">{m.zone}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Risk Prediction */}
          <Card className={`backdrop-blur-sm border shadow-lg ${animal.riskScore >= 60 ? 'bg-red-950/30 border-red-500/25' : animal.riskScore >= 30 ? 'bg-amber-950/30 border-amber-500/25' : 'bg-slate-900/70 border-emerald-500/20'}`}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${animal.riskScore >= 60 ? 'bg-red-500/20' : animal.riskScore >= 30 ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                {animal.riskScore >= 60 ? <AlertTriangle className="size-6 text-red-400" /> : animal.riskScore >= 30 ? <Shield className="size-6 text-amber-400" /> : <Shield className="size-6 text-emerald-400" />}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm mb-0.5">Risk Prediction — Next 24h</p>
                <p className={`text-sm ${animal.riskScore >= 60 ? 'text-red-400' : animal.riskScore >= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {animal.riskScore >= 60
                    ? 'High probability of condition worsening — immediate vet intervention recommended'
                    : animal.riskScore >= 30
                    ? 'Moderate risk trend detected — schedule examination within 48 hours'
                    : 'Animal is stable. Continue standard monitoring protocol.'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${animal.riskScore >= 60 ? 'bg-red-500' : animal.riskScore >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${animal.riskScore}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-xs">{animal.riskScore}/100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
