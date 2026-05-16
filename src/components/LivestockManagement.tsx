import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  Beef, Plus, Edit, Trash2, Search, MapPin, Weight,
  Calendar, Tag, Filter, ChevronDown, Activity
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { SampleDataLoader } from './SampleDataLoader';
import { motion, AnimatePresence } from 'motion/react';

interface LivestockManagementProps {
  accessToken: string;
}

interface Animal {
  id: string;
  rfidTag: string;
  breed: string;
  age: number;
  healthStatus: string;
  weight?: number;
  gender?: string;
  location?: { lat: number; lng: number; name?: string };
  lastSeen?: string;
  createdAt: string;
}

const HEALTH_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  healthy: { label: 'Healthy', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  sick: { label: 'Sick', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  treatment: { label: 'Under Treatment', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-300 text-sm">{label}</Label>
      {children}
    </div>
  );
}

export function LivestockManagement({ accessToken }: LivestockManagementProps) {
  const [livestock, setLivestock] = useState<Animal[]>([]);
  const [filteredLivestock, setFilteredLivestock] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [formData, setFormData] = useState({
    rfidTag: '', breed: '', age: '', healthStatus: 'healthy',
    weight: '', gender: 'female', locationName: ''
  });

  useEffect(() => { fetchLivestock(); }, []);

  useEffect(() => {
    let filtered = [...livestock];
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.rfidTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.breed.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.healthStatus === filterStatus);
    }
    setFilteredLivestock(filtered);
  }, [searchTerm, livestock, filterStatus]);

  const fetchLivestock = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setLivestock(data.livestock || []);
        setFilteredLivestock(data.livestock || []);
      }
    } catch (e) {
      toast.error('Failed to fetch livestock');
    }
    setLoading(false);
  };

  const handleAddAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({
            rfidTag: formData.rfidTag, breed: formData.breed,
            age: parseInt(formData.age), healthStatus: formData.healthStatus,
            weight: formData.weight ? parseFloat(formData.weight) : undefined,
            gender: formData.gender,
            location: formData.locationName ? { name: formData.locationName, lat: -24.628, lng: 25.923 } : undefined,
            lastSeen: new Date().toISOString()
          })
        }
      );
      const result = await response.json();
      if (response.ok) {
        toast.success('Animal registered successfully');
        setIsAddDialogOpen(false);
        resetForm();
        fetchLivestock();
      } else {
        toast.error(result.error || 'Failed to add animal');
      }
    } catch {
      toast.error('Failed to add animal');
    }
  };

  const handleEditAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnimal) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock/${editingAnimal.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({
            rfidTag: formData.rfidTag, breed: formData.breed,
            age: parseInt(formData.age), healthStatus: formData.healthStatus,
            weight: formData.weight ? parseFloat(formData.weight) : undefined,
            gender: formData.gender,
            location: formData.locationName
              ? { name: formData.locationName, lat: editingAnimal.location?.lat || -24.628, lng: editingAnimal.location?.lng || 25.923 }
              : editingAnimal.location
          })
        }
      );
      if (response.ok) {
        toast.success('Animal updated');
        setIsEditDialogOpen(false);
        setEditingAnimal(null);
        resetForm();
        fetchLivestock();
      } else {
        toast.error('Failed to update animal');
      }
    } catch {
      toast.error('Failed to update animal');
    }
  };

  const handleDeleteAnimal = async (animalId: string) => {
    if (!confirm('Delete this animal record?')) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock/${animalId}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (response.ok) {
        toast.success('Animal removed');
        fetchLivestock();
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEditDialog = (animal: Animal) => {
    setEditingAnimal(animal);
    setFormData({
      rfidTag: animal.rfidTag, breed: animal.breed,
      age: animal.age.toString(), healthStatus: animal.healthStatus,
      weight: animal.weight?.toString() || '', gender: animal.gender || 'female',
      locationName: animal.location?.name || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => setFormData({ rfidTag: '', breed: '', age: '', healthStatus: 'healthy', weight: '', gender: 'female', locationName: '' });

  const inputClass = "bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 h-10";
  const selectContentClass = "bg-slate-800 border-slate-700";
  const selectItemClass = "text-slate-200 focus:bg-slate-700 focus:text-white";

  const AnimalForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="RFID Tag *">
        <Input placeholder="BW-RFID-XXXX" value={formData.rfidTag} onChange={e => setFormData({ ...formData, rfidTag: e.target.value })} required className={inputClass} />
      </FormField>
      <FormField label="Breed *">
        <Input placeholder="e.g. Brahman, Tuli, Nguni" value={formData.breed} onChange={e => setFormData({ ...formData, breed: e.target.value })} required className={inputClass} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Age (months) *">
          <Input type="number" min="0" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} required className={inputClass} />
        </FormField>
        <FormField label="Weight (kg)">
          <Input type="number" min="0" step="0.1" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} className={inputClass} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Gender">
          <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
            <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="female" className={selectItemClass}>Female</SelectItem>
              <SelectItem value="male" className={selectItemClass}>Male</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Health Status">
          <Select value={formData.healthStatus} onValueChange={v => setFormData({ ...formData, healthStatus: v })}>
            <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="healthy" className={selectItemClass}>Healthy</SelectItem>
              <SelectItem value="sick" className={selectItemClass}>Sick</SelectItem>
              <SelectItem value="treatment" className={selectItemClass}>Under Treatment</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <FormField label="Grazing Zone / Location">
        <Input placeholder="e.g. North Pasture" value={formData.locationName} onChange={e => setFormData({ ...formData, locationName: e.target.value })} className={inputClass} />
      </FormField>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }} className="flex-1 text-slate-400 hover:text-white border border-slate-700">Cancel</Button>
        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">{submitLabel}</Button>
      </div>
    </form>
  );

  const healthCounts = {
    all: livestock.length,
    healthy: livestock.filter(a => a.healthStatus === 'healthy').length,
    sick: livestock.filter(a => a.healthStatus === 'sick').length,
    treatment: livestock.filter(a => a.healthStatus === 'treatment').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Beef className="size-6 text-emerald-400" />
            Herd Registry
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage and monitor all registered livestock</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white h-10">
              <Plus className="size-4 mr-2" />
              Register Animal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Register New Animal</DialogTitle>
              <DialogDescription className="text-slate-400">Add a new animal to the herd registry</DialogDescription>
            </DialogHeader>
            <AnimalForm onSubmit={handleAddAnimal} submitLabel="Register Animal" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Herd', count: healthCounts.all, key: 'all', color: 'text-slate-200', bg: 'bg-slate-800/60 border-slate-700/50' },
          { label: 'Healthy', count: healthCounts.healthy, key: 'healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Sick', count: healthCounts.sick, key: 'sick', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Under Treatment', count: healthCounts.treatment, key: 'treatment', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(item.key)}
            className={`p-3 rounded-xl border text-left transition-all ${item.bg} ${filterStatus === item.key ? 'ring-1 ring-emerald-500/30' : 'hover:border-slate-600'}`}
          >
            <p className={`text-xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-slate-500 text-xs">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                placeholder="Search by RFID tag or breed..."
                className="pl-10 bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-500 h-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 border border-slate-700/50">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>Grid</button>
              <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>Table</button>
            </div>
            <span className="text-slate-500 text-sm">{filteredLivestock.length} animals</span>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data Loader */}
      {!loading && livestock.length === 0 && (
        <SampleDataLoader accessToken={accessToken} onDataLoaded={fetchLivestock} />
      )}

      {/* Animals Display */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Activity className="size-8 mx-auto text-emerald-400" />
            </motion.div>
            <p className="text-slate-400 text-sm">Loading herd registry...</p>
          </div>
        </div>
      ) : filteredLivestock.length === 0 && livestock.length > 0 ? (
        <Card className="bg-slate-900/70 border-slate-700/50">
          <CardContent className="py-12 text-center">
            <Search className="size-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">No animals match your search</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredLivestock.map((animal, i) => {
              const health = HEALTH_CONFIG[animal.healthStatus] || HEALTH_CONFIG.healthy;
              return (
                <motion.div
                  key={animal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg hover:border-slate-600/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-bold text-base">{animal.breed}</h3>
                          <p className="text-slate-500 text-[11px] font-mono mt-0.5">{animal.rfidTag}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${health.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                          <span className={`text-[10px] font-semibold ${health.text}`}>{health.label}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                          { icon: Calendar, label: 'Age', value: `${animal.age} mo` },
                          { icon: Tag, label: 'Gender', value: animal.gender || 'N/A' },
                          { icon: Weight, label: 'Weight', value: animal.weight ? `${animal.weight} kg` : 'N/A' },
                          { icon: MapPin, label: 'Zone', value: animal.location?.name || 'Unset' },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-center gap-2">
                            <Icon className="size-3 text-slate-500 flex-shrink-0" />
                            <div>
                              <p className="text-slate-500 text-[9px]">{label}</p>
                              <p className="text-slate-300 text-xs font-medium capitalize truncate">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <p className="text-slate-600 text-[10px]">
                          {animal.lastSeen ? `Last: ${new Date(animal.lastSeen).toLocaleDateString()}` : 'No GPS record'}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditDialog(animal)}
                            className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnimal(animal.id)}
                            className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['RFID Tag', 'Breed', 'Age', 'Gender', 'Weight', 'Health', 'Zone', 'Last Seen', ''].map(h => (
                      <th key={h} className="text-left text-slate-400 text-[11px] font-medium py-3 px-4 first:pl-5 last:pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLivestock.map((animal) => {
                    const health = HEALTH_CONFIG[animal.healthStatus] || HEALTH_CONFIG.healthy;
                    return (
                      <tr key={animal.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 pl-5 font-mono text-xs text-slate-300">{animal.rfidTag}</td>
                        <td className="py-3 px-4 text-slate-200 font-medium">{animal.breed}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{animal.age} mo</td>
                        <td className="py-3 px-4 text-slate-400 text-xs capitalize">{animal.gender || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{animal.weight ? `${animal.weight} kg` : '—'}</td>
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${health.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                            <span className={`text-[10px] font-semibold ${health.text}`}>{health.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{animal.location?.name || '—'}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{animal.lastSeen ? new Date(animal.lastSeen).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4 pr-5">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openEditDialog(animal)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                              <Edit className="size-3.5" />
                            </button>
                            <button onClick={() => handleDeleteAnimal(animal.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Animal Record</DialogTitle>
            <DialogDescription className="text-slate-400">Update information for {editingAnimal?.breed}</DialogDescription>
          </DialogHeader>
          <AnimalForm onSubmit={handleEditAnimal} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
