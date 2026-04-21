const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealthPlugin);

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();
    console.log('Navigating with stealth...');
    await page.goto('https://itviec.com/it-jobs/full-stack', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log('Title:', title);

    const html = await page.content();
    console.log('Contains job-card?', html.includes('job-card'));
    if (html.includes('Cloudflare')) {
        console.log('Cloudflare DETECTED!');
    } else {
        console.log('Count:', await page.evaluate(() => document.querySelectorAll('.job-card').length));
    }

    await browser.close();
})();
