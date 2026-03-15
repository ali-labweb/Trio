import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import TripCard from '../components/trip/TripCard';
import ImportModal from '../components/import/ImportModal';
import { useItineraryStore } from '../store/useItineraryStore';
import { toISODate } from '../utils/dates';

export default function HomePage() {
  const trips = useItineraryStore((s) => s.trips);
  const addTrip = useItineraryStore((s) => s.addTrip);
  const deleteTrip = useItineraryStore((s) => s.deleteTrip);
  const navigate = useNavigate();

  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [endDate, setEndDate] = useState('');

  const handleCreate = () => {
    if (!tripName.trim() || !startDate || !endDate) return;
    const id = addTrip(tripName.trim(), startDate, endDate);
    setShowCreate(false);
    setTripName('');
    navigate(`/trip/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this trip?')) {
      deleteTrip(id);
    }
  };

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div>
      <Header title="Travel Companion" />
      <div className="p-4 space-y-4">
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Trip
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex-1 py-3 rounded-xl border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import
          </button>
        </div>

        {/* Trip list */}
        {sortedTrips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No trips yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Create a new trip or import an itinerary to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={() => handleDelete(trip.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg">Create New Trip</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trip Name</label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Japan Adventure 2026"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!tripName.trim() || !startDate || !endDate}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
