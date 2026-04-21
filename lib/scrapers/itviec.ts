import { getExistingJobUrls, upsertJobAndMatch } from "../db/job-service";
import { launchScraperBrowser, createScraperPage } from "./base-scraper";
import { extractJobFromText } from "../ai/extract-job";

export async function scrapeItviec(keywords: string[] = ["fullstack", "frontend", "backend", "react", "nextjs", "nodejs", "dotnet"], maxNewJobs = 5) {
    const browser = await launchScraperBrowser();
    const page = await createScraperPage(browser);

    try {
        let allJobUrls: { title: string; url: string }[] = [];

        // Search for each keyword
        for (const keyword of keywords) {
            const searchUrl = `https://itviec.com/it-jobs/${encodeURIComponent(keyword)}`;
            console.log(`[ITviec] Searching ${keyword}...`);
            await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(2000); // give time for stealth plugin & react

            const jobs = await page.evaluate(() => {
                return Array.from(document.querySelectorAll(".job-card")).map((el) => {
                    const a = el.querySelector("h3 a");
                    return {
                        title: a ? (a as HTMLElement).innerText : "",
                        url: a ? a.getAttribute("href") : "",
                    };
                }).filter((j) => j.url);
            });

            // format URLs and collect them
            const fullUrls = jobs.map(j => ({
                ...j,
                url: j?.url?.startsWith("http") ? j.url : `https://itviec.com${j.url}`
            }));

            allJobUrls = [...allJobUrls, ...fullUrls];
        }

        // De-duplicate in array
        const uniqueMap = new Map();
        allJobUrls.forEach(j => uniqueMap.set(j.url, j));
        const uniqueJobs = Array.from(uniqueMap.values());

        // Filter against Database
        const existingUrls = await getExistingJobUrls(uniqueJobs.map(j => j.url));
        const newJobs = uniqueJobs.filter(j => !existingUrls.includes(j.url));

        console.log(`[ITviec] Found ${newJobs.length} new jobs. Processing up to ${maxNewJobs}...`);

        let processed = 0;

        // Process new jobs
        for (const job of newJobs.slice(0, maxNewJobs)) {
            console.log(`[ITviec] Scraping details for: ${job.url}`);
            await page.goto(job.url, { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(1000);

            const textForAi = await page.evaluate(() => {
                return document.querySelector(".job-details")?.textContent || document.body.innerText.substring(0, 2000);
            });

            if (textForAi.length < 100) continue;

            // Extract skills from AI using text
            const extracted = await extractJobFromText(textForAi);

            // Override title with the exact title given by ITviec search to be safe
            extracted.title = job.title;

            await upsertJobAndMatch(extracted, job.url, "itviec");
            processed++;

            // Extreme rate limit protection for Gemini 2.5 Pro free tier (2 RPM)
            // Each job takes 2 requests (1 extract + 1 match). We sleep 65s before next job.
            console.log("[ITviec] Sleeping 65s for Gemini 2.5 Pro Quota...");
            await new Promise(res => setTimeout(res, 65000));
        }

        return { success: true, newJobsFound: processed };
    } catch (error) {
        console.error("[ITviec Scraper Error]", error);
        return { success: false, error: (error as Error).message };
    } finally {
        await browser.close();
    }
}
