import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getTeamColor2026, contrastText } from '@/lib/teamColors';
import { assetUrl, teamSlug, TEAM_BADGE_TEXT } from '@/lib/teamAssets';

interface TeamLogoProps {
  team: string;
  size?: number;
  className?: string;
}

const EXTENSIONS = ['svg', 'png'] as const;

export function TeamLogo({ team, size = 32, className }: TeamLogoProps) {
  const slug = teamSlug(team);
  const [extIndex, setExtIndex] = useState(0);

  useEffect(() => setExtIndex(0), [slug]);

  const color = getTeamColor2026(team);
  const failed = !slug || extIndex >= EXTENSIONS.length;

  if (failed) {
    const label = (slug && TEAM_BADGE_TEXT[slug]) ?? team.slice(0, 3).toUpperCase();
    return (
      <span
        role="img"
        aria-label={`${team} logo`}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md font-black leading-none tracking-tight',
          className
        )}
        style={{
          width: size,
          height: size,
          background: color,
          color: contrastText(color),
          fontSize: Math.max(8, size / (label.length > 3 ? 4.2 : 2.6)),
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <img
      src={assetUrl(`logos/teams/${slug}.${EXTENSIONS[extIndex]}`)}
      alt={`${team} logo`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setExtIndex((i) => i + 1)}
      className={cn('shrink-0 object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}
