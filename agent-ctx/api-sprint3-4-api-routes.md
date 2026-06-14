# Task: api-sprint3-4 — Sprint 3 & 4 API Routes

## Summary
Created all 17 API route files for Sprint 3 (Platform Foundation) and Sprint 4 (Field Capture, Transcription, Draft Extraction).

## Files Created

### Sprint 3 — Platform Foundation (5 route files)
1. `/src/app/api/users/route.ts` — GET (list all), POST (create)
2. `/src/app/api/users/[id]/route.ts` — GET (detail), PUT (update), DELETE
3. `/src/app/api/audit-logs/route.ts` — GET (list with entity/userId/action filter), POST (create)
4. `/src/app/api/role-permissions/route.ts` — GET (list), POST (create)
5. `/src/app/api/role-permissions/[id]/route.ts` — GET, PUT, DELETE

### Sprint 4 — Field Capture, Transcription, Draft Extraction (12 route files)
6. `/src/app/api/lenders/route.ts` — GET (list with country/status filter), POST (create)
7. `/src/app/api/lenders/[id]/route.ts` — GET (detail with meetings), PUT (update), DELETE
8. `/src/app/api/meetings/route.ts` — GET (list with lenderId/status filter), POST (create with lender validation)
9. `/src/app/api/meetings/[id]/route.ts` — GET (detail with narratives/voiceMemos/extractions), PUT, DELETE
10. `/src/app/api/narrative-notes/route.ts` — GET (list with meetingId filter), POST (create with meeting validation)
11. `/src/app/api/narrative-notes/[id]/route.ts` — GET, PUT, DELETE
12. `/src/app/api/voice-memos/route.ts` — GET (list with meetingId filter), POST (create with meeting validation)
13. `/src/app/api/voice-memos/[id]/route.ts` — GET, PUT, DELETE
14. `/src/app/api/extraction-drafts/route.ts` — GET (list with status/meetingId filter), POST (create with meeting+voiceMemo validation)
15. `/src/app/api/extraction-drafts/[id]/route.ts` — GET (detail with reviews), PUT, DELETE
16. `/src/app/api/activation-areas/route.ts` — GET (list ordered by `order`), POST (create)
17. `/src/app/api/activation-areas/[id]/route.ts` — GET, PUT, DELETE

## Patterns Applied
- `import { db } from '@/lib/db'` for database access
- `import { NextResponse } from 'next/server'` for responses
- Dynamic route params: `{ params }: { params: Promise<{ id: string }> }` with `const { id } = await params`
- All DB calls wrapped in try/catch with proper error logging and status codes
- 404 checks before PUT/DELETE operations
- Unique constraint violations caught and returned as 409
- Relational includes for detail endpoints (e.g., lender includes meetings, meeting includes narratives/voiceMemos/extractions)
- Foreign key validation (e.g., meeting validates lenderId, narrative-note validates meetingId)
- Conditional update fields using spread with undefined checks

## Lint Results
- 0 errors in all 17 new API route files
- Pre-existing lint errors in other project files (skills, download, temp-project) are unrelated

## Database
- Schema already in sync (bun run db:push confirmed)
