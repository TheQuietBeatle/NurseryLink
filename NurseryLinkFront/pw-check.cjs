const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.stack || err.message}`));

  await page.route('**/children/account/*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '1',
          parent_id: '1',
          account_id: '1',
          class_id: '1',
          name: 'Test Child',
          date_of_birth: '2021-05-01',
          summary_log: 'Doing great.',
          enrolled_at: '2024-01-01T00:00:00.000Z',
        },
      ]),
    })
  );
  await page.route('**/temperature/*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, child_id: 1, log_type: 'temp', activity_timestamp: '2024-01-01T09:00:00.000Z', degree_celsius: 36.6 },
      ]),
    })
  );

  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.setItem(
      'account',
      JSON.stringify({ id: '1', full_name: 'Test Parent', email: 'test@example.com', role: 'parent' })
    );
  });

  await page.goto('http://localhost:5173/parent');
  await page.waitForTimeout(1500);

  try {
    await page.getByText('Test Child', { exact: false }).click({ timeout: 5000 });
  } catch (e) {
    console.log('Could not click child card:', e.message);
  }

  await page.waitForTimeout(1500);

  console.log('--- Child dashboard URL ---');
  console.log(page.url());

  console.log('--- Child dashboard text ---');
  console.log(await page.locator('body').innerText());

  console.log('--- Console / page errors ---');
  console.log(consoleMsgs.join('\n') || '(none)');

  await browser.close();
})();
