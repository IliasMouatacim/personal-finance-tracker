# Ledger

A personal finance tracker built with Next.js, React, Express, and MongoDB. The interface includes a responsive overview, transaction search and filtering, category and monthly charts, CSV export, and light/dark themes.

## Develop locally

Use Node.js 22.13+ (Node.js 24 is recommended) and npm.

```bash
npm ci
npm run dev:server
```

In a second terminal:

```bash
npm run dev
```

The frontend runs on port 3000 and proxies `/api` to the Express backend on port 3001. You do not need a frontend environment file for this default workflow.

When `MONGODB_URI` is absent, the API starts a temporary MongoDB instance using `mongodb-memory-server`. Its first run downloads a checksum-verified binary from `fastdl.mongodb.org`. Data in this mode is disposable and is lost when the database stops. For persistent data, supply `MONGODB_URI` to the backend process.

Optional frontend settings are documented in `.env.local.example`; backend settings are in `server/.env.example`. Backend environment variables must be exported into the server process; `ts-node` does not load `.env` files automatically. `API_SERVER_URL` changes the frontend proxy destination. `NEXT_PUBLIC_API_URL` is only needed when directly calling a separately hosted API; configure that frontend origin in backend `CORS_ORIGIN`.

## Verify

```bash
npm run lint
npm run build
npm run build:server
```

Browser smoke checks use controlled API responses and cover registration, session restoration, transaction interactions, export, themes, error recovery, and responsive layout. They do not replace a live database integration test. With the frontend running:

```bash
npx playwright install chromium
npm run test:browser
```

To use an existing Chromium installation, set `CHROMIUM_PATH=/usr/bin/chromium`. Optional `BASE_URL` selects another running frontend (default: port 3000).

For live API validation, start the backend and check `/api/health`, then register/login and create, list, export, and delete a transaction using its bearer token. Keep real credentials and tokens out of logs.

## Production

```bash
npm run build
npm run build:server
npm run start:server
# Start the frontend separately:
npm run start
```

Set a persistent `MONGODB_URI` and a strong `JWT_SECRET`; production startup rejects a missing JWT secret. Configure `CORS_ORIGIN` explicitly when exposing the API to a separate frontend. The default local signing key is for development only. Authentication tokens are currently stored in browser localStorage; cookie-based sessions, rate limiting, password recovery, and deployment hardening remain separate production improvements.
