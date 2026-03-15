import { useState } from 'react';
import type { Trip } from '../../types/itinerary';
import { encodeTrip } from './ShareCodec';

interface ShareButtonProps {
  trip: Trip;
}

export default function ShareButton({ trip }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const encoded = encodeTrip(trip);
    const url = `${window.location.origin}/shared?d=${encoded}`;

    // If URL is too long (>4000 chars), fall back to different approach
    if (url.length > 4000) {
      // Try Web Share API with text
      if (navigator.share) {
        try {
          await navigator.share({
            title: trip.name,
            text: `Check out my travel itinerary: ${trip.name}`,
            url: url.length <= 8000 ? url : window.location.origin,
          });
          return;
        } catch {
          // User cancelled or API not available
        }
      }
    }

    // Try Web Share API first on mobile
    if (navigator.share && url.length <= 8000) {
      try {
        await navigator.share({
          title: trip.name,
          text: `Check out my travel itinerary: ${trip.name}`,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      aria-label="Share trip"
    >
      {copied ? (
        <span className="text-green-500 text-sm font-medium">✓</span>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  );
}
