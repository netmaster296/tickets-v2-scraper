// scraper.js
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { chromium } = require('playwright');
const { google } = require('googleapis');
require('dotenv').config();

const AUTH_FILE = 'auth.json';
const TRANSCRIPTS_DIR = './transcripts';
const TARGET_SERVER_NAME = process.env.TARGET_SERVER_NAME || 'Persistent Bannerlord NA';

function extractDriveFolderId(input) {
  if (!input) return null;
  // If user provided a full Drive URL, extract the folder id
  // Handles patterns like:
  // https://drive.google.com/drive/folders/<id>
  // https://drive.google.com/drive/u/3/folders/<id>
  // or just the id itself
  try {
    const url = input.trim();
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
    // If it looks like an ID already (no slashes)
    if (!url.includes('/')) return url;
  } catch (e) {}
  return null;
}

async function uploadToDrive(filePath, fileName, folderId) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || !folderId) {
    console.log(`Skipping Drive upload (no key/folder). File saved locally: ${filePath}`);
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = { body: fs.createReadStream(filePath) };

  const res = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, webViewLink',
  });

  console.log(`Uploaded: ${fileName} → ${res.data.webViewLink}`);
}

(async () => {
  if (!fs.existsSync(AUTH_FILE)) {
    console.error("No auth.json found. Run auth-setup.js first (headed login).");
    process.exit(1);
  }

  if (!fs.existsSync(TRANSCRIPTS_DIR)) await fsp.mkdir(TRANSCRIPTS_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE });
  const page = await context.newPage();

  try {
    await page.goto('https://dashboard.tickets.bot/');

    // Quick check if still authenticated — adjust selector/text to match real page
    if ((await page.locator('text=You are not logged in').count()) > 0) {
      throw new Error("Session expired. Re-run auth-setup.js in headed mode.");
    }

    // 1. Go to your server page (assumes server cards have visible text)
    await page.getByText(TARGET_SERVER_NAME).first().click();
    await page.waitForLoadState('networkidle');

    // 2. Navigate to Transcripts tab — adjust as needed
    await page.getByRole('link', { name: /transcripts/i }).click();
    await page.waitForLoadState('networkidle');

    // 3. Find all ticket rows / view buttons
    // !!! PLACEHOLDER SELECTORS — inspect real page and replace !!!
    const ticketRows = page.locator('div.card, tr, div[class*="ticket-row"]'); // placeholder

    const count = await ticketRows.count();
    console.log(`Found ≈ ${count} tickets/transcripts`);

    for (let i = 0; i < count; i++) {
      const row = ticketRows.nth(i);

      // Try to get ticket ID or title for filename (adjust selectors)
      let ticketId = `ticket-${i + 1}`;
      try {
        const maybe = await row.locator('[data-ticket-id]').first().textContent();
        if (maybe) ticketId = maybe.trim();
      } catch (e) {
        // ignore
      }

      // Click "View" / open transcript — adjust button selector text
      await row.getByRole('button', { name: /view|open|transcript/i }).click();
      await page.waitForLoadState('networkidle');

      // Wait for transcript content area to load (placeholder)
      await page.waitForSelector('div[class*="transcript"], pre, .message-list', { timeout: 30_000 });

      // Option A: Save full HTML (includes styling)
      const html = await page.content();
      const safeName = ticketId.replace(/[\\/:*?"<>|]/g, '_');
      const htmlPath = path.join(TRANSCRIPTS_DIR, `${safeName}.html`);
      await fsp.writeFile(htmlPath, html, 'utf8');
      console.log(`Saved HTML: ${htmlPath}`);

      // Upload (if configured)
      const driveFolderId = extractDriveFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID);
      await uploadToDrive(htmlPath, `${safeName}.html`, driveFolderId);

      // Optional: polite rate limit between items
      await page.waitForTimeout(2000);

      // Go back to list
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }

  } catch (err) {
    console.error("Scrape failed:", err);
    try { await page.screenshot({ path: 'error.png', fullPage: true }); } catch (e) {}
  } finally {
    await browser.close();
  }
})();
