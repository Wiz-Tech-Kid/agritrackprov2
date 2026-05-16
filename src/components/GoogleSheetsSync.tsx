import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Sheet, Upload, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

interface GoogleSheetsSyncProps {
  accessToken: string;
}

export function GoogleSheetsSync({ accessToken }: GoogleSheetsSyncProps) {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [livestockSheet, setLivestockSheet] = useState('Livestock');
  const [alertsSheet, setAlertsSheet] = useState('Alerts');

  const exportToGoogleSheets = async (dataType: 'livestock' | 'alerts') => {
    setSyncing(true);
    try {
      // Fetch data
      const endpoint = dataType === 'livestock' ? 'livestock' : 'alerts';
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ebf166d3/${endpoint}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      const result = await response.json();
      const data = dataType === 'livestock' ? result.livestock : result.alerts;

      if (!data || data.length === 0) {
        toast.error(`No ${dataType} data to export`);
        setSyncing(false);
        return;
      }

      // Format data for Google Sheets
      const sheetData = formatDataForSheets(data, dataType);
      
      // In a real implementation, this would use the Google Sheets API
      // For now, we'll create a downloadable CSV
      const csv = convertToCSV(sheetData);
      downloadCSV(csv, `${dataType}_${new Date().toISOString().split('T')[0]}.csv`);

      toast.success(`${dataType} data exported successfully! Open in Google Sheets to import.`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setSyncing(false);
    }
  };

  const formatDataForSheets = (data: any[], dataType: string) => {
    if (dataType === 'livestock') {
      return data.map(item => ({
        'RFID Tag': item.rfidTag,
        'Breed': item.breed,
        'Age (months)': item.age,
        'Gender': item.gender,
        'Health Status': item.healthStatus,
        'Weight (kg)': item.weight,
        'Location': item.location?.name || 'N/A',
        'Latitude': item.location?.lat || 'N/A',
        'Longitude': item.location?.lng || 'N/A',
        'Last Seen': item.lastSeen ? new Date(item.lastSeen).toLocaleString() : 'N/A',
        'Created At': new Date(item.createdAt).toLocaleString()
      }));
    } else {
      return data.map(item => ({
        'Alert Type': item.type,
        'Severity': item.severity,
        'Message': item.message,
        'Status': item.status,
        'Animal ID': item.animalId,
        'Created At': new Date(item.createdAt).toLocaleString(),
        'Resolved At': item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : 'N/A'
      }));
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simulateImportFromSheets = async (dataType: 'livestock' | 'alerts') => {
    toast.info('Google Sheets import requires API key configuration. Use the export feature to sync data to Sheets, then manually update as needed.');
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sheet className="size-5" />
          Google Sheets Integration
        </CardTitle>
        <CardDescription className="text-green-200">
          Export livestock and alerts data to Google Sheets for external analysis and record-keeping
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Livestock Data</CardTitle>
                    <CardDescription className="text-sm">
                      Export all livestock information including RFID tags, health status, and locations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={() => exportToGoogleSheets('livestock')}
                      disabled={syncing}
                      className="w-full"
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="size-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="size-4 mr-2" />
                          Export Livestock
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Alerts Data</CardTitle>
                    <CardDescription className="text-sm">
                      Export all alert records including active and resolved alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={() => exportToGoogleSheets('alerts')}
                      disabled={syncing}
                      className="w-full"
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="size-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="size-4 mr-2" />
                          Export Alerts
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 text-white">
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-emerald-300 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">How to use exported data:</p>
                    <ol className="list-decimal list-inside space-y-1 text-green-200">
                      <li>Click "Export Livestock" or "Export Alerts" to download CSV file</li>
                      <li>Open Google Sheets and create a new spreadsheet</li>
                      <li>Go to File → Import → Upload and select the downloaded CSV</li>
                      <li>Your data will be imported into Google Sheets for analysis</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spreadsheet-id" className="text-white">Google Spreadsheet ID</Label>
                <Input
                  id="spreadsheet-id"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                />
                <p className="text-xs text-green-200">
                  Find the Spreadsheet ID in your Google Sheets URL
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="livestock-sheet" className="text-white">Livestock Sheet Name</Label>
                  <Input
                    id="livestock-sheet"
                    value={livestockSheet}
                    onChange={(e) => setLivestockSheet(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alerts-sheet" className="text-white">Alerts Sheet Name</Label>
                  <Input
                    id="alerts-sheet"
                    value={alertsSheet}
                    onChange={(e) => setAlertsSheet(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-white">
                <p className="text-sm">
                  <strong>Note:</strong> For full Google Sheets API integration with automatic sync, you'll need to:
                </p>
                <ul className="list-disc list-inside text-sm text-green-200 mt-2 space-y-1">
                  <li>Enable Google Sheets API in Google Cloud Console</li>
                  <li>Create OAuth 2.0 credentials</li>
                  <li>Configure API permissions for your account</li>
                </ul>
                <p className="text-sm mt-2">
                  Currently, the system supports CSV export which can be manually imported to Google Sheets.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
