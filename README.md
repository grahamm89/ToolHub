
# Diversey Productivity Tools — Final Build

A static, installable PWA hub with category filters, instant updates, and built‑in lightweight analytics.

## Features
- ✅ **PWA**: `manifest.json` + `service-worker.js` (offline support)
- ✅ **Install prompts**:
  - Chrome/Edge desktop: green install banner
  - iOS Safari: yellow tip (“Share → Add to Home Screen”)
  - macOS Safari: blue tip (“File → Add to Dock” / “Share → Add to Dock”)
  - Firefox: no prompt (unsupported)
- ✅ **Edge‑aware label**: banner says “Install in Edge” on Edge desktop
- ✅ **No stale content**:
  - Versioned caches in service worker (`vX.Y.Z`)
  - `tools.json` fetched with `?v=Date.now()` so updates show instantly
  - `skipWaiting()` + `clients.claim()` for immediate SW activation
  - Network‑first strategy for `index.html` and `tools.json`
- ✅ **Homepage UI**: logo, title, subtitle, filter chips (All/Field/Sales/Reference), responsive cards
- ✅ **About modal**: shows version, build time, changelog
- ✅ **Hidden editor**: press **E twice quickly** to reveal “Edit Tools”, update in a modal, **Download tools.json**
- ✅ **Analytics (optional, no cookies)**: send event JSON to your webhook (page views, installs, clicks)

---

## Deploy (GitHub Web UI)
1. Create a public repo (e.g., `AppHome`).
2. **Upload** the contents of this folder (keep structure: `assets/`, `js/`, `.github/workflows/`, plus root files).
3. Settings → **Pages** → Deploy from **main / (root)**.
4. Wait for the green Pages check, then open the live URL.

> Tip: If you ever see an old version, refresh once. The SW auto‑updates with every new deploy.

---

## Update the Tools List
1. Visit the live site, press **E** twice to reveal **Edit Tools**.
2. Click **Edit Tools**, change the JSON.
3. Click **Download tools.json**.
4. On GitHub, replace `tools.json` in your repo (Upload → Commit).
5. Reload the live site — updates are instant (cache‑busted & network‑first).

---

## Configure Analytics (Optional)
- File: `js/analytics.js`
- Set your endpoint:
  ```js
  // js/analytics.js
  const ANALYTICS = {{
    WEBHOOK_URL: "https://your-endpoint.example.com/ingest"
  }};
  ```
- What’s sent (JSON):
  ```json
  {{"ts":"ISO timestamp","event":"event_name","ua":"user agent","mode":"standalone|browser","...extra"}}
  ```
- Events captured:
  - `page_view`
  - `install_prompt_shown`
  - `install_prompt_result` (outcome: accepted/dismissed)
  - `install_prompt_dismiss`
  - `filter_click` (which category)
  - `launch_click` (which app, href)

No cookies, no local storage (except install dismiss flag). Uses `navigator.sendBeacon` when available.

---

## Cache & Versioning
- Current SW cache name: `vX.Y.Z`.
- **Index & tools.json** are **network‑first** to avoid staleness.
- All other assets are cache‑first for speed.
- The SW purges old caches on activate.

**Force refresh** (rarely needed):  
- Desktop: Open DevTools → Application → Service Workers → *Update* then *Unregister* once, refresh page.  
- iOS: Close the PWA window and reopen; next launch will use the new SW.

---

## Customisation
- **Branding**: replace images in `assets/`.
- **Title/Sub‑title**: edit in `index.html`.
- **Version/Changelog**: in the About modal logic (in `js/app.js`).
- **Hide editor permanently**: remove the keyboard shortcut block in `js/app.js` and/or the Edit Tools button markup.

---

## Troubleshooting
- **Apps not loading** → Check `tools.json` is valid JSON. Verify path is `/tools.json` at repo root.
- **Install banner missing on Chrome/Edge** → Ensure you’re not in Incognito with disabled SW, and site is served via HTTPS (GitHub Pages is HTTPS).
- **Safari** → Prompts don’t exist; you’ll see the tip instead (expected behavior).
- **404 on assets** → Ensure folder names are all lowercase (`assets/`, not `Assets/`).

---

© 2025 — Diversey Productivity Tools. Distributed as-is.
