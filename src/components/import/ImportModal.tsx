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

const AI_PROMPT = `Generate a travel itinerary as a JSON object with this exact structure. Output ONLY the JSON, no other text:

{
  "name": "Trip Name",
  "destination": "City, Country",
  "hotel": "Hotel Name",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "label": "Day 1 — Arrival",
      "activities": [
        {
          "title": "Activity name",
          "description": "Optional details or notes",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "category": "flight|transport|hotel|restaurant|activity|sightseeing|shopping|other",
          "location": {
            "name": "Place Name",
            "lat": 42.3601,
            "lng": -71.0589
          }
        }
      ]
    }
  ]
}

Rules:
- Every day between startDate and endDate must have an entry in days[]
- Times use 24-hour format (e.g., "09:00", "14:30")
- category must be exactly one of: flight, transport, hotel, restaurant, activity, sightseeing, shopping, other
- IMPORTANT: Every activity MUST include a location object with name, lat (latitude), and lng (longitude). Use real coordinates for each place. This powers the trip map.
- destination should be the primary city or region name (used for weather lookup)
- hotel is the accommodation name displayed in the app
- Each day should have a descriptive label (e.g., "Day 1 — Arrival", "Day 3 — Beach & Snorkeling")`;

interface ImportModalProps {
  onClose: () => void;
}

export default function ImportModal({ onClose }: ImportModalProps) {
  const [mode, setMode] = useState<'file' | 'paste' | 'ai'>('ai');
  const [text, setText] = useState('');
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Trip | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiStep, setAiStep] = useState<'prompt' | 'paste'>('prompt');
  const fileRef = useRef<HTMLInputElement>(null);
  const importTrip = useItineraryStore((s) => s.importTrip);
  const navigate = useNavigate();

  const geocodeAndPreview = async (trip: Trip, rawText: string) => {
    if (tripName.trim()) trip.name = tripName.trim();
    // Geocode trip destination
    const dest = getDestination(rawText);
    if (dest) {
      const loc = await geocodeLocation(dest);
      if (loc) trip.location = loc;
    }
    // Geocode any activities that have a title but no location coordinates
    // (handles JSON without lat/lng — uses activity title + description as search query)
    const activitiesNeedingGeocode = trip.days.flatMap((d) =>
      d.activities.filter((a) => !a.location && a.category !== 'other' && a.category !== 'transport')
    );
    if (activitiesNeedingGeocode.length > 0) {
      // Batch geocode in parallel, limit to avoid rate limiting
      const batch = activitiesNeedingGeocode.slice(0, 20);
      await Promise.all(
        batch.map(async (activity) => {
          const query = activity.title;
          const loc = await geocodeLocation(query);
          if (loc) {
            activity.location = loc;
          }
        })
      );
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

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = AI_PROMPT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
                onClick={() => setMode('ai')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  mode === 'ai'
                    ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                AI Generate
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  mode === 'paste'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Paste
              </button>
              <button
                onClick={() => setMode('file')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  mode === 'file'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Upload
              </button>
            </div>

            {mode === 'ai' && aiStep === 'prompt' && (
              <div className="space-y-3">
                <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <span className="text-sm font-semibold text-violet-800 dark:text-violet-200">Generate with AI</span>
                  </div>
                  <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                    Copy this prompt and give it to Claude (or any AI) along with your trip details. Paste the JSON output back here to import.
                  </p>
                </div>

                <div className="relative">
                  <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                    {AI_PROMPT}
                  </pre>
                  <button
                    onClick={handleCopyPrompt}
                    className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    <span className="font-semibold">Tip:</span> Add your trip details after the prompt, e.g. <span className="italic">"Plan a 5-day trip to Tokyo, staying at Park Hyatt, from April 10-14, 2026. I like sushi, temples, and nightlife."</span>
                  </p>
                </div>

                <button
                  onClick={() => setAiStep('paste')}
                  className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>I have the AI output</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            )}

            {mode === 'ai' && aiStep === 'paste' && (
              <div className="space-y-3">
                <button
                  onClick={() => setAiStep('prompt')}
                  className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1 hover:underline"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Back to prompt
                </button>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder='Paste the AI-generated JSON here...'
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none resize-none text-sm font-mono"
                />
                <button
                  onClick={handlePasteImport}
                  disabled={!text.trim() || loading}
                  className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Importing...' : 'Import Itinerary'}
                </button>
              </div>
            )}

            {mode === 'file' && (
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
            )}

            {mode === 'paste' && (
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
