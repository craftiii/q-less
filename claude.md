# Q-Less — Project Bible for Claude Code

## Project Overview
Q-Less is a mobile-optimized web app solving overcrowded waiting rooms.
Customers check in via QR code and get GPS-based notifications when they're next.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend/DB: Supabase (PostgreSQL + Realtime)
- Geolocation: Native Browser Geolocation API
- Package Manager: npm

## Build & Dev Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build

## Architecture Rules (do NOT violate)
- No fetch/API calls inside components — use /src/services/ only
- No business logic in components — use /src/hooks/ and /src/utils/
- Queue position updates only via Supabase DB Function, never client-side
- GPS has 3 explicit states: precise / coarse / off — always handle all three

## Folder Structure
@docs/architecture.md

## Database Schema
@docs/schema.md

## Coding Conventions
- Files: kebab-case (queue-card.jsx)
- Components: PascalCase
- Hooks: camelCase with "use" prefix (useQueue.js)
- DB tables: snake_case
- Constants in /src/config/constants.js with UPPER_SNAKE_CASE

## Current Phase
MVP — Scope is locked. Do not add features beyond PRD.
When unsure between two approaches, explain both and let the PO choose.