# AppHome

A simple PWA hub for quick access to tools defined in `tools.json`.

## Quick start (no terminal)
1. Create a new GitHub repo and upload these files (keep the folders).
2. Enable **GitHub Pages** from the repo **Settings → Pages**. Choose **Deploy from a branch**, branch **main**, folder **/**.
3. Wait for the deploy badge to turn **green**, then open the published URL.

## Edit your tools
- Update `tools.json` with your links and labels.
- No build is required. Commit and the site updates automatically.

## PWA
- `manifest.json` and `service-worker.js` are included.
- The app will cache core files for offline use after the first visit.
