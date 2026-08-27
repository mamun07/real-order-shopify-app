# Deployment Guide — Real COD Order (Shopify app on Fly.io)

This is a Shopify embedded app (React Router 7 + Prisma + SQLite). It is designed to
run as a **single Fly.io machine** with the SQLite database on a **persistent volume**.

---

## 0. What you receive

- Full source (no `node_modules`, no `.git`, no `.env`, no local database).
- `Dockerfile`, `fly.toml` — deploy config, ready to use.
- `.env.example` — the full list of environment variables.
- `dbsetup.js` — runs `prisma migrate deploy` on boot and links the DB onto the volume.

App identity is already configured in `shopify.app.toml` and `fly.toml`:

| Setting        | Value                          |
| -------------- | ------------------------------ |
| Fly app name   | `real-cod-order`                   |
| Region         | `sin` (Singapore)              |
| App URL        | `https://real-cod-order.fly.dev`   |
| SHOPIFY_API_KEY| `e35e650f256067d020670921f7a25ed0` (public client id — safe to keep) |
| SHOPIFY_API_SECRET | set as a Fly secret — the API **secret key** of the same app in Partner Dashboard |

> If you deploy under a **different Fly app name / URL**, update `app` and
> `SHOPIFY_APP_URL` in `fly.toml`, `application_url` + `redirect_urls` in
> `shopify.app.toml`, then run `npm run deploy` (Shopify CLI) to push the config.

---

## 1. Prerequisites

- Node.js 20.19+ (`node -v`)
- `flyctl` — https://fly.io/docs/flyctl/install/
- A Fly.io account with billing enabled
- The Shopify app **client secret** (from Partner Dashboard → this app → Client credentials).
  The client id is public; the secret is not and is NOT in this bundle.

---

## 2. First-time setup

```bash
npm install

# Log in to Fly
fly auth login

# Create the app (skip if 'real-cod-order' already exists on your org).
# --no-deploy so we can set secrets and the volume first.
fly apps create real-cod-order        # or: fly launch --no-deploy --copy-config --name real-cod-order
```

### 2a. Create the persistent volume (SQLite lives here)

```bash
fly volumes create data --region sin --size 1 --app real-cod-order
```

`fly.toml` already mounts `data` → `/data`, and `DATABASE_URL=file:/data/dev.sqlite`.

### 2b. Set secrets

Only the Shopify **API secret** is required. The rest are non-secret and already in
`fly.toml [env]`.

```bash
fly secrets set SHOPIFY_API_SECRET=<the_app_client_secret> --app real-cod-order
```

That is the only secret. Everything else is in `fly.toml [env]`.

> This app does **not** use object storage (Tigris/S3). If the Fly launcher tries to
> create a Tigris bucket, that step is safe to skip — persistence comes from the
> `data` volume alone.

---

## 3. Deploy

```bash
fly deploy --app real-cod-order
```

The build uses `Dockerfile`. On boot, `fly.toml` runs
`node ./dbsetup.js npm run docker-start`, which applies Prisma migrations against
`/data/dev.sqlite` and then starts the server on port 3000.

Verify:

```bash
fly logs --app real-cod-order
fly open --app real-cod-order        # should load the app's login/install page
```

---

## 4. Point Shopify at the deployment

If the URL is unchanged (`https://real-cod-order.fly.dev`) nothing to do.

Otherwise, in `shopify.app.toml` update `application_url` and every entry in
`[auth].redirect_urls`, set `client_id`, then from a machine with the Shopify CLI:

```bash
npm run deploy      # pushes app config + extensions to Shopify
```

Then reinstall the app on the test store.

---

## 5. Important notes

- **Single instance only.** SQLite + one volume = do not scale past 1 machine.
  `min_machines_running = 0` with `auto_start_machines` is fine (cold start on request).
- **Database persistence** depends entirely on the `data` volume + `DATABASE_URL`
  pointing at `/data`. Both are already wired in `fly.toml`. Don't remove the mount.
- **No object storage.** This app has no Tigris/S3 dependency. If the Fly launcher
  offers to create a Tigris bucket, skip it. For DB backups later, use
  `fly volumes snapshots` or add Litestream separately.
- `extensions/real-order-cod` is a theme app extension; it ships to Shopify via
  `npm run deploy`, not via Fly.
- CI: `.github/workflows/fly-deploy.yml` auto-deploys on push to `main`/`master`
  when a `FLY_API_TOKEN` repo secret is set (`fly tokens create deploy`).

---

## 6. Local development (optional, for testing changes)

```bash
cp .env.example .env      # fill in SHOPIFY_API_SECRET
npm install
npm run dev               # Shopify CLI: tunnel + hot reload
```
