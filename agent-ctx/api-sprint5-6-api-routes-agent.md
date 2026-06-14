# Task: api-sprint5-6 — Sprint 5 & 6 API Routes

## Agent: API Routes Agent

## Work Log

### Prerequisites
- Pushed Prisma schema to ensure DB sync (already in sync)
- Fixed pre-existing bug in `src/lib/db.ts`: `PrismaBetterSQLite3` → `PrismaBetterSqlite3` (correct export name)
- Rebuilt `better-sqlite3` native bindings (`npm rebuild better-sqlite3`)

### Sprint 5: Review & Governance Routes (8 files)

1. **`/src/app/api/review-decisions/route.ts`** — GET (with extractionId/reviewerId filter), POST (with decision validation)
2. **`/src/app/api/review-decisions/[id]/route.ts`** — GET, PUT, DELETE (with 404 checks)
3. **`/src/app/api/exceptions/route.ts`** — GET (with type/severity/status filter), POST (with type/severity/status validation)
4. **`/src/app/api/exceptions/[id]/route.ts`** — GET, PUT (auto-set resolvedAt on resolve/dismiss), DELETE
5. **`/src/app/api/sync-records/route.ts`** — GET (with entity/status filter), POST (with direction/status validation)
6. **`/src/app/api/sync-records/[id]/route.ts`** — GET, PUT, DELETE
7. **`/src/app/api/validation-rules/route.ts`** — GET (with entity/active filter), POST (with rule type validation)
8. **`/src/app/api/validation-rules/[id]/route.ts`** — GET, PUT, DELETE

### Sprint 6: HQ & Analytics Routes (6 files)

9. **`/src/app/api/scorecards/route.ts`** — GET (with lenderId/period filter), POST (with score fields)
10. **`/src/app/api/scorecards/[id]/route.ts`** — GET, PUT, DELETE (includes lender relation)
11. **`/src/app/api/benchmarking/route.ts`** — GET (with country/period/status filter), POST (with status validation)
12. **`/src/app/api/benchmarking/[id]/route.ts`** — GET, PUT (validate/publish with auto-set validatedBy/validatedAt), DELETE
13. **`/src/app/api/migration-records/route.ts`** — GET (with sourceType/status filter), POST (with sourceType validation)
14. **`/src/app/api/migration-records/[id]/route.ts`** — GET, PUT (auto-set migratedAt on status=migrated), DELETE

### Patterns Applied Consistently
- `import { db } from '@/lib/db'` for database access
- `import { NextResponse } from 'next/server'` for responses
- Dynamic route params: `{ params }: { params: Promise<{ id: string }> }` with `const { id } = await params`
- All DB calls wrapped in try/catch
- 404 checks before PUT/DELETE operations
- Input validation with enumerated allowed values (decision, type, severity, status, rule, direction, sourceType)
- 201 status on POST creation
- 400 status on validation errors
- 500 status on unexpected errors
- Relations included where applicable (reviewer on ReviewDecision, lender on Scorecard, extraction on ReviewDecision)
- Auto-timestamp logic (resolvedAt on exception resolve, validatedAt on benchmarking validate/publish, migratedAt on migration complete)

### Lint Results
- 0 lint errors in all 14 new route files
- Pre-existing lint errors reduced from 155 to 154 (db.ts fix removed 1 error)
- All routes tested and returning valid responses

## Stage Summary
- All 14 route files created and verified lint-clean
- Fixed pre-existing db.ts import bug
- Database confirmed in sync with schema
