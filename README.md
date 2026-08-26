# MyCSD Hunter

A lightweight Svelte event browser generated from Telegram channel exports. Regular expressions extract and deduplicate events into static JSON for GitHub Pages, while the included Node server provides an optional SQLite-backed API.

## Requirements

- Node.js 24 or newer

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The development command regenerates `public/events.json` before starting Vite, so no backend is required.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` tests the parser, generates the event JSON, builds the Svelte app with the `/MyCSD-Hunter/` base path, and deploys `dist/` whenever `main` is pushed.

In the repository settings, select **Settings > Pages > Build and deployment > Source > GitHub Actions**. The deployed site will be available at:

`https://wanadamm.github.io/MyCSD-Hunter/`

Update `messages.txt`, commit it, and push to publish refreshed events.

## Calendar Export

Each scheduled item can be added directly to Google Calendar or downloaded as an Apple Calendar `.ics` file. The calendar view also provides Google and Apple subscription links for the complete feed:

`https://wanadamm.github.io/MyCSD-Hunter/calendar.ics`

Calendar entries are exported as all-day items because Telegram time formats are inconsistent. Any extracted time and platform details remain available in the calendar description. Subscription updates are controlled by the calendar provider and may take several hours after a new deployment.

## Optional Backend

To use the SQLite-backed read API locally or on a Node hosting provider:

```bash
npm run import
npm run build
npm start
```

Open `http://localhost:3000`. The API is available at `/api/events` and `/api/health`.

## Commands

- `npm run export:static` creates the JSON and static assets consumed by Vite.
- `npm run import` rebuilds the optional SQLite tables from `messages.txt`.
- `npm test` runs parser checks against English and Malay message formats.
- `npm run build` exports events and creates the production bundle in `dist/`.

Only messages with event intent and structured details are promoted to events. Information found only inside poster images cannot be extracted from the text export, so those cards link to the original Telegram post. GitHub Pages serves static files only; SQLite is not used by the Pages deployment.
