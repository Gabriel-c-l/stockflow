# StockFlow Frontend

React + TypeScript application built with Vite. The interface language is English and the visual system follows the StockFlow Figma file.

## Requirements

- Node.js 24 (the same runtime line used by the backend)
- npm
- StockFlow API running on `http://localhost:3333`

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite serves the app at `http://localhost:5173`. Requests to `/api/*` are proxied to the backend and have the `/api` prefix removed. Set `VITE_API_PROXY_TARGET` when the API runs elsewhere.

The backend CORS allowlist must include `http://localhost:5173` (`CORS_ORIGINS` in `backend/.env`). Browser requests use credentials because authentication is backed by an HttpOnly session cookie.

## Scripts

- `npm run dev` — start the development server.
- `npm run typecheck` — run TypeScript project checks.
- `npm run build` — typecheck and create a production build.
- `npm run preview` — preview the production build.

## Structure

```text
src/
├── app/                 # Application routes and composition
├── components/
│   ├── layout/          # Sidebar, topbar and application shell
│   └── ui/              # Shared UI primitives
├── features/             # Feature-level pages
│   └── dashboard/
├── lib/                  # API client, domain types and helpers
├── styles/               # Global styles and design tokens
└── main.tsx
```

## API integration status

The API client currently reflects the routes and data models present in `backend/src`: health, session authentication, products and product stock-movement history, plus stock movement creation. Suppliers, categories, user administration and reports remain placeholders until their backend contracts are implemented.

The dashboard currently uses clearly marked sample values for layout validation. Replace them with API-backed data when aggregate dashboard endpoints are available.
