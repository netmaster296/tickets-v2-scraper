# tickets-v2-scraper

This repository is a fragile foundation for scraping the transcripts tab on https://dashboard.tickets.bot using Playwright. It requires manually capturing login state (`auth.json`) and updating many selectors after inspecting the real dashboard in DevTools.

Quick start

1. Install dependencies and Playwright browsers:

```bash
npm install
npx playwright install
```

2. Create `.env` by copying `.env.example` and updating values.

3. Run manual auth setup (headed):

```bash
npm run auth-setup
```

Follow the browser to log in via Discord OAuth. This will save `auth.json`.

4. Run the scraper (headless):

```bash
npm run scrape
```

Troubleshooting tips

- If session expires: re-run `npm run auth-setup` and re-save `auth.json`.
- If Playwright cannot find elements: open DevTools in `auth-setup.js` flow and copy exact selectors.
