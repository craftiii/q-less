\# Q-Less — Architecture



\## Project Type

Mobile-optimized React Web App (PWA-ready)

Single repo, no monorepo.



\## Folder Structure

q-less/

├── public/

│   └── icons/                  # PWA icons, QR placeholder

│

├── src/

│   ├── assets/                 # Static images, SVGs

│   │

│   ├── components/             # Pure UI only — zero business logic

│   │   ├── ui/                 # Atomic: Button, Badge, Card, Modal, Spinner

│   │   ├── queue/              # QueueCard, QueuePosition, WaitTimeBadge

│   │   ├── provider/           # ServiceCatalogItem, CustomerRow, DoneButton

│   │   └── layout/             # AppShell, BottomNav, Header

│   │

│   ├── pages/

│   │   ├── customer/

│   │   │   ├── CheckInPage.jsx         # QR landing, service selection

│   │   │   ├── QueueStatusPage.jsx     # Live queue view + GPS opt-in

│   │   │   └── NotificationPage.jsx    # "You're up next" view

│   │   ├── provider/

│   │   │   ├── DashboardPage.jsx       # Queue list + Next Customer button

│   │   │   ├── CatalogPage.jsx         # Manage services

│   │   │   └── SettingsPage.jsx        # Hours, breaks, profile

│   │   └── auth/

│   │       ├── LoginPage.jsx

│   │       └── OnboardingPage.jsx      # New providers only

│   │

│   ├── hooks/                  # All logic lives here, not in components

│   │   ├── useQueue.js                 # Supabase Realtime subscription

│   │   ├── useGeolocation.js           # GPS — always handle 3 states: precise / coarse / off

│   │   ├── useWaitTime.js              # Wait time calculation

│   │   └── useNotification.js          # Alert trigger logic

│   │

│   ├── services/               # All external calls — no fetch inside components

│   │   ├── supabase.js                 # Client init + typed helpers

│   │   ├── queueService.js             # CRUD queue entries

│   │   ├── providerService.js          # CRUD provider data

│   │   └── catalogService.js           # CRUD service catalog

│   │

│   ├── store/                  # Global state (Zustand or Context)

│   │   ├── queueStore.js

│   │   ├── providerStore.js

│   │   └── geoStore.js                 # GPS state + last known position

│   │

│   ├── utils/

│   │   ├── timeCalculator.js           # Core wait time arithmetic

│   │   ├── distanceCalculator.js       # Haversine: GPS → meters → minutes

│   │   └── qrCodeHelper.js

│   │

│   ├── config/

│   │   └── constants.js                # GPS\_POLL\_INTERVAL, ALERT\_THRESHOLD\_MIN, etc.

│   │

│   ├── router/

│   │   └── AppRouter.jsx               # React Router + route guards

│   │

│   ├── App.jsx

│   └── main.jsx

│

├── supabase/

│   └── migrations/

│       └── 001\_initial\_schema.sql

│

├── docs/

│   ├── architecture.md         # This file

│   └── schema.md

│

├── CLAUDE.md

├── .env.example

├── vite.config.js

└── tailwind.config.js



\## Key Architectural Rules



1\. \*\*No fetch/API calls in components\*\* — only in /src/services/

2\. \*\*No business logic in components\*\* — only in /src/hooks/ and /src/utils/

3\. \*\*Queue position is write-protected client-side\*\* — only updated via Supabase DB Function

4\. \*\*GPS always has exactly 3 states\*\* — precise / coarse / off — all three must be handled everywhere

5\. \*\*customer\_token is anonymous\*\* — no user account required for customers; token lives in localStorage + URL



\## Data Flow



QR Scan → CheckInPage → queueService.createEntry()

&#x20;                                   ↓

&#x20;                         Supabase queue\_entries table

&#x20;                                   ↓

&#x20;                    useQueue (Realtime subscription)

&#x20;                                   ↓

&#x20;             QueueStatusPage ← calculates wait time via useWaitTime

&#x20;                                   ↓

&#x20;                    useGeolocation (GPS polling, 3 states)

&#x20;                                   ↓

&#x20;             useNotification → triggers alert at ALERT\_THRESHOLD\_MIN



Provider side:

DashboardPage → "Done" button → queueService.markDone()

&#x20;                                   ↓

&#x20;                       DB Function recalculates positions

&#x20;                                   ↓

&#x20;                  Realtime pushes update to all subscribers



\## State Management Decision

Use Zustand (lightweight, no boilerplate).

Context only for auth state.



\## Environment Variables (.env.example)

VITE\_SUPABASE\_URL=

VITE\_SUPABASE\_ANON\_KEY=



