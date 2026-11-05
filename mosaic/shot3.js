const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
  await p.goto('file://' + __dirname + '/fish_mosaic_A4.html');
  await p.waitForTimeout(2500);
  await p.pdf({ path: __dirname + '/fish_mosaic_A4.pdf', format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
  await p.screenshot({ path: __dirname + '/fish_mosaic_A4.png' });
  await b.close();
})();
