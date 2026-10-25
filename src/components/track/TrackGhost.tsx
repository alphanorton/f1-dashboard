import React from 'react';
import { useTrackPath } from '@/lib/trackPaths';

/** Faint outline of the circuit used as a card watermark. Redraws itself when the parent `.group` is hovered. */
export function TrackGhost({ circuit, className }: { circuit: string; className?: string }) {
  const track = useTrackPath(circuit);
  if (!track) return null;
  const [x0, y0, x1, y1] = track.bbox;
  const pad = 30;
  return (
    <svg
      viewBox={`${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="fx-ghost-line"
        d={track.d}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
