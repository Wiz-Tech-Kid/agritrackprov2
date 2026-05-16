import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, Navigation, RefreshCw, History, Satellite, Crosshair, Radio } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface MapTrackingProps {
  accessToken: string;
}

interface Animal {
  id: string;
  rfidTag: string;
  breed: string;
  healthStatus: string;
  location?: { lat: number; lng: number; name?: string };
  lastSeen?: string;
}

interface Movement {
  id: string;
  animalId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

const DEMO_ANIMALS: Animal[] = [
  { id: 'map-1', rfidTag: 'BW-RFID-0041', breed: 'Brahman', healthStatus: 'healthy', location: { lat: -24.6282, lng: 25.9231, name: 'North Pasture' }, lastSeen: new Date(Date.now() - 180000).toISOString() },
  { id: 'map-2', rfidTag: 'BW-RFID-0042', breed: 'Tuli', healthStatus: 'healthy', location: { lat: -24.6341, lng: 25.9198, name: 'South Grazing' }, lastSeen: new Date(Date.now() - 60000).toISOString() },
  { id: 'map-3', rfidTag: 'BW-RFID-0043', breed: 'Nguni', healthStatus: 'sick', location: { lat: -24.6220, lng: 25.9260, name: 'Isolation Block' }, lastSeen: new Date(Date.now() - 840000).toISOString() },
  { id: 'map-4', rfidTag: 'BW-RFID-0044', breed: 'Bonsmara', healthStatus: 'healthy', location: { lat: -24.6310, lng: 25.9310, name: 'East Paddock' }, lastSeen: new Date(Date.now() - 300000).toISOString() },
  { id: 'map-5', rfidTag: 'BW-RFID-0045', breed: 'Simmental', healthStatus: 'treatment', location: { lat: -24.6250, lng: 25.9180, name: 'Vet Bay' }, lastSeen: new Date(Date.now() - 120000).toISOString() },
];

const DEMO_ZONES = [
  { name: 'North Pasture', x: 30, y: 20, w: 30, h: 25, color: '#22c55e', label: '4 animals' },
  { name: 'South Grazing', x: 30, y: 60, w: 28, h: 25, color: '#22c55e', label: '3 animals' },
  { name: 'East Paddock', x: 65, y: 35, w: 25, h: 30, color: '#f59e0b', label: '6 animals — near capacity' },
  { name: 'Isolation Block', x: 8, y: 18, w: 18, h: 20, color: '#ef4444', label: 'Quarantine zone' },
  { name: 'Vet Bay', x: 8, y: 60, w: 18, h: 18, color: '#6366f1', label: 'Medical area' },
  { name: 'Water Source', x: 50, y: 48, w: 10, h: 10, color: '#34d399', label: 'Water trough' },
];

function LiveMap({ animals, selectedAnimal, onSelect }: {
  animals: Animal[];
  selectedAnimal: Animal | null;
  onSelect: (a: Animal) => void;
}) {
  const refLat = -24.628;
  const refLng = 25.923;

  const toXY = (lat: number, lng: number) => ({
    x: 50 + (lng - refLng) * 1800,
    y: 50 - (lat - refLat) * 1800,
  });

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700/50" style={{ height: 420 }}>
      {/* Grid overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Background terrain */}
      <div className="absolute inset-0">
        {/* Pasture zones */}
        {DEMO_ZONES.map((zone) => (
          <div
            key={zone.name}
            className="absolute rounded-xl border opacity-40 transition-opacity hover:opacity-70"
            style={{
              left: `${zone.x}%`, top: `${zone.y}%`,
              width: `${zone.w}%`, height: `${zone.h}%`,
              background: `${zone.color}15`,
              borderColor: `${zone.color}40`,
            }}
          >
            <p className="text-[9px] px-1.5 pt-1 font-medium" style={{ color: zone.color }}>{zone.name}</p>
          </div>
        ))}
      </div>

      {/* Compass */}
      <div className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 border border-slate-700 rounded-full flex items-center justify-center">
        <span className="text-slate-400 text-[10px] font-bold">N</span>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1">
        <div className="h-px w-12 bg-slate-500" />
        <span className="text-slate-500 text-[10px]">500m</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-700/50 rounded-lg p-2 space-y-1">
        {[
          { color: '#22c55e', label: 'Healthy' },
          { color: '#ef4444', label: 'Sick' },
          { color: '#f59e0b', label: 'Treatment' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-slate-400 text-[10px]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Animal markers */}
      {animals.map((animal) => {
        if (!animal.location) return null;
        const statusColor = animal.healthStatus === 'healthy' ? '#22c55e' : animal.healthStatus === 'sick' ? '#ef4444' : '#f59e0b';
        const isSelected = selectedAnimal?.id === animal.id;
        const pos = toXY(animal.location.lat, animal.location.lng);
        const xPct = Math.max(5, Math.min(95, pos.x));
        const yPct = Math.max(5, Math.min(90, pos.y));

        return (
          <motion.button
            key={animal.id}
            onClick={() => onSelect(animal)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
            whileHover={{ scale: 1.3 }}
          >
            {isSelected && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: statusColor, opacity: 0.3, transform: 'scale(2)' }}
              />
            )}
            <div
              className="relative w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg"
              style={{ background: statusColor }}
            >
              <span className="text-[7px] text-white font-bold">●</span>
            </div>
            {isSelected && (
              <div className="absolute left-1/2 -translate-x-1/2 top-6 bg-slate-900/95 border border-slate-700 rounded-lg px-2 py-1 whitespace-nowrap z-10 shadow-xl">
                <p className="text-white text-[10px] font-semibold">{animal.breed}</p>
                <p className="text-slate-400 text-[9px] font-mono">{animal.rfidTag}</p>
              </div>
            )}
          </motion.button>
        );
      })}

      {/* Status bar */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/90 border border-slate-700/50 rounded-lg px-3 py-1.5">
        <Radio className="size-3 text-emerald-400 animate-pulse" />
        <span className="text-slate-300 text-xs font-medium">GPS LIVE</span>
        <span className="text-slate-500 text-xs">{animals.length} tracked</span>
      </div>
    </div>
  );
}

export function MapTracking({ accessToken }: MapTrackingProps) {
  const [livestock, setLivestock] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => { fetchLivestock(); }, []);
  useEffect(() => { if (selectedAnimal) fetchMovementHistory(selectedAnimal.id); }, [selectedAnimal]);

  const fetchLivestock = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      if (response.ok) {
        const withLocation = (data.livestock || []).filter((a: Animal) => a.location);
        setLivestock(withLocation.length > 0 ? withLocation : DEMO_ANIMALS);
        if (!selectedAnimal) setSelectedAnimal(withLocation.length > 0 ? withLocation[0] : DEMO_ANIMALS[0]);
      } else {
        setLivestock(DEMO_ANIMALS);
        setSelectedAnimal(DEMO_ANIMALS[0]);
      }
    } catch {
      setLivestock(DEMO_ANIMALS);
      setSelectedAnimal(DEMO_ANIMALS[0]);
    }
    setLoading(false);
  };

  const fetchMovementHistory = async (animalId: string) => {
    setLoadingMovements(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/movements/${animalId}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      if (response.ok) setMovements(data.movements || []);
    } catch {
      setMovements([]);
    }
    setLoadingMovements(false);
  };

  const simulateGPSUpdate = async () => {
    if (!selectedAnimal?.location) return;
    const newLat = selectedAnimal.location.lat + (Math.random() - 0.5) * 0.002;
    const newLng = selectedAnimal.location.lng + (Math.random() - 0.5) * 0.002;
    try {
      await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/movements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ animalId: selectedAnimal.id, latitude: newLat, longitude: newLng })
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock/${selectedAnimal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ ...selectedAnimal, location: { ...selectedAnimal.location, lat: newLat, lng: newLng }, lastSeen: new Date().toISOString() })
        })
      ]);
      toast.success('GPS position updated');
      fetchLivestock();
      fetchMovementHistory(selectedAnimal.id);
    } catch {
      toast.error('GPS update failed');
    }
  };

  const displayAnimals = livestock.length > 0 ? livestock : DEMO_ANIMALS;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Satellite className="size-6 text-amber-400" />
            GPS Tracking
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Real-time livestock position monitoring — Botswana Operations</p>
        </div>
        <Button
          onClick={simulateGPSUpdate}
          disabled={!selectedAnimal}
          className="bg-slate-800/60 border border-slate-700/50 text-slate-200 hover:bg-slate-700/60 h-9 text-sm flex-shrink-0"
        >
          <RefreshCw className="size-4 mr-2" />
          Simulate GPS Update
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Satellite className="size-10 mx-auto text-amber-400" />
            </motion.div>
            <p className="text-slate-400 text-sm">Acquiring GPS signals...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Animal List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                  <Navigation className="size-4 text-amber-400" />
                  Tracked Animals ({displayAnimals.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {displayAnimals.map((animal) => {
                  const isSelected = selectedAnimal?.id === animal.id;
                  const statusColor = animal.healthStatus === 'healthy' ? 'text-emerald-400' : animal.healthStatus === 'sick' ? 'text-red-400' : 'text-amber-400';
                  const statusBg = animal.healthStatus === 'healthy' ? 'border-emerald-500/20' : animal.healthStatus === 'sick' ? 'border-red-500/20' : 'border-amber-500/20';
                  const lastSeenMins = animal.lastSeen ? Math.round((Date.now() - new Date(animal.lastSeen).getTime()) / 60000) : null;
                  return (
                    <motion.button
                      key={animal.id}
                      onClick={() => setSelectedAnimal(animal)}
                      whileHover={{ x: 3 }}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/25 ring-1 ring-amber-500/20'
                          : `bg-slate-800/40 ${statusBg} hover:border-amber-500/20`
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-slate-200 text-sm font-semibold">{animal.breed}</p>
                          <p className="text-slate-500 text-[10px] font-mono">{animal.rfidTag}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${animal.healthStatus === 'healthy' ? 'bg-emerald-400 animate-pulse' : animal.healthStatus === 'sick' ? 'bg-red-400' : 'bg-amber-400'}`} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                        <MapPin className="size-3" />
                        <span className="truncate">{animal.location?.name || 'Unknown'}</span>
                      </div>
                      {lastSeenMins !== null && (
                        <p className="text-slate-600 text-[10px] mt-0.5">{lastSeenMins < 60 ? `${lastSeenMins}m ago` : `${Math.round(lastSeenMins / 60)}h ago`}</p>
                      )}
                    </motion.button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Map + Details */}
          <div className="lg:col-span-3 space-y-4">
            {/* Live Map */}
            <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                    <Crosshair className="size-4 text-amber-400" />
                    Live Position Map — Farm Layout
                  </CardTitle>
                  {selectedAnimal && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono">{selectedAnimal.location?.lat.toFixed(5)}, {selectedAnimal.location?.lng.toFixed(5)}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <LiveMap
                  animals={displayAnimals}
                  selectedAnimal={selectedAnimal}
                  onSelect={setSelectedAnimal}
                />
              </CardContent>
            </Card>

            {/* Selected Animal Details + Movement History */}
            {selectedAnimal && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-sm font-semibold">Animal Detail</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold">{selectedAnimal.breed}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        selectedAnimal.healthStatus === 'healthy' ? 'bg-emerald-500/15 text-emerald-400' :
                        selectedAnimal.healthStatus === 'sick' ? 'bg-red-500/15 text-red-400' :
                        'bg-amber-500/15 text-amber-400'
                      }`}>{selectedAnimal.healthStatus}</span>
                    </div>
                    {[
                      { label: 'RFID Tag', value: selectedAnimal.rfidTag },
                      { label: 'Current Zone', value: selectedAnimal.location?.name || 'Unknown' },
                      { label: 'Coordinates', value: `${selectedAnimal.location?.lat.toFixed(5)}, ${selectedAnimal.location?.lng.toFixed(5)}` },
                      { label: 'Last GPS Fix', value: selectedAnimal.lastSeen ? new Date(selectedAnimal.lastSeen).toLocaleString() : 'N/A' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <span className="text-slate-500 text-xs">{label}</span>
                        <span className="text-slate-200 text-xs font-medium text-right font-mono">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-sm font-semibold flex items-center gap-2">
                      <History className="size-4 text-slate-400" />
                      Movement History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingMovements ? (
                      <div className="py-6 text-center text-slate-500 text-sm">Loading...</div>
                    ) : movements.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-slate-500 text-sm">No recorded movements</p>
                        <p className="text-slate-600 text-xs mt-1">Use "Simulate GPS Update" to generate data</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {movements.slice().reverse().map((movement, i) => (
                          <div key={movement.id} className="flex items-start gap-3 py-1.5 border-b border-slate-800/60 last:border-0">
                            <MapPin className="size-3 mt-1 text-amber-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-300 text-xs font-mono">
                                {movement.latitude.toFixed(5)}, {movement.longitude.toFixed(5)}
                              </p>
                              <p className="text-slate-600 text-[10px]">{new Date(movement.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
