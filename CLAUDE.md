# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tally** is a Tufts University club reimbursement management app (JumboHack project). It allows club treasurers to manage reimbursements and submit them to TCU (Tufts Community Union). Deployed at https://tally-5ug5.vercel.app.

The app lives in the `tally/` subdirectory — all commands below should be run from `tally/`.

## Commands

```bash
cd tally
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Run unit tests (Vitest)
npm run test:watch # Watch mode
```

## Architecture

**Stack**: Next.js App Router + TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL (Supabase), Clerk (auth), Zustand (state), Supabase Storage (files), Nodemailer (email).

### Key architectural patterns

**API routes** follow a two-file pattern:
- `src/app/api/<resource>/route.ts` — HTTP handler (POST/GET/PUT/DELETE), calls controller
- `src/app/api/<resource>/controller.ts` — Zod validation + Prisma business logic

All API responses use the format: `{ code: "SUCCESS" | "ERROR", message: string, data: unknown }`.

**Client-side API layer** lives in `src/lib/api/<resource>.ts` — Axios wrappers that call the API routes. Components import from here, not from `fetch` directly.

**Authentication (Clerk)**: Middleware is in `src/proxy.ts` (named proxy.ts but acts as Next.js middleware). Clerk user IDs are stored as the primary key (`id`) in the `User` database model. Server-side: use `auth()` from `@clerk/nextjs/server`. Client-side: use `useUser()`.

**Zustand store** (`src/store/treasurerStore.ts`): Caches the logged-in user's club treasurer data. `TreasurerHydrator` component (rendered in root layout) calls `hydrate()` on mount. Components check this store to determine treasurer status and render conditional UI.

**File storage**: Receipts and generated PDFs go to Supabase Storage bucket `"reimbursements"`. File paths are stored on the `Reimbursement` model. Signed URLs for access are generated via `/api/reimbursements/signed-url`. PDF forms are filled using `pdf-lib` with template at `public/templates/reimbursement-form.pdf`.

### User roles

- `GlobalRole`: `STANDARD` (default) or `TCU_TREASURER` (TCU finance officers)
- `MembershipRole`: `TREASURER` or `MEMBER` (per-club)
- Home page (`/`) is the treasurer dashboard; non-treasurers are redirected to `/pages/members`; TCU treasurers go to `/pages/tcu`

### Database schema summary

Core models: `User`, `Club`, `ClubMembership` (join), `ClubInvite`, `Reimbursement`, `BudgetSection`, `BudgetItem`.

`Reimbursement.status` enum: `SUBMITTED → APPROVED → PAID` (or `REJECTED`). Amounts are stored in **cents** (integer).

Prisma client singleton is in `src/lib/prisma.ts`.

### Path alias

`@/*` maps to `src/*` — use this for all imports within the app.

## Testing

Unit tests live in `tally/src/__tests__/api/` — one file per API controller. The framework is **Vitest** with `vitest-mock-extended` for typed Prisma mocks.

**Mocking strategy:**
- Prisma: mocked via `src/__tests__/mocks/prisma.ts` (auto-reset before each test via `src/__tests__/setup.ts`)
- Nodemailer: `vi.mock("nodemailer", ...)` in `clubInvites.test.ts`
- Supabase: `vi.mock("@/lib/supabase/admin", ...)` in `reimbursements.test.ts`

Each test file covers: happy paths, Zod validation failures, not-found cases, and resource-specific edge cases (duplicate memberships, email normalization, Supabase file deletion, role-based access).

**CI**: `.github/workflows/ci.yml` runs `npm run test` and `npm run lint` on every push and pull request to any branch.

## Environment Variables

Required in `tally/.env`:
- `DATABASE_URL`, `DIRECT_URL` — Supabase PostgreSQL connection strings
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk auth
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` — Supabase storage (`SUPABASE_BUCKET=reimbursements`)
- `INTERNAL_SECRET` — signs internal API requests
- `EMAIL_USER`, `EMAIL_PASS` — Gmail credentials for Nodemailer
- `NEXT_PUBLIC_APP_URL` — base URL (e.g. `http://localhost:3000`)
