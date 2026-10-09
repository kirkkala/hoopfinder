<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Hoop Finder

Outdoor basketball courts in Finland. The UI is Finnish by default, with an English toggle. User-facing copy is in `src/lib/copy.ts`.

## Code

Keep the codebase boring and easy for another person to follow.

- Use the Next.js and React patterns already in this repo.
- Prefer a small, explicit change. Add a dependency, abstraction, or extra file only when the current code cannot do the job.
- Leave a component in one file until that file is hard to read. Reuse code when the same logic is already repeated.
- Keep client components and shared state small. Shared logic belongs in `src/lib`.
- For a visible change, check small screens and that the page still works with the keyboard.
- Respect biome rules

## Testing

- Use the vitest test setup
- Whenever changing code change tests respectively
- When introducing new functionalities add tests

## Data

The public map reads `data/courts.json`. It does not call LIPAS, Overpass, or Nominatim while the app is running. Refresh that file with `npm run refresh-courts`.

Visitor submissions are rows in Postgres. Local court photos are files in `data/court-images`. Production photos use Vercel Blob.

Keep the OpenStreetMap credit on court pages and in the footer.

## Git

Never create git commits. The maintainer commits locally.

## Local setup

Ask before starting Postgres or `npm run dev`. With `EMAIL_LOG_ONLY=1`, confirmation mail is printed in the terminal.
