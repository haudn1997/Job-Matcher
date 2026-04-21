import { NextRequest, NextResponse } from "next/server";
import { scrapeItviec } from "@/lib/scrapers/itviec";
import { scrapeTopcv } from "@/lib/scrapers/topcv";

export async function GET(req: NextRequest) {
    // Optional: Verify cron secret if configured
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && process.env.NODE_ENV !== "development") {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const keywords = ["fullstack", "frontend", "backend", "react", "nextjs", "nodejs", "dotnet"];

        // Extreme limit due to Gemini 2.5 Pro (65s per job) -> max 2 jobs = 2 mins per source
        // console.log("Starting Auto Scrape Job...");
        // const itviecResult = await scrapeItviec(keywords, 2);
        // console.log("ITviec finished:", itviecResult);

        const topcvResult = await scrapeTopcv(keywords, 2);
        console.log("TopCV finished:", topcvResult);

        return NextResponse.json({
            success: true,
            // itviec: itviecResult,
            topcv: topcvResult,
        });
    } catch (err) {
        console.error("Cron scrape failed:", err);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
