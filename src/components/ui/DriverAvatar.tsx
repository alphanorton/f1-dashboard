import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getTeamColor2026, contrastText } from '@/lib/teamColors';
import { assetUrl } from '@/lib/teamAssets';

interface DriverAvatarProps {
  code: string;
  name: string;
  team: string;
  size?: number;
  className?: string;
}

const EXTENSIONS = ['png', 'jpg', 'webp'] as const;

export function DriverAvatar({ code, name, team, size = 36, className }: DriverAvatarProps) {
  const [extIndex, setExtIndex] = useState(0);
  useEffect(() => setExtIndex(0), [code]);

  const color = getTeamColor2026(team);
  const failed = extIndex >= EXTENSIONS.length;

  return (
    <span
      className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full', className)}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 0 2px ${color}`,
      }}
    >
      {failed ? (
        <span
          role="img"
          aria-label={name}
          className="flex h-full w-full items-center justify-center font-black leading-none"
          style={{ color: contrastText(color), fontSize: size / 3.1 }}
        >
          {code}
        </span>
      ) : (
        <img
          src={assetUrl(`headshots/${code.toLowerCase()}.${EXTENSIONS[extIndex]}`)}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setExtIndex((i) => i + 1)}
          className="h-full w-full object-cover object-top"
        />
      )}
    </span>
  );
}
