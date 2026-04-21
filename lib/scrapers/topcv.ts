import { getExistingJobUrls, upsertJobAndMatch } from "../db/job-service";
import { launchScraperBrowser, createScraperPage } from "./base-scraper";
import { extractJobFromText } from "../ai/extract-job";

export async function scrapeTopcv(keywords: string[] = ["fullstack", "frontend", "backend", "react", "nextjs", "nodejs", "dotnet"], maxNewJobs = 5) {
    const browser = await launchScraperBrowser();
    const page = await createScraperPage(browser);

    try {
        let allJobUrls: string[] = [];

        // Search for each keyword
        for (const keyword of keywords) {
            const formattedKeyword = encodeURIComponent(keyword.replace(/\s+/g, '-'));
            const searchUrl = `https://www.topcv.vn/tim-viec-lam-${formattedKeyword}`;
            console.log(`[TopCV] Searching ${keyword}...`);
            await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(2000); // give time for stealth plugin

            const urls = await page.evaluate(() => {
                return Array.from(document.querySelectorAll("a"))
                    .map((a) => a.getAttribute("href") || "")
                    .filter((href) => href.includes("/viec-lam/") && !href.includes("?ref="));
            });

            // TopCV urls might need protocol
            const fullUrls = urls.map(u => u.startsWith("http") ? u : `https://www.topcv.vn${u}`);
            allJobUrls = [...allJobUrls, ...fullUrls];
        }

        // De-duplicate in array
        const uniqueUrls = Array.from(new Set(allJobUrls));

        // Filter against Database
        const existingUrls = await getExistingJobUrls(uniqueUrls);
        const newJobs = uniqueUrls.filter(u => !existingUrls.includes(u));

        console.log(`[TopCV] Found ${newJobs.length} new jobs. Processing up to ${maxNewJobs}...`);

        let processed = 0;

        // Process new jobs
        for (const url of newJobs.slice(0, maxNewJobs)) {
            console.log(`[TopCV] Scraping details for: ${url}`);
            await page.goto(url, { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(1000);

            const textForAi = await page.evaluate(() => {
                return document.querySelector("#job-detail")?.textContent || document.body.innerText.substring(0, 2000);
            });

            if (textForAi.length < 100) continue;

            // Extract skills from AI using text
            const extracted = await extractJobFromText(textForAi);

            await upsertJobAndMatch(extracted, url, "topcv");
            processed++;

            // Extreme rate limit protection for Gemini 2.5 Pro free tier (2 RPM)
            console.log("[TopCV] Sleeping 65s for Gemini 2.5 Pro Quota...");
            await new Promise(res => setTimeout(res, 65000));
        }

        return { success: true, newJobsFound: processed };
    } catch (error) {
        console.error("[TopCV Scraper Error]", error);
        return { success: false, error: (error as Error).message };
    } finally {
        await browser.close();
    }
}
