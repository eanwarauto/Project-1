const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto('file://' + __dirname + '/mosaic_project_2.html');
  await p.waitForTimeout(2500);
  await p.locator('.poster').screenshot({ path: __dirname + '/mosaic_project_2.png' });
  await b.close();
})();
