@AGENTS.md

# CLAUDE.md — wm2026-boerse

**WM 2026 Börse** is a full-stack prediction market / exchange for the FIFA World Cup 2026. Users trade positions on match outcomes, group standings, and tournament progression.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (`strict: true`) |
| Styling | Tailwind CSS v4 |
| Runtime | Node.js |
| Package manager | npm |

> **IMPORTANT:** This project uses Next.js 16, which has breaking changes relative to earlier versions. Before writing or editing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Do not rely on training data alone.

---

## Project Structure

```
wm2026-boerse/
├── src/
│   └── app/                  # App Router root
│       ├── layout.tsx         # Root layout (fonts, global styles)
│       ├── page.tsx           # Home page (/)
│       └── globals.css        # Global CSS + Tailwind directives
├── public/                    # Static assets (SVGs, images)
├── next.config.ts             # Next.js config
├── tsconfig.json              # TypeScript config (strict, @/* alias)
├── eslint.config.mjs          # ESLint flat config
├── postcss.config.mjs         # PostCSS (Tailwind v4)
├── AGENTS.md                  # Next.js AI agent instructions
└── CLAUDE.md                  # This file
```

### Intended directory conventions (add as the app grows)

```
src/
├── app/
│   ├── (auth)/               # Route group: login, register
│   ├── markets/              # Market listing and detail pages
│   ├── portfolio/            # User portfolio
│   └── api/                  # Route Handlers (REST endpoints)
├── components/               # Shared UI components
│   ├── ui/                   # Primitive/headless components
│   └── markets/              # Domain-specific components
├── lib/                      # Utilities, helpers, constants
├── types/                    # Shared TypeScript types/interfaces
└── hooks/                    # Custom React hooks (client-only)
```

---

## Development Commands

Run all commands from within `wm2026-boerse/`:

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Key Conventions

### Server vs Client Components

- **Default: Server Components.** Pages and layouts are Server Components unless `"use client"` is present.
- Add `"use client"` only when the component needs state, event handlers, `useEffect`, or browser APIs.
- Keep `"use client"` boundaries as deep in the tree as possible — push interactivity to leaf components.
- Never use `"use client"` in `layout.tsx` files unless absolutely necessary.

```tsx
// Server Component — fetch data directly, no directive needed
export default async function MarketsPage() {
  const markets = await fetchMarkets()
  return <MarketList markets={markets} />
}

// Client Component — needs onClick or useState
"use client"
export function BuyButton({ marketId }: { marketId: string }) {
  ...
}
```

### Path Alias

The `@/*` alias maps to `src/*`. Always use it for imports within the project:

```ts
import { formatOdds } from "@/lib/format"   // correct
import { formatOdds } from "../../lib/format" // avoid
```

### TypeScript

- `strict: true` is enabled — no `any`, no implicit `undefined`.
- Use explicit return types on exported functions.
- Define shared types in `src/types/`, not inline in component files.

### Tailwind CSS v4

- v4 uses `@import "tailwindcss"` in CSS, not `@tailwind base/components/utilities`.
- Config is PostCSS-based (`postcss.config.mjs`) — there is no `tailwind.config.js` by default.
- Use `cn()` (or a similar utility) when conditionally combining classes.

### Route Handlers (API)

- Place API routes at `src/app/api/<resource>/route.ts`.
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.
- Read the bundled docs at `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` before writing route handlers.

### Data Fetching

- Fetch data in Server Components directly (async/await).
- Do not use `useEffect` for data fetching — use React's `use()` with Server Component data or Server Actions.
- Read `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md` before adding fetch logic.

---

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Pages / layouts | lowercase kebab route folder + `page.tsx` | `app/markets/[id]/page.tsx` |
| Components | PascalCase `.tsx` | `MarketCard.tsx` |
| Hooks | camelCase, `use` prefix | `useMarketPrice.ts` |
| Utilities | camelCase | `formatOdds.ts` |
| Types | PascalCase `.ts` | `Market.ts` |

---

## AI Assistant Guidelines

- Before any Next.js code change, look up the relevant guide under `node_modules/next/dist/docs/`.
- Do not use patterns from Next.js 13/14/15 without verifying they still apply in v16.
- The `params` prop in pages is now a `Promise` — always `await` it: `const { id } = await params`.
- `searchParams` in pages is also a `Promise` — `await` it before use.
- Do not add `"use client"` to route segments that don't strictly need it.
- Prefer Server Actions (`"use server"`) over dedicated API routes for simple mutations.
- When uncertain about an API, read the bundled docs — they are always accurate for this version.

---

## Environment Variables

- Copy `.env.example` to `.env.local` for local development (create `.env.example` when adding secrets).
- Never commit `.env.local`, `.env`, or any file with real credentials.
- Prefix client-accessible variables with `NEXT_PUBLIC_`.

---

## Testing

> Add test setup here when tests are introduced (e.g., Vitest + Testing Library).

---

## Updating This File

- Update the **Intended directory conventions** section as new directories are created.
- Add commands to the **Development Commands** table as scripts are added.
- Document environment variables in `.env.example` and reference them here.
