import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Beef, AlertTriangle, Activity, Users, TrendingUp, Heart } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { motion } from 'motion/react';

interface DashboardProps {
  accessToken: string;
  userRole: string;
}

interface Stats {
  totalLivestock: number;
  activeAlerts: number;
  healthyAnimals: number;
  totalFarmers: number;
}

interface Livestock {
  id: string;
  rfidTag: string;
  breed: string;
  age: number;
  healthStatus: string;
  location?: { lat: number; lng: number };
}

interface Alert {
  id: string;
  animalId: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
}

export function Dashboard({ accessToken, userRole }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalLivestock: 0,
    activeAlerts: 0,
    healthyAnimals: 0,
    totalFarmers: 0
  });
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/stats`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const statsData = await statsRes.json();
      if (!statsRes.ok) {
        console.error('Error fetching stats:', statsData.error);
      } else {
        setStats(statsData);
      }

      const livestockRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const livestockData = await livestockRes.json();
      if (!livestockRes.ok) {
        console.error('Error fetching livestock:', livestockData.error);
      } else {
        setLivestock(livestockData.livestock || []);
      }

      const alertsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/alerts`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const alertsData = await alertsRes.json();
      if (!alertsRes.ok) {
        console.error('Error fetching alerts:', alertsData.error);
      } else {
        setAlerts(alertsData.alerts || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const breedData = livestock.reduce((acc: any[], animal) => {
    const existing = acc.find(item => item.breed === animal.breed);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ breed: animal.breed || 'Unknown', count: 1 });
    }
    return acc;
  }, []);

  const healthData = [
    { name: 'Healthy', value: livestock.filter(a => a.healthStatus === 'healthy').length },
    { name: 'Sick', value: livestock.filter(a => a.healthStatus === 'sick').length },
    { name: 'Under Treatment', value: livestock.filter(a => a.healthStatus === 'treatment').length },
  ].filter(d => d.value > 0);

  const alertTrendData = alerts
    .reduce((acc: any[], alert) => {
      const date = new Date(alert.createdAt).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.alerts++;
      } else {
        acc.push({ date, alerts: 1 });
      }
      return acc;
    }, [])
    .slice(-7);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Activity className="size-12 mx-auto mb-4 text-green-400" />
          </motion.div>
          <p className="text-white">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Livestock",
      value: stats.totalLivestock,
      subtitle: `${stats.healthyAnimals} healthy animals`,
      icon: Beef,
      color: "from-emerald-500 to-green-600",
      iconBg: "bg-emerald-500/20"
    },
    {
      title: "Active Alerts",
      value: stats.activeAlerts,
      subtitle: "Requires attention",
      icon: AlertTriangle,
      color: "from-orange-500 to-red-600",
      iconBg: "bg-orange-500/20"
    },
    {
      title: "Health Rate",
      value: `${stats.totalLivestock > 0 ? Math.round((stats.healthyAnimals / stats.totalLivestock) * 100) : 0}%`,
      subtitle: "Animals in good health",
      icon: Heart,
      color: "from-pink-500 to-rose-600",
      iconBg: "bg-pink-500/20"
    },
  ];

  if (userRole === 'admin') {
    statCards.push({
      title: "Total Farmers",
      value: stats.totalFarmers,
      subtitle: "Registered users",
      icon: Users,
      color: "from-violet-500 to-indigo-600",
      iconBg: "bg-violet-500/20"
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl text-white mb-2">
          {userRole === 'farmer' ? 'FARMER DASHBOARD' : 'Dashboard Overview'}
        </h2>
        {userRole !== 'farmer' && (
          <p className="text-green-200">
            Real-time monitoring and analytics for your livestock
          </p>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-green-200 mb-1">{stat.title}</p>
                      <motion.h3 
                        className="text-3xl text-white mb-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                      >
                        {stat.value}
                      </motion.h3>
                      <p className="text-xs text-green-300">{stat.subtitle}</p>
                    </div>
                    <motion.div 
                      className={`${stat.iconBg} p-3 rounded-xl`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Icon className="size-6 text-white" />
                    </motion.div>
                  </div>
                  <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-full`} />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breed Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Beef className="size-5" />
                Livestock by Breed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={breedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="breed" stroke="#ffffff" />
                    <YAxis stroke="#ffffff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorBreed)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorBreed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-green-200">
                  No livestock data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Health Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="size-5" />
                Health Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {healthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-green-200">
                  No health data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Alert Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{ scale: 1.01 }}
          className="lg:col-span-2"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="size-5" />
                Alert Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={alertTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#ffffff" />
                    <YAxis stroke="#ffffff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="alerts" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-green-200">
                  No alert data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.01 }}
                    className={`p-4 rounded-xl border backdrop-blur-lg ${
                      alert.severity === 'high'
                        ? 'bg-red-500/20 border-red-500/30'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-500/20 border-yellow-500/30'
                        : 'bg-violet-500/20 border-violet-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{alert.message}</p>
                        <p className="text-sm text-green-200 mt-1">
                          {alert.type} • {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          alert.status === 'active'
                            ? 'bg-red-500/30 text-red-200'
                            : 'bg-green-500/30 text-green-200'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-green-200">
                No alerts to display
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}