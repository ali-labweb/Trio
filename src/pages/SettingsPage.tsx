import Header from '../components/layout/Header';
import { useSettingsStore } from '../store/useSettingsStore';

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
    </div>
  );
}
