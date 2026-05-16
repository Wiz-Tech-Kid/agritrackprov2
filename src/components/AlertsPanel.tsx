import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertTriangle, CheckCircle, Filter, Bell, XCircle, Stethoscope,
  Biohazard, Activity, MapPin, Clock, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface AlertsPanelProps {
  accessToken: string;
}

interface Alert {
  id: string;
  animalId: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

const AI_RECS: Record<string, string[]> = {
  health: ['Perform clinical examination and record temperature', 'Check RFID sensor for accuracy', 'Consider diagnostic blood panel'],
  movement: ['Review GPS log for the past 24 hours', 'Inspect fencing integrity in relevant zone', 'Check for predator activity or water source issues'],
  location: ['Confirm GPS coordinates against field survey', 'Check for signal interference from new infrastructure', 'Notify field team to verify position physically'],
  default: ['Document the alert in the health log', 'Schedule follow-up monitoring within 48 hours', 'Consult with veterinary officer if symptoms persist'],
};

const SEVERITY_CONFIG: Record<string, { label: string; cardBg: string; cardBorder: string; badgeBg: string; badgeText: string; dotColor: string; icon: any }> = {
  high: {
    label: 'HIGH', cardBg: 'bg-red-950/30', cardBorder: 'border-red-500/25',
    badgeBg: 'bg-red-500/15', badgeText: 'text-red-400', dotColor: 'bg-red-400', icon: XCircle
  },
  medium: {
    label: 'MED', cardBg: 'bg-amber-950/20', cardBorder: 'border-amber-500/20',
    badgeBg: 'bg-amber-500/15', badgeText: 'text-amber-400', dotColor: 'bg-amber-400', icon: AlertTriangle
  },
  low: {
    label: 'LOW', cardBg: 'bg-slate-900/50', cardBorder: 'border-slate-700/40',
    badgeBg: 'bg-amber-500/15', badgeText: 'text-amber-400', dotColor: 'bg-amber-400', icon: Bell
  },
};

const TYPE_ICONS: Record<string, any> = {
  health: Biohazard,
  movement: MapPin,
  location: MapPin,
  digestive: Activity,
  default: Bell,
};

function AlertRec({ type }: { type: string }) {
  const recs = AI_RECS[type] || AI_RECS.default;
  return (
    <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1.5">
      <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1">
        <Stethoscope className="size-3" /> AI Recommendation
      </p>
      {recs.map((r, i) => (
        <div key={i} className="flex items-start gap-2">
          <ChevronRight className="size-3 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-400 text-xs">{r}</p>
        </div>
      ))}
    </div>
  );
}

export function AlertsPanel({ accessToken }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { applyFilters(); }, [alerts, filterStatus, filterSeverity]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/alerts`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      if (response.ok) setAlerts(data.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...alerts];
    if (filterStatus !== 'all') filtered = filtered.filter(a => a.status === filterStatus);
    if (filterSeverity !== 'all') filtered = filtered.filter(a => a.severity === filterSeverity);
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFilteredAlerts(filtered);
  };

  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/alerts/${alertId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ status: 'resolved' })
        }
      );
      if (response.ok) {
        toast.success('Alert resolved');
        fetchAlerts();
      } else {
        toast.error('Failed to resolve alert');
      }
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const highPriority = activeAlerts.filter(a => a.severity === 'high');
  const resolvedToday = alerts.filter(a => a.resolvedAt && new Date(a.resolvedAt).toDateString() === new Date().toDateString());

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="size-6 text-amber-400" />
            Alert Center
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Real-time livestock health & behavioral alerts</p>
        </div>
        <button onClick={fetchAlerts} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="size-4" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Alerts', value: activeAlerts.length, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'High Priority', value: highPriority.length, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Resolved Today', value: resolvedToday.length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Total Logged', value: alerts.length, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map((item) => (
          <Card key={item.label} className={`bg-slate-900/70 border ${item.bg} shadow-lg`}>
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className={`size-7 ${item.color}`} />
              <div>
                <p className="text-white text-xl font-bold">{item.value}</p>
                <p className="text-slate-400 text-xs">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Filter className="size-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 bg-slate-800/60 border-slate-600/50 text-slate-200 h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-slate-200">All Status</SelectItem>
                <SelectItem value="active" className="text-slate-200">Active</SelectItem>
                <SelectItem value="resolved" className="text-slate-200">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-36 bg-slate-800/60 border-slate-600/50 text-slate-200 h-9 text-sm">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-slate-200">All Severity</SelectItem>
                <SelectItem value="high" className="text-slate-200">High</SelectItem>
                <SelectItem value="medium" className="text-slate-200">Medium</SelectItem>
                <SelectItem value="low" className="text-slate-200">Low</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-slate-500 text-sm ml-auto">{filteredAlerts.length} alerts</span>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                <Activity className="size-8 mx-auto text-emerald-400" />
              </motion.div>
              <p className="text-slate-400 text-sm">Loading alerts...</p>
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card className="bg-slate-900/70 border-slate-700/50 shadow-lg">
            <CardContent className="py-16 text-center">
              <CheckCircle className="size-12 mx-auto mb-4 text-emerald-500 opacity-60" />
              <p className="text-slate-300 font-medium mb-1">
                {filterStatus === 'all' && filterSeverity === 'all' ? 'No alerts found' : 'No matching alerts'}
              </p>
              <p className="text-slate-500 text-sm">
                {filterStatus === 'all' && filterSeverity === 'all' ? 'All monitored animals are stable.' : 'Try adjusting your filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredAlerts.map((alert, i) => {
              const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
              const SeverityIcon = config.icon;
              const TypeIcon = TYPE_ICONS[alert.type] || TYPE_ICONS.default;
              const isExpanded = expandedId === alert.id;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className={`backdrop-blur-sm border shadow-lg transition-all ${config.cardBg} ${config.cardBorder}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Severity Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.badgeBg}`}>
                          <SeverityIcon className={`size-4 ${config.badgeText}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1.5">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-slate-100 font-semibold text-sm">{alert.message}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText} border ${config.cardBorder}`}>
                                  {config.label}
                                </span>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${alert.status === 'active' ? 'bg-red-500/15 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                                  {alert.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                                  <TypeIcon className="size-3" />
                                  <span className="capitalize">{alert.type}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                                  <Clock className="size-3" />
                                  <span>{new Date(alert.createdAt).toLocaleString()}</span>
                                </div>
                              </div>
                              <p className="text-slate-600 text-[11px] font-mono mt-1">ID: {alert.animalId.slice(0, 16)}...</p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                                className="text-slate-500 hover:text-emerald-400 text-xs transition-colors"
                              >
                                {isExpanded ? 'Hide rec.' : 'AI rec.'}
                              </button>
                              {alert.status === 'active' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleResolve(alert.id)}
                                  className="h-8 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs"
                                >
                                  <CheckCircle className="size-3 mr-1" />
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </div>

                          {alert.resolvedAt && (
                            <p className="text-slate-600 text-[11px] mt-1">
                              Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                            </p>
                          )}

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <AlertRec type={alert.type} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
