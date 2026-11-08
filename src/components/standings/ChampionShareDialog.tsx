import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { assetUrl } from '@/lib/teamAssets';
import { renderChampionCard, canvasToBlob, type ChampionCardData } from '@/lib/championCard';

type CardInput = Omit<ChampionCardData, 'headshotUrls'>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardInput;
}

/** Preview of the champion card with Download / Share. The card is drawn on a canvas on demand. */
export function ChampionShareDialog({ open, onOpenChange, card }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<'idle' | 'drawing' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState('drawing');
    // The canvas mounts with the dialog content, so wait one frame for the ref.
    const raf = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const code = card.code.toLowerCase();
      const headshotUrls = ['webp', 'png', 'jpg'].map((ext) => assetUrl(`headshots/${code}.${ext}`));
      renderChampionCard(canvas, { ...card, headshotUrls })
        .then(() => { if (!cancelled) setState('ready'); })
        .catch(() => { if (!cancelled) setState('error'); });
    });
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [open, card]);

  const fileName = `${card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-2026-world-champion.png`;

  const download = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Image saved.');
    } catch {
      setMessage('Could not save the image.');
    }
  };

  const share = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${card.name} · 2026 World Champion` });
      } else {
        await download();
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') setMessage('Sharing is not available here. Use Download instead.');
    }
  };

  const btn = 'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red disabled:opacity-50';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg-dialog max-h-[92vh] w-full max-w-md overflow-y-auto" aria-label="Share the champion card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-white"><ImageIcon className="h-5 w-5 text-yellow-300" aria-hidden="true" /> Champion card</DialogTitle>
          <DialogDescription>A 1080 × 1350 image, sized for social posts.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
          <canvas ref={canvasRef} className="block h-auto w-full" style={{ aspectRatio: '1080 / 1350' }} aria-label={`${card.name}, 2026 World Champion card preview`} />
        </div>
        {state === 'drawing' && <p className="text-xs text-gray-400" role="status">Drawing the card…</p>}
        {state === 'error' && <p className="text-xs text-red-400" role="status">The card could not be drawn.</p>}

        <div className="flex gap-2">
          <button type="button" onClick={download} disabled={state !== 'ready'} className={`${btn} border-yellow-300/50 bg-yellow-300/15 text-yellow-300 hover:bg-yellow-300/25`}>
            <Download className="h-4 w-4" aria-hidden="true" /> Download PNG
          </button>
          {canShareFiles && (
            <button type="button" onClick={share} disabled={state !== 'ready'} className={`${btn} border-gray-700 bg-surface text-white hover:border-gray-500`}>
              <Share2 className="h-4 w-4" aria-hidden="true" /> Share
            </button>
          )}
        </div>
        {message && <p className="text-xs text-gray-400" role="status">{message}</p>}
      </DialogContent>
    </Dialog>
  );
}
