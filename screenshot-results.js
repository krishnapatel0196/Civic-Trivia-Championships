const { chromium } = require('./frontend/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/kppat/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  const BASE = 'http://172.16.0.25:5173';
  const DIR  = 'D:/Claude/Empowered.vote/Civic-Trivia-Championships-master';

  // ── Idle screen ──
  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${DIR}/ss-idle.png` });
  console.log('idle saved');

  // ── Start game ──
  await page.click('button:has-text("QUICK PLAY")');

  // Wait up to 15s for first question to appear
  await page.waitForSelector('button[aria-label^="Option A"]', { timeout: 15000 });
  await page.screenshot({ path: `${DIR}/ss-question.png` });
  console.log('question saved');

  for (let i = 0; i < 12; i++) {
    try {
      await page.waitForSelector('button[aria-label^="Option A"]', { timeout: 10000 });
      await page.click('button[aria-label^="Option A"]');
      await page.waitForTimeout(200);

      const lockIn = page.locator('button:has-text("LOCK IN")');
      if (await lockIn.count() > 0) await lockIn.click();

      await page.waitForSelector('button:has-text("NEXT QUESTION"), button:has-text("LAST QUESTION"), button:has-text("GAME RECAP")', { timeout: 10000 });

      // Screenshot the reveal phase on Q1
      if (i === 0) {
        await page.screenshot({ path: `${DIR}/ss-reveal.png` });
        console.log('reveal saved');
      }

      const nextBtn = page.locator('button:has-text("NEXT QUESTION"), button:has-text("LAST QUESTION"), button:has-text("GAME RECAP")').first();
      const label = await nextBtn.textContent();
      await nextBtn.click();

      if (label?.includes('GAME RECAP')) break;

      await page.waitForTimeout(500);

      // Handle wager screen
      const lockWager = page.locator('button:has-text("PLAY FOR FUN"), button:has-text("LOCK IN WAGER")');
      if (await lockWager.count() > 0) {
        await page.screenshot({ path: `${DIR}/ss-wager.png` });
        console.log('wager saved');
        await lockWager.first().click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log(`Q${i}:`, e.message.slice(0, 100));
      await page.screenshot({ path: `${DIR}/ss-error-q${i}.png` });
      break;
    }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/ss-results.png` });
  await page.screenshot({ path: `${DIR}/ss-results-full.png`, fullPage: true });
  console.log('results saved');
  await browser.close();
})();
