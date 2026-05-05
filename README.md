# Frontend

React frontend for timetable management, imports, sections, schedule generation, and exports.

## Stack

- React 19
- Vite
- React Router
- TanStack Query for server state
- Zustand for client state
- Tailwind CSS
- Lucide icons
- Sentry React integration
- Playwright e2e tests

## Setup

```bash
cd frontend
npm install
```

## Run

```bash
cd frontend
npm run dev
```

The app expects the backend API to be available through the configured API base URL.
See `.env.example` for environment variables.

## Build

```bash
cd frontend
npm run build
```

## Checks

```bash
cd frontend
npm run lint
npm run test:e2e
```

## Main Structure

- `src/app` - app shell and routing setup
- `src/api` - API client and query helpers
- `src/pages` - page-level screens
- `src/features` - feature-specific logic and UI, including schedule-specific components
- `src/components` - reusable domain and UI components
- `src/components/ui` - shared UI primitives
- `src/hooks` - reusable React hooks
- `src/stores` - Zustand stores
- `src/contexts` - React contexts
- `src/i18n` - translations and language helpers
- `src/constants` - shared constants
- `src/utils` - shared utilities

## Notes

- Use TanStack Query for API fetching, caching, polling, and invalidation.
- Use Zustand for global UI/client state.
- Keep generated build output in `dist/`; it is ignored by git.
- More detailed frontend architecture notes are in `ARCHITECTURE.md`.
