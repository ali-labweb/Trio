import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItineraryStore } from '../../store/useItineraryStore';
import { extractTextFromPdf } from '../../services/pdfExtract';
import { parseItineraryText } from './TextParser';
import { parseCsvItinerary } from './CsvParser';
import { parseIcsItinerary } from './IcsParser';
import { tryParseJson, getDestination } from './JsonParser';
import { geocodeLocation } from '../../services/geocoding';
import type { Trip } from '../../types/itinerary';

interface ImportModalProps {
  onClose: () => void;
}

export default function ImportModal({ onClose }: ImportModalProps) {
  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [text, setText] = useState('');
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Trip | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const importTrip = useItineraryStore((s) => s.importTrip);
  const navigate = useNavigate();

  const geocodeAndPreview = async (trip: Trip, rawText: string) => {
    if (tripName.trim()) trip.name = tripName.trim();
    const dest = getDestination(rawText);
    if (dest) {
      const loc = await geocodeLocation(dest);
      if (loc) trip.location = loc;
    }
    setPreview(trip);
  };

  const handleFile = async (file: File) => {
    setLoading(true);
    setError('');
    try {
      let content: string;
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'pdf') {
        content = await extractTextFromPdf(file);
        const trip = parseItineraryText(content, tripName || file.name.replace(/\.pdf$/i, ''));
        setPreview(trip);
      } else if (ext === 'csv') {
        content = await file.text();
        const trip = parseCsvItinerary(content, tripName || file.name.replace(/\.csv$/i, ''));
        setPreview(trip);
      } else if (ext === 'ics') {
        content = await file.text();
        const trip = parseIcsItinerary(content, tripName || file.name.replace(/\.ics$/i, ''));
        setPreview(trip);
      } else if (ext === 'json') {
        content = await file.text();
        const trip = tryParseJson(content);
        if (trip) {
          await geocodeAndPreview(trip, content);
        } else {
          setError('Invalid JSON itinerary format.');
        }
      } else {
        content = await file.text();
        // Try JSON first, fall back to text parsing
        const jsonTrip = tryParseJson(content);
        if (jsonTrip) {
          await geocodeAndPreview(jsonTrip, content);
        } else {
          const trip = parseItineraryText(content, tripName || file.name.replace(/\.\w+$/i, ''));
          setPreview(trip);
        }
      }
    } catch (err) {
      setError('Failed to parse file. Please try a different format.');
      console.error(err);
    }
    setLoading(false);
  };

  const handlePasteImport = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Try JSON first, then fall back to text parsing
      const jsonTrip = tryParseJson(text);
      if (jsonTrip) {
        await geocodeAndPreview(jsonTrip, text);
      } else {
        const trip = parseItineraryText(text, tripName || 'Imported Trip');
        setPreview(trip);
      }
    } catch {
      setError('Failed to parse text.');
    }
    setLoading(false);
  };

  const confirmImport = () => {
    if (!preview) return;
    if (tripName.trim()) {
      preview.name = tripName.trim();
    }
    importTrip(preview);
    navigate(`/trip/${preview.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Import Itinerary</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            ✕
          </button>
        </div>

        {!preview ? (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Trip Name (optional)
              </label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Japan 2026"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMode('file')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  mode === 'file'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  mode === 'paste'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Paste Text
              </button>
            </div>

            {mode === 'file' ? (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt,.csv,.ics,.json,.text"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                  className="w-full py-12 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  {loading ? (
                    <span>Parsing...</span>
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="text-sm">Tap to upload PDF, TXT, CSV, ICS, or JSON</span>
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your itinerary text or JSON here..."
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                />
                <button
                  onClick={handlePasteImport}
                  disabled={!text.trim() || loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Parsing...' : 'Parse Text'}
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <h3 className="font-medium">Preview: {preview.name}</h3>
            <p className="text-sm text-slate-500">
              {preview.days.length} days · {preview.days.reduce((s, d) => s + d.activities.length, 0)} activities parsed
              {preview.hotelName && ` · ${preview.hotelName}`}
              {preview.location && ` · ${preview.location.name}`}
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {preview.days.map((day) => (
                <div key={day.id} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                  <p className="text-sm font-medium">{day.label} — {day.date}</p>
                  {day.activities.length === 0 ? (
                    <p className="text-xs text-slate-400 mt-1">No activities</p>
                  ) : (
                    <ul className="mt-1 space-y-0.5">
                      {day.activities.map((a) => (
                        <li key={a.id} className="text-xs text-slate-600 dark:text-slate-300">
                          {a.startTime && `${a.startTime} `}{a.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-medium"
              >
                Back
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Import Trip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
