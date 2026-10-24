# F1 Telemetry & Strategy Dashboard — Design Concept

Status legend: **[Built]** is in this repo now. **[Spec]** is design + component architecture for work that needs a live data source the repo does not have yet (no live telemetry feed is wired; nothing here is simulated or faked).

## 1. Visual theme

**Direction:** carbon-black base, frosted-glass cards, neon status colours used sparingly (colour = meaning, never decoration).

| Role | Name | HEX | Use |
|---|---|---|---|
| Background | Carbon | `#07090D` | page base (`carbon`) |
| Surface | Surface | `#0E0E1A` | cards/rows (`surface`) |
| Glass fill | Glass | `rgba(14,16,24,.62)` + blur 14px | `.glass` |
| Glass edge | Edge | `rgba(255,255,255,.09)` | borders |
| Primary | F1 Racing Red | `#E10600` (text-safe `#FF5A5A`) | brand, active, Soft tyre |
| Positive / optimal | Neon Green | `#00FF85` | DRS open, personal best, healthy tyre |
| Warning / Medium | Amber | `#FFB800` | tyre wear warning, Medium compound |
| Fastest lap | Neon Purple | `#B65CFF` | race-fastest lap (F1 convention) |
| Info | Neon Blue | `#00C2FF` | head-to-head driver B, sector markers |
| Text | White / Muted | `#FFFFFF` / `#A0A0B0` | primary / secondary |
| Hard / Inter / Wet | | `#FFFFFF` / `#34D399` / `#60A5FA` | tyre compounds |

All tokens are in `tailwind.config.js` (`neon.*`, `carbon`) and `src/index.css` (`--neon-*`). Text on glass keeps >= 4.5:1: use `#A0A0B0` or lighter for secondary text, never darker grays.

**Typography:** Orbitron (already loaded) for headings and big numerals; Inter/system for body; `tabular-nums` on every number so digits never jitter while counting. Optional: Rajdhani for dense labels — load it in `index.html` next to Orbitron.

## 2. Layout and components

**Grid:** 12-column bento grid, 8px base unit. Desktop (>=1280): sidebar 288px + 12 cols, 24px gutters. Tablet (768–1279): 8 cols. Mobile (<768): 1 col, bottom tab bar, cards stack in priority order (Next race → Telemetry → Strategy → Track).

```
Desktop bento (12 cols)
┌───────────── Hero / session bar (12) ─────────────┐
├── Telemetry (5) ──┬── Track map (7) ──────────────┤
│ RPM · speed · gear│  live dots, sectors, DRS zones │
│ throttle/brake · G│                                │
├── Tyre & pit (5) ─┼── Head-to-head (7) ───────────┤
│ compound + wear % │  speed trace + brake markers   │
└───────────────────┴────────────────────────────────┘
```

| Module | Status | Notes |
|---|---|---|
| Season hero, leaders, next race, standings | **[Built]** | glass + spotlight cards, counting numbers, growing bars |
| Fastest laps table | **[Built]** | purple lap times, pulse on the latest race |
| Tyre strategy (stints, nominations, presets) | **[Built]** | driver stints from presets/OpenF1; nominations from Pirelli data |
| Live telemetry (RPM, speed, gear, pedals, G) | **[Spec]** | needs OpenF1 `/car_data` (≈3.7 Hz) + `/location`; see below |
| Live track dots | **[Spec]** | existing `TrackMap` + OpenF1 `/location`, normalised to the circuit bounds |
| Tyre degradation % | **[Spec]** | wear is not published as data; derive only as an *estimate* from lap-time deltas and label it "estimated" |
| Head-to-head traces | **[Spec]** | OpenF1 `/car_data` for two drivers aligned by lap distance |

### Telemetry module (spec)
- **RPM gauge:** SVG arc 240°, redline segment from 11,500 rpm in red, shift-light dots above it. Needle = CSS transform with `transition: transform 120ms linear` (data arrives ~4 Hz, so interpolate, never jump).
- **Speed + gear:** big Orbitron numeral (counting), gear in a bordered box that flashes on change.
- **Throttle/brake:** two vertical bars (green / red), `scaleY` driven, 80 ms transition. Brake > 0 also tints the trace red.
- **G-force:** circle with a dot; trail of the last 20 samples fading out.
- **Honest states:** no session live → show "Session not live" with the last session replay; stale > 10 s → amber "delayed" chip.

### Tyre status (spec)
Compound chip (S/M/H/I/W) + stint age in laps + estimated wear bar. Bar colour: green < 40%, amber 40–70%, red > 70%. Marked "estimate" unless a real source exists.

## 3. Motion design

All motion is transform/opacity only (compositor-friendly), eased with `cubic-bezier(.16,1,.3,1)` (out-expo) or `cubic-bezier(.34,1.56,.64,1)` (spring overshoot), and **fully disabled by `prefers-reduced-motion`**.

| Effect | Implementation | Status |
|---|---|---|
| Staggered entrance | `.stagger-group > *` with `--i` index → 60 ms steps | **[Built]** |
| Route transition | `PageTransition` keyed on pathname → `.page-enter` (fill `backwards`, so no leftover transform) | **[Built]** |
| Counting numbers | `useCountUp` (rAF, ease-out-expo, starts from the current value, exact final value, SR-safe via `AnimatedNumber`) | **[Built]** |
| Bars grow | `.bar-grow` (scaleX from 0) | **[Built]** |
| Cursor-follow border glow ("spotlight") | `useSpotlight` (one delegated listener) + `.spotlight::before` mask | **[Built]** |
| Hover lift with spring | `.lift` | **[Built]** |
| Purple fastest-lap pulse / green DRS pulse | `.pulse-purple` / `.pulse-green` | **[Built]** (purple used; green ready for DRS) |
| Carbon backdrop with colour pools | `.app-backdrop` on the wrapper | **[Built]** |
| Expandable panels with spring | Framer Motion `layout` + `type: "spring", stiffness: 260, damping: 26` | **[Spec]** |
| Line draw on charts | Recharts `isAnimationActive` + `animationDuration={900}` `animationEasing="ease-out"` | **[Spec]** |

**Why no Framer Motion yet:** adding it changes `package.json`/`package-lock.json`, and it could not be installed or build-tested in the environment this was produced in. The built effects use CSS + two tiny hooks (≈2 kB). When you want springs on expandable panels, `npm i framer-motion` and use:

```tsx
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export function Panel({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduce ? undefined : { height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Trend-based additions (2025–26 dashboard UI)
Bento grid, glassmorphism with a hairline highlight, cursor-follow "spotlight" borders, number tickers, colour-as-meaning neon accents, and subtle noise/texture instead of heavy gradients. Optional next: scroll-driven reveals (`animation-timeline: view()` behind `@supports`) and View Transitions API for route changes.

## 4. Component architecture

```
src/
  components/
    motion/        AnimatedNumber · PageTransition        [Built]
    telemetry/     RpmGauge · SpeedGear · PedalBars · GForce   [Spec]
    track/         TrackMap (existing) + LiveDots              [Spec]
    strategy/      TyreChip · StintBar · WearBar               [Spec]
    compare/       SpeedTrace · BrakeMarkers                    [Spec]
  hooks/           useCountUp · useSpotlight [Built]; useOpenF1Stream (poll + interpolate) [Spec]
  lib/             motion.ts (pure easing/format, unit-tested) [Built]
```
Rules: data hooks return `{status: 'live'|'stale'|'offline', data}`; components never fetch; every animated value has a reduced-motion path and an accessible text equivalent.
