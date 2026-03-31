import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useItineraryStore } from '../../store/useItineraryStore';
import { encodeAllTrips } from '../share/ShareCodec';

interface SyncModalProps {
  onClose: () => void;
}

export default function SyncModal({ onClose }: SyncModalProps) {
  const trips = useItineraryStore((s) => s.trips);
  const [copied, setCopied] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');
  const [tooLarge, setTooLarge] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trips.length === 0) return;
    const encoded = encodeAllTrips(trips);
    const base = window.location.origin + window.location.pathname;
    const url = `${base}#/shared?mode=sync&d=${encoded}`;

    if (url.length > 8000) {
      setTooLarge(true);
      setSyncUrl(url);
      return;
    }

    setSyncUrl(url);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 220,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      });
    }
  }, [trips]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(syncUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = syncUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Sync Devices</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            ✕
          </button>
        </div>

        {trips.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No trips to sync</p>
        ) : (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scan this QR code on your other device, or copy the link and open it there.
              {trips.length} trip{trips.length !== 1 ? 's' : ''} will be synced.
            </p>

            {!tooLarge && (
              <div className="flex justify-center">
                <canvas ref={canvasRef} className="rounded-xl" />
              </div>
            )}

            {tooLarge && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Your trip data is too large for a QR code. Use the copy link below or export a backup file instead.
                </p>
              </div>
            )}

            <button
              onClick={handleCopy}
              className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Link Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 0 0-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757" />
                  </svg>
                  Copy Sync Link
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
