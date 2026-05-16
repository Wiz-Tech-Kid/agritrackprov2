import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Database, Loader2, Beef } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';

interface SampleDataLoaderProps {
  accessToken: string;
  onDataLoaded: () => void;
}

export function SampleDataLoader({ accessToken, onDataLoaded }: SampleDataLoaderProps) {
  const [loading, setLoading] = useState(false);

  const sampleLivestock = [
    { rfidTag: 'BW-RFID-0041', breed: 'Brahman', age: 60, healthStatus: 'healthy', weight: 485, gender: 'female', locationName: 'North Pasture', location: { lat: -24.6282, lng: 25.9231, name: 'North Pasture' } },
    { rfidTag: 'BW-RFID-0042', breed: 'Tuli', age: 48, healthStatus: 'healthy', weight: 420, gender: 'female', locationName: 'South Grazing', location: { lat: -24.6341, lng: 25.9198, name: 'South Grazing' } },
    { rfidTag: 'BW-RFID-0043', breed: 'Nguni', age: 36, healthStatus: 'sick', weight: 342, gender: 'female', locationName: 'Isolation Block', location: { lat: -24.6220, lng: 25.9260, name: 'Isolation Block' } },
    { rfidTag: 'BW-RFID-0044', breed: 'Bonsmara', age: 72, healthStatus: 'healthy', weight: 510, gender: 'male', locationName: 'East Paddock', location: { lat: -24.6310, lng: 25.9310, name: 'East Paddock' } },
    { rfidTag: 'BW-RFID-0045', breed: 'Simmental', age: 48, healthStatus: 'treatment', weight: 520, gender: 'female', locationName: 'Vet Bay', location: { lat: -24.6250, lng: 25.9180, name: 'Vet Bay' } },
    { rfidTag: 'BW-RFID-0046', breed: 'Brahman', age: 30, healthStatus: 'healthy', weight: 390, gender: 'female', locationName: 'North Pasture', location: { lat: -24.6271, lng: 25.9245, name: 'North Pasture' } },
    { rfidTag: 'BW-RFID-0047', breed: 'Hereford', age: 54, healthStatus: 'healthy', weight: 545, gender: 'male', locationName: 'West Rangeland', location: { lat: -24.6290, lng: 25.9150, name: 'West Rangeland' } },
    { rfidTag: 'BW-RFID-0048', breed: 'Tuli', age: 42, healthStatus: 'healthy', weight: 395, gender: 'female', locationName: 'South Grazing', location: { lat: -24.6355, lng: 25.9210, name: 'South Grazing' } },
    { rfidTag: 'BW-RFID-0049', breed: 'Nguni', age: 24, healthStatus: 'healthy', weight: 310, gender: 'female', locationName: 'Central Meadow', location: { lat: -24.6300, lng: 25.9230, name: 'Central Meadow' } },
    { rfidTag: 'BW-RFID-0050', breed: 'Bonsmara', age: 66, healthStatus: 'healthy', weight: 490, gender: 'male', locationName: 'East Paddock', location: { lat: -24.6325, lng: 25.9320, name: 'East Paddock' } },
  ];

  const loadSampleData = async () => {
    setLoading(true);
    let successCount = 0;

    for (const animal of sampleLivestock) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/livestock`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify({
              rfidTag: animal.rfidTag,
              breed: animal.breed,
              age: animal.age,
              healthStatus: animal.healthStatus,
              weight: animal.weight,
              gender: animal.gender,
              location: animal.location,
              lastSeen: new Date().toISOString()
            })
          }
        );
        if (response.ok) successCount++;
      } catch {}
    }

    if (successCount > 0) {
      toast.success(`Loaded ${successCount} sample animals from Botswana`);
      onDataLoaded();
    } else {
      toast.error('Failed to load sample data');
    }
    setLoading(false);
  };

  return (
    <Card className="bg-emerald-950/30 border border-emerald-500/20 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <Beef className="size-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">Load Sample Herd Data</h3>
            <p className="text-slate-400 text-sm mb-4">
              Populate your system with {sampleLivestock.length} sample animals — Brahman, Tuli, Nguni, Bonsmara and more — with GPS coordinates for Botswana operations.
            </p>
            <Button
              onClick={loadSampleData}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Loading sample data...
                </>
              ) : (
                <>
                  <Database className="size-4 mr-2" />
                  Load Sample Herd
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
