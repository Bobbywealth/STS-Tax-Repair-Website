# Testing & Monitoring (Render)

This repo currently does not include a full unit/E2E test suite. To make production issues (especially login/session issues) easier to catch, we provide:

- `/api/health`: a lightweight health endpoint for Render
- `npm run smoke`: a repeatable smoke test that validates login + session persistence against any environment (including your live Render URL)

## Quick checks (local)

- **Typecheck**: `npm run check`
- **Build**: `npm run build`

## Render health check

Configure your Render Web Service:

- **Health Check Path**: `/api/health`

`/api/health` returns:

- **200**: app + DB OK
- **503**: app is running but DB is unavailable (login will not work reliably)

## Smoke test (against Render)

The smoke test:

- calls `/api/health`
- logs in (admin and/or client)
- calls `/api/auth/user` using the returned session cookie
- logs out (`/api/logout`)
- verifies `/api/auth/user` returns `null` after logout

### Run admin flow

```bash
BASE_URL="https://YOUR-RENDER-URL" \
SMOKE_MODE=admin \
SMOKE_ADMIN_EMAIL="admin@example.com" \
SMOKE_ADMIN_PASSWORD="yourpassword" \
npm run smoke
```

### Run client flow

```bash
BASE_URL="https://YOUR-RENDER-URL" \
SMOKE_MODE=client \
SMOKE_CLIENT_EMAIL="client@example.com" \
SMOKE_CLIENT_PASSWORD="yourpassword" \
npm run smoke
```

### Run both (if both creds are set)

```bash
BASE_URL="https://YOUR-RENDER-URL" \
SMOKE_ADMIN_EMAIL="admin@example.com" \
SMOKE_ADMIN_PASSWORD="yourpassword" \
SMOKE_CLIENT_EMAIL="client@example.com" \
SMOKE_CLIENT_PASSWORD="yourpassword" \
npm run smoke
```

## Notes on login complaints

Many “login works once, then logs out / refresh breaks” issues come from session cookies not being set/sent correctly. The smoke test will fail loudly if:

- login returns **no `Set-Cookie`** header
- `/api/auth/user` returns `null` immediately after login (session not persisted)




