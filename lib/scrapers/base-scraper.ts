import { Browser, Page } from "playwright";
const { chromium } = require("playwright-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealthPlugin);

export async function launchScraperBrowser(): Promise<Browser> {
    // Use playwright-extra stealth plugin to bypass Cloudflare
    const browser = await chromium.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--disable-gpu",
        ],
    });
    return browser;
}

export async function createScraperPage(browser: Browser): Promise<Page> {
    const context = await browser.newContext({
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        viewport: { width: 1920, height: 1080 },
        locale: "en-US",
    });

    // Block images, stylesheets, fonts to speed up scraping
    await context.route("**/*", (route) => {
        const request = route.request();
        const type = request.resourceType();
        if (["image", "stylesheet", "font", "media"].includes(type)) {
            route.abort();
        } else {
            route.continue();
        }
    });

    return context.newPage();
}

export function cleanText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}
