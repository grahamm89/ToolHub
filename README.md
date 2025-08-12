# ToolHub (PWA) with Detergent Tool
- Start URL: ToolHub root (this page)
- Tools are listed from `tools.json`
- Detergent tool lives under `/tools/detergent/` and loads its own `products.json`
- Admin editor at `/admin.html` (password: apex-admin); double-press **E** on ToolHub to open
- Service Worker: network-first for HTML/JSON, cache-first fallback; bump `CACHE` in `sw.js` to force refresh

## Deploy (GitHub Pages)
- This repo includes a working workflow in `.github/workflows/pages.yml`

## Update data
- Use Admin page to edit and download JSONs; upload them to the repo and commit. Cache busting ensures updates appear on a normal refresh.
Built: 2025-08-12 05:10 UTC
