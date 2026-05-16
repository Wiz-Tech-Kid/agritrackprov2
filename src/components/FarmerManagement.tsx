import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Users, Edit, Trash2, Search, Mail, MapPin, Shield, Activity } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface FarmerManagementProps {
  accessToken: string;
}

interface Farmer {
  id: string;
  email: string;
  name: string;
  role: string;
  farmLocation?: string;
  createdAt: string;
}

export function FarmerManagement({ accessToken }: FarmerManagementProps) {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [filteredFarmers, setFilteredFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [formData, setFormData] = useState({ name: '', farmLocation: '' });

  useEffect(() => { fetchFarmers(); }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredFarmers(farmers.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.farmLocation?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredFarmers(farmers);
    }
  }, [searchTerm, farmers]);

  const fetchFarmers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/farmers`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setFarmers(data.farmers || []);
        setFilteredFarmers(data.farmers || []);
      } else if (response.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to fetch farmers');
      }
    } catch {
      toast.error('Failed to fetch farmers');
    }
    setLoading(false);
  };

  const handleEditFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarmer) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/farmers/${editingFarmer.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ name: formData.name, farmLocation: formData.farmLocation })
        }
      );
      if (response.ok) {
        toast.success('Farmer updated');
        setIsEditDialogOpen(false);
        setEditingFarmer(null);
        setFormData({ name: '', farmLocation: '' });
        fetchFarmers();
      } else {
        toast.error('Failed to update farmer');
      }
    } catch {
      toast.error('Failed to update farmer');
    }
  };

  const handleDeleteFarmer = async (farmerId: string) => {
    if (!confirm('Delete this farmer account? This action cannot be undone.')) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/farmers/${farmerId}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (response.ok) {
        toast.success('Farmer removed');
        fetchFarmers();
      } else {
        toast.error('Failed to delete farmer');
      }
    } catch {
      toast.error('Failed to delete farmer');
    }
  };

  const openEditDialog = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFormData({ name: farmer.name, farmLocation: farmer.farmLocation || '' });
    setIsEditDialogOpen(true);
  };

  const recentSignups = farmers.filter(f => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return new Date(f.createdAt) > monthAgo;
  }).length;

  const uniqueLocations = new Set(farmers.map(f => f.farmLocation).filter(Boolean)).size;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="size-6 text-purple-400" />
          Farmer Registry
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">Manage farmer accounts and platform access — Administrator only</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Registered Farmers', value: farmers.length, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'New This Month', value: recentSignups, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Farm Locations', value: uniqueLocations, icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(item => (
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

      {/* Search */}
      <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input
              placeholder="Search by name, email, or location..."
              className="pl-10 bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100 text-base font-semibold flex items-center gap-2">
            <Shield className="size-4 text-purple-400" />
            Registered Farmers ({filteredFarmers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-3">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                  <Activity className="size-8 mx-auto text-purple-400" />
                </motion.div>
                <p className="text-slate-400 text-sm">Loading farmer registry...</p>
              </div>
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="size-10 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">No farmers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Name', 'Email', 'Farm Location', 'Role', 'Joined', ''].map(h => (
                      <th key={h} className="text-left text-slate-400 text-[11px] font-medium py-3 px-4 first:pl-5 last:pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredFarmers.map((farmer, i) => (
                    <motion.tr
                      key={farmer.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 pl-5 text-slate-200 font-medium">{farmer.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Mail className="size-3" />
                          {farmer.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {farmer.farmLocation ? (
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <MapPin className="size-3" />
                            {farmer.farmLocation}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          farmer.role === 'admin'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                          {farmer.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{new Date(farmer.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 pr-5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEditDialog(farmer)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFarmer(farmer.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Farmer</DialogTitle>
            <DialogDescription className="text-slate-400">Update information for {editingFarmer?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditFarmer} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Full Name</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-slate-800/60 border-slate-600/50 text-white h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Farm Location</Label>
              <Input
                placeholder="e.g. Gaborone, Botswana"
                value={formData.farmLocation}
                onChange={e => setFormData({ ...formData, farmLocation: e.target.value })}
                className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 h-10"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => { setIsEditDialogOpen(false); setEditingFarmer(null); }} className="flex-1 text-slate-400 hover:text-white border border-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
