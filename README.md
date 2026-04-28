# Drug Compare Frontend

Next.js 15 (App Router) UI for searching the drug index. Talks to the Bun + Elysia backend over `NEXT_PUBLIC_API_URL`.

## Setup

```bash
npm install   # or pnpm / yarn / bun install
npm run dev   # runs on http://localhost:3333
```

## Pages

- `/` — landing/hero with search bar and recent items
- `/search` — full search with facet sidebar, sort, pagination
- `/product/[vendorKey]/[identityKey]` — product detail + price history chart
- `/compare/[matchKey]` — side-by-side cross-vendor comparison

Design tokens follow `og/DESIGN.md` (Clinical Precision System).
