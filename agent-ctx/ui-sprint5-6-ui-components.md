# UI Sprint 5-6 Components — Agent Context

## Task
Create 7 UI component files for Sprint 5 (Review & Governance) and Sprint 6 (HQ & Analytics) views.

## Files Created

### Sprint 5 — Review & Governance
1. `/src/components/review/ReviewWorkbench.tsx` — Extraction draft review with approve/reject/followup/edit actions, dialog with rationale
2. `/src/components/exceptions/ExceptionQueue.tsx` — Exception table with severity badges, type/severity/status filters, resolve/dismiss actions
3. `/src/components/sync/SyncDashboard.tsx` — Sync dashboard with summary cards, records table, retry for failed/conflict records

### Sprint 6 — HQ & Analytics
4. `/src/components/hq/HQDashboard.tsx` — Executive summary cards, country breakdown table, recent activity timeline
5. `/src/components/scorecards/ScorecardView.tsx` — Scorecard list with expandable dimension progress bars (6 dimensions)
6. `/src/components/benchmarking/BenchmarkingView.tsx` — Benchmarking table with country/status filters, validate/publish actions
7. `/src/components/migration/MigrationView.tsx` — Migration records with progress summary, status badges, validation notes

## Key Patterns
- `'use client'` on all components
- shadcn/ui from `@/components/ui/`
- Lucide React icons
- Select `onValueChange` → `(v) => setFilter(v ?? "all")`
- useEffect with cancelled-flag pattern (avoids react-hooks/set-state-in-effect)
- useState for data, loading, filters
- Fetch from `/api/xxx` endpoints matching existing Sprint 5/6 API routes
- Lint: 0 errors, 0 warnings in all 7 new files
