import React, { useId } from 'react';
import { useTrackPath } from '@/lib/trackPaths';

const CAR_COLORS = ['#FF2A1F', '#FFFFFF', '#00C2FF'];

/**
 * The real circuit layout: the line draws itself, an energy pulse runs along it, and three cars
 * launch one after another and loop the lap (SVG <animateMotion> + <mpath>, rotate="auto" keeps
 * them facing the direction of travel). Decorative only. Renders nothing if no layout exists.
 */
export function TrackLoop({ circuit, className }: { circuit: string; className?: string }) {
  const track = useTrackPath(circuit);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!track) return null;

  const [x0, y0, x1, y1] = track.bbox;
  const pad = 46;
  const viewBox = `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`;
  const start = track.d.match(/^M(-?[\d.]+),(-?[\d.]+)/);
  const pathId = `fx-track-${uid}`;
  const glowId = `fx-glow-${uid}`;

  return (
    <svg viewBox={viewBox} className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* asphalt */}
      <path id={pathId} d={track.d} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="26" strokeLinejoin="round" />
      <path d={track.d} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="18" strokeLinejoin="round" />

      {/* neon line that draws itself */}
      <path
        className="fx-trace"
        d={track.d}
        pathLength={1}
        fill="none"
        stroke="#FF2A1F"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />
      {/* energy pulse running along the line */}
      <path
        className="fx-pulse"
        d={track.d}
        pathLength={1}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".9"
      />

      {/* start / finish */}
      {start && <circle className="fx-sf" cx={start[1]} cy={start[2]} r="9" fill="#FFFFFF" />}

      {/* cars */}
      {CAR_COLORS.map((color, i) => (
        <g key={color} className="fx-car" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
          <animateMotion
            dur={`${9.5 + i * 0.5}s`}
            begin={`${1.6 + i * 0.7}s`}
            repeatCount="indefinite"
            rotate="auto"
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
          <rect x="-17" y="-6.5" width="34" height="13" rx="6" fill={color} />
          <rect x="-1" y="-4" width="9" height="8" rx="2" fill="#0b0d14" opacity=".6" />
        </g>
      ))}
    </svg>
  );
}
