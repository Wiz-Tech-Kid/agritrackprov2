import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Biohazard, Thermometer, Droplets, AlertTriangle, Activity,
  CheckCircle2, XCircle, Clock, ChevronRight, Stethoscope,
  FlaskConical, Shield, AlertCircle, TrendingUp, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { projectId } from '../utils/supabase/info';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  accessToken: string;
  onViewAnimal: (id: string) => void;
}

const RISK_ANIMALS = [
  {
    id: 'risk-1', rfidTag: 'BW-RFID-0043', breed: 'Nguni', age: 36, gender: 'Female',
    riskScore: 74, healthStatus: 'sick', location: 'Isolation Block',
    temp: 39.8, pH: 5.9, conductivity: 16.2,
    symptoms: ['Fever', 'Reduced rumination', 'Low pH'],
    lastSeen: '14 min ago',
    timeline: [
      { time: '06:00', temp: 38.8, pH: 6.4, risk: 25 },
      { time: '08:00', temp: 39.0, pH: 6.2, risk: 32 },
      { time: '10:00', temp: 39.3, pH: 6.0, risk: 48 },
      { time: '12:00', temp: 39.6, pH: 5.9, risk: 62 },
      { time: '14:00', temp: 39.8, pH: 5.9, risk: 74 },
    ]
  },
  {
    id: 'risk-2', rfidTag: 'BW-RFID-0045', breed: 'Simmental', age: 48, gender: 'Female',
    riskScore: 55, healthStatus: 'treatment', location: 'Vet Bay',
    temp: 39.2, pH: 6.1, conductivity: 14.8,
    symptoms: ['Acidosis risk', 'Irregular movement'],
    lastSeen: '3 min ago',
    timeline: [
      { time: '06:00', temp: 38.5, pH: 6.6, risk: 18 },
      { time: '08:00', temp: 38.7, pH: 6.4, risk: 24 },
      { time: '10:00', temp: 38.9, pH: 6.3, risk: 35 },
      { time: '12:00', temp: 39.1, pH: 6.2, risk: 44 },
      { time: '14:00', temp: 39.2, pH: 6.1, risk: 55 },
    ]
  },
  {
    id: 'risk-3', rfidTag: 'BW-RFID-0041', breed: 'Brahman', age: 60, gender: 'Female',
    riskScore: 29, healthStatus: 'healthy', location: 'North Pasture',
    temp: 38.9, pH: 6.6, conductivity: 12.1,
    symptoms: ['Reduced grazing time'],
    lastSeen: '7 min ago',
    timeline: [
      { time: '06:00', temp: 38.4, pH: 6.8, risk: 10 },
      { time: '08:00', temp: 38.5, pH: 6.8, risk: 12 },
      { time: '10:00', temp: 38.7, pH: 6.7, risk: 18 },
      { time: '12:00', temp: 38.8, pH: 6.7, risk: 22 },
      { time: '14:00', temp: 38.9, pH: 6.6, risk: 29 },
    ]
  },
];

const RECOMMENDATIONS: Record<number, { action: string; urgency: string; icon: any; color: string }[]> = {
  74: [
    { action: 'Immediate isolation from herd — possible infectious agent detected', urgency: 'critical', icon: XCircle, color: 'text-red-400' },
    { action: 'Administer antipyretics — fever 39.8°C (threshold: 39.5°C)', urgency: 'critical', icon: Stethoscope, color: 'text-red-400' },
    { action: 'Rumen buffer supplement — pH 5.9 indicates subacute acidosis', urgency: 'high', icon: FlaskConical, color: 'text-amber-400' },
    { action: 'Notify veterinarian within 1 hour for full clinical assessment', urgency: 'high', icon: AlertCircle, color: 'text-amber-400' },
    { action: 'Increase water access — maintain minimum 40L/day', urgency: 'medium', icon: Droplets, color: 'text-emerald-400' },
  ],
  55: [
    { action: 'Monitor closely — rumen pH trending downward (6.1)', urgency: 'high', icon: TrendingUp, color: 'text-amber-400' },
    { action: 'Adjust diet: reduce high-fermentable carbohydrates', urgency: 'high', icon: FlaskConical, color: 'text-amber-400' },
    { action: 'Schedule vet check within 24 hours', urgency: 'medium', icon: Stethoscope, color: 'text-amber-400' },
    { action: 'Limit concentrate feed until pH stabilises above 6.3', urgency: 'medium', icon: AlertCircle, color: 'text-amber-400' },
  ],
  29: [
    { action: 'Continue monitoring — mild anomaly detected in grazing pattern', urgency: 'low', icon: Activity, color: 'text-slate-400' },
    { action: 'Review pasture quality in North Pasture zone', urgency: 'low', icon: Shield, color: 'text-slate-400' },
  ],
};

function RiskGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
  const label = score >= 70 ? 'Critical' : score >= 40 ? 'Elevated' : 'Low';
  return (
    <div className="relative flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 125} 125`}
        />
        <text x="50" y="48" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

function MetricBar({ label, value, min, max, unit, safeMin, safeMax }: any) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const safePctMin = Math.max(0, Math.min(100, ((safeMin - min) / (max - min)) * 100));
  const safePctMax = Math.max(0, Math.min(100, ((safeMax - min) / (max - min)) * 100));
  const inRange = value >= safeMin && value <= safeMax;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-400 text-xs">{label}</span>
        <span className={`text-sm font-semibold ${inRange ? 'text-emerald-400' : 'text-red-400'}`}>{value}{unit}</span>
      </div>
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute h-full rounded-full opacity-20"
          style={{ left: `${safePctMin}%`, width: `${safePctMax - safePctMin}%`, background: '#22c55e' }}
        />
        <div
          className="absolute w-3 h-3 rounded-full top-1/2 -translate-y-1/2 border-2 border-slate-900"
          style={{ left: `${pct}%`, transform: `translateX(-50%) translateY(-50%)`, background: inRange ? '#22c55e' : '#ef4444' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
        <span>{min}{unit}</span>
        <span className="text-slate-500">Safe: {safeMin}–{safeMax}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function DiseaseIntelligence({ accessToken, onViewAnimal }: Props) {
  const [selectedAnimal, setSelectedAnimal] = useState(RISK_ANIMALS[0]);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(r => r.json()).then(d => {
      if (d.livestock) setLivestock(d.livestock);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const recs = RECOMMENDATIONS[selectedAnimal.riskScore] || RECOMMENDATIONS[29];
  const criticalCount = RISK_ANIMALS.filter(a => a.riskScore >= 70).length;
  const elevatedCount = RISK_ANIMALS.filter(a => a.riskScore >= 40 && a.riskScore < 70).length;

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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Biohazard className="size-6 text-red-400" />
            Disease Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Real-time pathogen risk monitoring and health anomaly detection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${criticalCount > 0 ? 'bg-red-500/15 border border-red-500/25 text-red-400' : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${criticalCount > 0 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
            {criticalCount > 0 ? `${criticalCount} Critical` : 'All Clear'}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'High Risk Animals', value: criticalCount, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Elevated Risk', value: elevatedCount, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Under Observation', value: 3, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Cleared Today', value: 2, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((item) => (
          <Card key={item.label} className={`bg-slate-900/70 border ${item.bg} shadow-lg`}>
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className={`size-8 ${item.color}`} />
              <div>
                <p className="text-white text-xl font-bold">{item.value}</p>
                <p className="text-slate-400 text-xs">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Animal List */}
        <div>
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-base font-semibold">Risk-Ranked Animals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {RISK_ANIMALS.sort((a, b) => b.riskScore - a.riskScore).map((animal, i) => {
                const isSelected = selectedAnimal.id === animal.id;
                const riskColor = animal.riskScore >= 70 ? 'border-red-500/30 bg-red-500/10' : animal.riskScore >= 40 ? 'border-amber-500/30 bg-amber-500/10' : 'border-slate-700/50 bg-slate-800/40';
                const riskTextColor = animal.riskScore >= 70 ? 'text-red-400' : animal.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400';
                return (
                  <motion.button
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal)}
                    whileHover={{ x: 3 }}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/20' : riskColor}`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <p className="text-slate-200 text-sm font-semibold">{animal.breed}</p>
                        <p className="text-slate-500 text-[10px] font-mono">{animal.rfidTag}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${riskTextColor}`}>{animal.riskScore}</p>
                        <p className="text-slate-500 text-[10px]">Risk Score</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {animal.symptoms.map(s => (
                        <span key={s} className="text-[10px] bg-slate-800/60 border border-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="size-3 text-slate-500" />
                      <span className="text-slate-500 text-[10px]">{animal.lastSeen}</span>
                    </div>
                  </motion.button>
                );
              })}

              {/* Real animals from API if available */}
              {livestock.filter((a: any) => a.healthStatus === 'sick' && !RISK_ANIMALS.find(r => r.rfidTag === a.rfidTag)).slice(0, 2).map((animal: any) => (
                <button
                  key={animal.id}
                  onClick={() => onViewAnimal(animal.id)}
                  className="w-full p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-200 text-sm font-semibold">{animal.breed}</p>
                      <p className="text-slate-500 text-[10px] font-mono">{animal.rfidTag}</p>
                    </div>
                    <span className="text-red-400 text-xs font-bold">SICK</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Selected Animal Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile Header */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-xl">{selectedAnimal.breed}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      selectedAnimal.riskScore >= 70 ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                      selectedAnimal.riskScore >= 40 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    }`}>
                      {selectedAnimal.riskScore >= 70 ? 'Critical' : selectedAnimal.riskScore >= 40 ? 'Elevated' : 'Monitored'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm font-mono">{selectedAnimal.rfidTag} · {selectedAnimal.gender} · {selectedAnimal.age} months · {selectedAnimal.location}</p>
                </div>
                <RiskGauge score={selectedAnimal.riskScore} />
              </div>

              {/* Biological Metrics */}
              <div className="space-y-4">
                <MetricBar label="Rumen Temperature" value={selectedAnimal.temp} min={37} max={41} unit="°C" safeMin={38} safeMax={39.5} />
                <MetricBar label="Rumen pH" value={selectedAnimal.pH} min={5} max={8} unit="" safeMin={6.5} safeMax={7.0} />
                <MetricBar label="Conductivity" value={selectedAnimal.conductivity} min={6} max={20} unit=" mS/cm" safeMin={8} safeMax={15} />
              </div>
            </CardContent>
          </Card>

          {/* Symptom Progression Chart */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-red-400" />
                Symptom Progression — Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={selectedAnimal.timeline}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Elevated', fill: '#f59e0b', fontSize: 10 }} />
                  <Area type="monotone" dataKey="risk" name="Risk Score" stroke="#ef4444" strokeWidth={2} fill="url(#riskGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="size-4 text-emerald-400" />
                AI-Assisted Veterinary Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recs.map((rec, i) => {
                const urgencyBg: Record<string, string> = {
                  critical: 'bg-red-500/10 border-red-500/20',
                  high: 'bg-amber-500/10 border-amber-500/20',
                  medium: 'bg-amber-500/10 border-amber-500/20',
                  low: 'bg-slate-800/60 border-slate-700/30',
                };
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${urgencyBg[rec.urgency]}`}
                  >
                    <rec.icon className={`size-4 mt-0.5 flex-shrink-0 ${rec.color}`} />
                    <div className="flex-1">
                      <p className="text-slate-200 text-xs">{rec.action}</p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${rec.color} bg-slate-900/60 flex-shrink-0`}>
                      {rec.urgency}
                    </span>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
