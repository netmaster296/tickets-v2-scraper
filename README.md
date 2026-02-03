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

Important notes / Next steps

- Replace the placeholder selectors in `scraper.js` after inspecting the real dashboard with DevTools (Transcripts tab → right-click element → Copy selector/XPath).
- Add pagination handling if there are many tickets (look for "Load more" or page links).
- Add retry / rate-limiting where necessary (`page.waitForTimeout(4000)` between ticket loads helps).
- If you want Google Drive uploads: create a service account, share a Drive folder with the service account email, put the JSON key locally, and set `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` and `GOOGLE_DRIVE_FOLDER_ID` in `.env`.

What I need from you to proceed / to make this runnable for your server

- **`TARGET_SERVER_NAME`**: exact server name as it appears in the dashboard (or confirm you'll use `.env`).
- **Selectors**: real selectors for the server card, the Transcripts tab link, ticket row container, view/open button, and transcript content area. You can paste them here or tell me to inspect a URL while you share a screenshot of DevTools.
- **Pagination behavior**: how many tickets per page and whether there is a "Load more" control.
- **Do you want Drive upload?** If yes, provide `GOOGLE_DRIVE_FOLDER_ID` and confirm you'll create a service account key (do NOT paste the key here).

Security

- Never commit `.env` or `auth.json` — both contain secrets. `.gitignore` is configured to ignore them.

Troubleshooting tips

- If session expires: re-run `npm run auth-setup` and re-save `auth.json`.
- If Playwright cannot find elements: open DevTools in `auth-setup.js` flow and copy exact selectors.

If you want, I can help by:

- Inspecting the real selectors if you paste DevTools-copied selectors here.
- Adding pagination handling once you confirm the dashboard's structure.
- Adding exponential backoff and retry logic for robustness.
