// auth-setup.js
const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("→ Manually log in with Discord OAuth now...");
  await page.goto('https://dashboard.tickets.bot/');

  // Wait until you see something that proves you're logged in, e.g. server list or navbar
  // Adjust URL or selector as needed after checking the real dashboard in DevTools
  try {
    await page.waitForURL('https://dashboard.tickets.bot/servers**', { timeout: 300_000 }); // 5 min
  } catch (e) {
    // Fallback: wait for a selector you inspected
    // await page.waitForSelector('text=Your Servers', { timeout: 300_000 });
  }

  console.log("→ Logged in! Saving storage state...");
  await context.storageState({ path: 'auth.json' });

  console.log("→ Done. You can now close the browser.");
  await browser.close();
})();
