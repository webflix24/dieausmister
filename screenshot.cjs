const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  async function shot(name) {
    await page.screenshot({ path: `/tmp/crm-${name}.png` });
    console.log(`Screenshot: /tmp/crm-${name}.png`);
  }

  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await shot('01-login');

  await page.fill('input[type="email"]', 'admin@dieausmister.de');
  await page.fill('input[type="password"]', 'Admin1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await shot('02-dashboard');

  await page.goto('http://localhost:3000/customers');
  await page.waitForLoadState('networkidle');
  await shot('03-customers');

  await page.goto('http://localhost:3000/quotes');
  await page.waitForLoadState('networkidle');
  await shot('04-quotes');

  await page.goto('http://localhost:3000/tours');
  await page.waitForLoadState('networkidle');
  await shot('05-tours');

  await page.goto('http://localhost:3000/employees');
  await page.waitForLoadState('networkidle');
  await shot('06-employees');

  await browser.close();
  console.log('Done');
})();
