# i-Share Rental Marketplace

i-Share is a production-oriented multi-vendor rental marketplace foundation.

This repository currently contains the Phase 1-7 foundation: documentation, architecture notes, a React/Vite client, an Express/TypeScript server, Prisma setup, authentication, vendor verification, subscription management, vendor product and availability management, and public marketplace product discovery.

Later marketplace workflows such as bookings, payments, reviews, notifications, dashboards, analytics, and production hardening remain intentionally deferred to future phases.

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL

## Setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Update `server/.env` with local development values before using Prisma or database-backed features.

## Development

Run both apps:

```bash
npm run dev
```

Run only the backend:

```bash
npm run dev:server
```

Run only the frontend:

```bash
npm run dev:client
```

Default URLs:

- Client: `http://localhost:5173`
- Server: `http://localhost:4000`
- Health: `http://localhost:4000/api/v1/health`

## Quality

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

## Documentation

Start with:

- `docs/requirements.md`
- `docs/business-rules.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/api.md`
- `docs/implementation-plan.md`

The complete business specification file was not present during initialization. Requirements that need confirmation are documented under "Decision Required".
