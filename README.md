# Ledger

A personal finance tracker with a Next.js frontend and built-in backend. Accounts, authenticated transactions, and CSV exports run inside the same Vercel deployment; a separate backend host is optional.

## Deploy on Vercel

1. Create a MongoDB Atlas database (a free cluster is sufficient for development), create a database user, and configure Atlas network access for your Vercel deployment. You can provision Atlas through Vercel's Marketplace/Storage integration or directly through Atlas.
2. In the Vercel project's environment variables, securely add these for **Preview and Production**:
   - `MONGODB_URI`: the MongoDB driver connection string supplied by Atlas, with your database user's credentials. Never put it in Git or chat.
   - `JWT_SECRET`: a long random signing secret, generated locally with `openssl rand -hex 32`. Keep this value private and stable across deployments so sessions remain valid.
3. Remove `API_SERVER_URL` and `NEXT_PUBLIC_API_URL` if they point to an old or nonexistent backend. The default uses the built-in backend at `/api`.
4. Redeploy the `work` branch on Vercel. Test `/api/health`, which returns `{"status":"ok"}` only when MongoDB is reachable. Then register and try adding, listing, exporting, and deleting a transaction.

No database or signing secrets are included in this repository. Registration cannot work in production until these settings are present. Missing settings and unreachable services return useful JSON errors instead of exposing raw provider pages or connection strings.

The database name is `finance-tracker`. Connections and index initialization are reused within a warm server instance. The API sets up a unique email index and an index for each user's transaction history.

## Develop locally

Use Node.js 22.13+ (24 recommended) and npm:

```bash
npm ci
npm run dev
```

The frontend and API run together on port 3000. Without `MONGODB_URI`, development uses a temporary MongoDB instance; the first run downloads a checksum-verified binary from `fastdl.mongodb.org`. Its data is lost when stopped. For persistent local data, place `MONGODB_URI` and `JWT_SECRET` in an ignored `.env.local` file or export them into the process. Never use a temporary database for deployment.

## Verify

```bash
npm run lint
npm run build
npm run test:api
npm run test:proxy
```

API tests exercise real password hashing, JWT verification, validation, account isolation, transaction operations, and CSV escaping against an isolated database fixture. They do not test a live MongoDB connection. Proxy tests run the production Next.js API with controlled upstream responses and verify missing configuration, JSON errors, forwarding, and CSV downloads. Run proxy tests after building.

With the frontend running, browser checks cover registration (including non-JSON provider errors), session restoration, search/filter, transaction interactions, export, themes, error recovery, and responsive layouts:

```bash
npx playwright install chromium
npm run test:browser
```

Use `CHROMIUM_PATH=/usr/bin/chromium` for an existing Chromium installation. `BASE_URL` can select another running frontend (default: port 3000). Browser tests use controlled API responses; a live database smoke check is still required after configuring deployment secrets.

## Optional separate backend

The Express entry point uses exactly the same backend logic as the built-in Next.js API:

```bash
npm run dev:server
# Or:
npm run build:server
npm run start:server
```

Express defaults to port 3001. For a separate hosted API, `render.yaml` provides a Render service blueprint. Set its `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN`. Set `API_SERVER_URL` on the frontend to the backend origin (without `/api`) to use the server-side proxy instead of the built-in backend. `NEXT_PUBLIC_API_URL` remains supported for direct browser requests and requires a matching backend CORS origin.

Production hardening such as cookie-based sessions, rate limiting, and password recovery is separate work. Authentication tokens currently use browser localStorage.
