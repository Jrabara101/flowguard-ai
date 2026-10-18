# Deploying FlowGuard to Google Cloud

One Cloud Run service runs everything: Nginx serves the React app and sends `/api/*` to Laravel (PHP-FPM).
Data lives in Cloud SQL (MySQL 8). Gemini is called through Vertex AI with the service account, so there is no API key anywhere.

| Thing | Value |
|---|---|
| Project | `flowguard-ai-2026` |
| Region | `asia-southeast1` (Singapore) |
| Service | `flowguard`, https://flowguard-79354024474.asia-southeast1.run.app |
| Image | `asia-southeast1-docker.pkg.dev/flowguard-ai-2026/flowguard/app:<tag>` |
| Service account | `flowguard-run@flowguard-ai-2026.iam.gserviceaccount.com` (Vertex AI User, Cloud SQL Client, Secret Manager Secret Accessor) |
| Database | Cloud SQL `flowguard-db` (MySQL 8.0, db-f1-micro), database and user `flowguard` |
| Secrets | `flowguard-app-key` (APP_KEY), `flowguard-db-password` (DB_PASSWORD) |
| Gemini | Flash `gemini-3.8-flash` for scoring, Pro `gemini-3.1-pro-preview` for the Copilot (fallback `gemini-2.5-pro`), location `global` |
| Firebase Hosting | https://flowguard-ai-2026.web.app, every request rewritten to the Cloud Run service (`firebase.json`) |
| Firestore | `(default)` database in asia-southeast1, collection `activity` = the live feed (`firestore.rules`: public read, no browser writes) |

## CI/CD (GitHub Actions, `.github/workflows/ci-cd.yml`)

| When | What runs |
|---|---|
| Any pull request, any push | **Tests and build:** 60 backend tests (Gemini faked, free) and the React build |
| Push or merge to `main` | The above, then **Deploy:** build the image (tagged with the commit), deploy it to Cloud Run with **no traffic** as the `candidate` tag, run `docker/smoke-test.sh` against that preview URL, and only if it passes move live traffic to it |

- A failed smoke test leaves the live site on the previous revision. The preview URL is in the run summary.
- Run it by hand: GitHub, Actions, CI/CD, Run workflow (choose `main`).
- No keys: GitHub signs in through Workload Identity Federation (pool `github`, provider `flowguard-repo`), which only accepts this repository's `main` branch. It acts as `github-deployer`, which can only deploy Cloud Run, push to the `flowguard` image repository and run the service as `flowguard-run`.
- Each deploy runs the smoke test, which makes a few Gemini calls (a cent or two).
- During judging, avoid merging to `main` unless it is a fix: every merge goes live after the smoke test.

## Firebase (Hosting + Firestore)

- The app's public link is **https://flowguard-ai-2026.web.app**. Firebase Hosting forwards every path to Cloud Run, so it always shows whatever Cloud Run serves (requests over 60 s are cut off by Hosting; ours take 10–20 s at most).
- Each Gemini score and staff decision is written to Firestore `activity` after the response (`app/Services/Firebase/ActivityFeed.php`), only when `FIRESTORE_ACTIVITY_FEED=true` is set on the service. No names or phone numbers.
- The Analytics page streams that collection live with the Firebase JS SDK (`src/components/LiveActivity.jsx`).
- Change `firebase.json` or `firestore.rules`, then: `firebase deploy --only "firestore:rules,hosting" --project flowguard-ai-2026` (uses your gcloud login). App code changes need no Firebase deploy.
- Cost: inside the free allowances (Hosting 10 GB/month; Firestore 50k reads and 20k writes a day).

## Ship a new version by hand

```sh
# 1. Build in the cloud (about 5 minutes). Docker Desktop is not needed.
gcloud builds submit --tag asia-southeast1-docker.pkg.dev/flowguard-ai-2026/flowguard/app:v4 .

# 2. Roll it out (keeps all settings and secrets)
gcloud run services update flowguard --region=asia-southeast1 \
  --image=asia-southeast1-docker.pkg.dev/flowguard-ai-2026/flowguard/app:v4

# 3. Check it
sh docker/smoke-test.sh https://flowguard-79354024474.asia-southeast1.run.app
```

Roll back: `gcloud run services update-traffic flowguard --region=asia-southeast1 --to-revisions=<previous-revision>=100`
(list revisions with `gcloud run revisions list --service=flowguard --region=asia-southeast1`).

## How the container starts (`docker/start.sh`)

1. Sets the Nginx port from `$PORT`.
2. Caches config, routes and views.
3. With `RUN_MIGRATIONS=true`: runs migrations, and seeds the demo data only if the `orders` table is empty, so restarts never duplicate data.
4. Starts PHP-FPM, then Nginx.

## Demo data in production

- Seeding: automatic on the first start against an empty database (2,000 past orders, 30 pending, all synthetic).
- Fill the Action Queue: each `POST /api/queue/simulate` has Gemini score the next pending order (send a body, e.g. `-d '{}'`, or Google's front end answers 411).
- Backtest for the dashboard: run the job (about 12 minutes, a few cents of Gemini):
  `gcloud run jobs execute flowguard-backtest --region=asia-southeast1 --wait`

## Cost (budget alert "FlowGuard hackathon cap", $25/month)

- Cloud SQL db-f1-micro + 10 GB HDD: about $9–11/month while it runs. This is the main cost.
- Cloud Run: scales to zero, effectively free at demo traffic.
- Gemini: fractions of a cent per scored order.

After judging, stop the database (data is kept, billing for compute stops):
`gcloud sql instances patch flowguard-db --activation-policy=NEVER`
Start it again with `--activation-policy=ALWAYS`. Delete everything with `gcloud projects delete flowguard-ai-2026` only when the project is truly finished.

## Local development

```sh
php artisan serve            # API on http://127.0.0.1:8000
npm run dev                  # React on http://127.0.0.1:5173, /api is proxied to :8000
```
Locally, Gemini auth falls back to `gcloud auth print-access-token`.
