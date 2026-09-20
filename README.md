# F1 Dashboard 2026
# Live demo
[**open F1 dashboad**]
 ( f1-dashboard-15aciomqw-mehraj6.vercel.app )

Formula 1 2026 season dashboard: race calendar, standings, circuits with track maps, and a per-race / per-driver tyre strategy explorer powered by the OpenF1 API.

## Stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS 3
- TanStack React Query 5
- React Router 6
- Zustand (persisted UI state)
- Recharts
- Lucide icons

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3001/ (Vite is configured for port 3000 in `vite.config.ts`; if 3000 is busy it falls back automatically).

Production build:

```bash
npm run build
npm run preview
```

Type checking:

```bash
npm run typecheck
```

Tyre helper unit tests (no test framework needed):

```bash
node src/pages/TireStrategy.helpers.test.ts
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Season overview: progress, KPIs, next race, recent results |
| `/grand-prix` | 2026 race calendar with winners, sprints, status filters |
| `/circuits` | Circuit facts: length, laps, corners, G-force, lap records |
| `/standings` | Drivers' and constructors' championship tables |
| `/track-map` | Circuit map images (official F1 CDN) with graceful fallback |
| `/tyres` | Per race, per driver tyre stint history from OpenF1 (2023-2026) |
| `/settings` | Dashboard preferences |

## Data sources

- **OpenF1** (`api.openf1.org`) - meetings, sessions, drivers, stints for the Tyre Strategy page
- **Local JSON** (`public/data/`) - 2026 calendar, circuits, standings snapshots
- **F1 media CDN** - legacy circuit diagram images; spa and madring have no verified image and show an explicit "unavailable" panel instead of a wrong map

## Notes

- Track map images are legacy F1 diagrams; 2026 layouts may differ.
- Restarting dev servers: if a port stays busy, kill stray `node.exe` processes running `vite.js` first.
