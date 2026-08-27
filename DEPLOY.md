# Deployment Guide — Real COD Order (Shopify app on Fly.io)

This is a Shopify embedded app (React Router 7 + Prisma + SQLite). It is designed to
run as a **single Fly.io machine** with the SQLite database on a **persistent volume**.

---

## 0. What you receive

- Full source (no `node_modules`, no `.git`, no `.env`, no local database).
- `Dockerfile`, `fly.toml`, `litestream.yml` — deploy config, ready to use.
- `.env.example` — the full list of environment variables.
- `dbsetup.js` — runs `prisma migrate deploy` on boot and links the DB onto the volume.

App identity is already configured in `shopify.app.toml` and `fly.toml`:

| Setting        | Value                          |
| -------------- | ------------------------------ |
| Fly app name   | `real-order`                   |
| Region         | `sin` (Singapore)              |
| App URL        | `https://real-order.fly.dev`   |
| SHOPIFY_API_KEY| `78f9b5e49d8bebc5cf3ee772d58b1136` (public client id — safe to keep) |

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

# Create the app (skip if 'real-order' already exists on your org).
# --no-deploy so we can set secrets and the volume first.
fly apps create real-order        # or: fly launch --no-deploy --copy-config --name real-order
```

### 2a. Create the persistent volume (SQLite lives here)

```bash
fly volumes create data --region sin --size 1 --app real-order
```

`fly.toml` already mounts `data` → `/data`, and `DATABASE_URL=file:/data/dev.sqlite`.

### 2b. Set secrets

Only the Shopify **API secret** is required. The rest are non-secret and already in
`fly.toml [env]`.

```bash
fly secrets set SHOPIFY_API_SECRET=<the_app_client_secret> --app real-order
```

Optional — only if you enable Litestream S3 backups (see `litestream.yml`):

```bash
fly secrets set \
  AWS_ENDPOINT_URL_S3=<s3_endpoint> \
  BUCKET_NAME=<bucket> \
  AWS_ACCESS_KEY_ID=<key> \
  AWS_SECRET_ACCESS_KEY=<secret> \
  --app real-order
```

---

## 3. Deploy

```bash
fly deploy --app real-order
```

The build uses `Dockerfile`. On boot, `fly.toml` runs
`node ./dbsetup.js npm run docker-start`, which applies Prisma migrations against
`/data/dev.sqlite` and then starts the server on port 3000.

Verify:

```bash
fly logs --app real-order
fly open --app real-order        # should load the app's login/install page
```

---

## 4. Point Shopify at the deployment

If the URL is unchanged (`https://real-order.fly.dev`) nothing to do.

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
- **Litestream** (`litestream.yml`) is optional streaming backup to S3. It is NOT
  active unless you set the `AWS_*` / `BUCKET_NAME` secrets. The Fly volume alone is
  the primary store.
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
