import { useState, useRef } from 'react';
import Header from '../components/layout/Header';
import { useSettingsStore } from '../store/useSettingsStore';
import { useItineraryStore } from '../store/useItineraryStore';
import SyncModal from '../components/sync/SyncModal';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        on ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { dark, useFahrenheit, useMiles, toggleDark, toggleTempUnit, toggleDistUnit } = useSettingsStore();
  const trips = useItineraryStore((s) => s.trips);
  const mergeTrips = useItineraryStore((s) => s.mergeTrips);
  const [showSync, setShowSync] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = JSON.stringify(trips, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `trio-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const incoming = Array.isArray(parsed) ? parsed : parsed.trips;
        if (!Array.isArray(incoming)) {
          setImportResult('Invalid backup file');
          return;
        }
        const { added, updated } = mergeTrips(incoming);
        setImportResult(`${added} added, ${updated} updated`);
        setTimeout(() => setImportResult(null), 3000);
      } catch {
        setImportResult('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sections = [
    {
      title: 'Appearance',
      items: [
        { label: 'Dark Mode', description: 'Switch between light and dark theme', on: dark, toggle: toggleDark },
      ],
    },
    {
      title: 'Units',
      items: [
        { label: 'Temperature in °F', description: 'Use Fahrenheit instead of Celsius', on: useFahrenheit, toggle: toggleTempUnit },
        { label: 'Distance in miles', description: 'Use miles instead of kilometers', on: useMiles, toggle: toggleDistUnit },
      ],
    },
  ];

  return (
    <div>
      <Header title="Settings" />
      <div className="p-4 space-y-6">
        {/* Sync & Backup */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Sync & Backup
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {/* Quick Sync */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Quick Sync</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scan QR or share link to sync devices</p>
                </div>
                <button
                  onClick={() => setShowSync(true)}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
                >
                  Sync Devices
                </button>
              </div>
            </div>

            {/* Backup & Restore */}
            <div className="p-4">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Backup & Restore</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">Export or import your trip data as JSON</p>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export Data
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  Import Data
                </button>
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </div>
              {importResult && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">{importResult}</p>
              )}
            </div>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <Toggle on={item.on} onToggle={item.toggle} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            About
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Travel Companion</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your personal travel itinerary app. Plan trips, track activities, and explore with weather and maps — all offline, no account needed.
            </p>
          </div>
        </div>
      </div>

      {showSync && <SyncModal onClose={() => setShowSync(false)} />}
    </div>
  );
}
