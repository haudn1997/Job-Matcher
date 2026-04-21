import { prisma } from "./prisma";
import { ExtractedJob } from "../ai/extract-job";
import { matchJobWithSkills } from "../ai/match-skills";
import { sendJobAlert } from "../notifications/telegram";

export async function upsertJobAndMatch(
    extracted: ExtractedJob,
    jobUrl: string,
    source: string,
    externalId?: string
) {
    // Save job to DB
    const job = await prisma.job.upsert({
        where: { url: jobUrl },
        update: {
            title: extracted.title || "Unknown Title",
            company: extracted.company || "Unknown Company",
            location: extracted.location,
            isRemote: extracted.isRemote,
            salaryMin: extracted.salaryMin,
            salaryMax: extracted.salaryMax,
            currency: extracted.currency,
            jobType: extracted.jobType,
            seniority: extracted.seniority,
            description: extracted.description,
            requiredSkills: extracted.requiredSkills,
            niceToHave: extracted.niceToHave,
            postedAt: extracted.postedAt ? new Date(extracted.postedAt) : null,
            expiresAt: extracted.expiresAt ? new Date() : null,
            source,
            externalId,
        },
        create: {
            title: extracted.title || "Unknown Title",
            company: extracted.company || "Unknown Company",
            location: extracted.location,
            isRemote: extracted.isRemote,
            salaryMin: extracted.salaryMin,
            salaryMax: extracted.salaryMax,
            currency: extracted.currency,
            jobType: extracted.jobType,
            seniority: extracted.seniority,
            description: extracted.description,
            url: jobUrl,
            source,
            externalId,
            requiredSkills: extracted.requiredSkills,
            niceToHave: extracted.niceToHave,
            postedAt: extracted.postedAt ? new Date(extracted.postedAt) : null,
            expiresAt: extracted.expiresAt ? new Date() : null,
        },
    });

    // Auto-run matching
    const userSkills = await prisma.userSkill.findMany();
    if (userSkills.length > 0) {
        const matchResult = await matchJobWithSkills(
            userSkills.map((s) => ({ name: s.name, level: s.level, yearsExp: s.yearsExp })),
            extracted.requiredSkills,
            extracted.niceToHave,
            extracted.title
        );

        const savedMatch = await prisma.jobMatch.upsert({
            where: { jobId: job.id },
            update: matchResult,
            create: { jobId: job.id, ...matchResult },
        });

        // Send Telegram alert for high-match new jobs (score >= 75)
        if (matchResult.matchScore >= 50) {
            sendJobAlert({ ...job, match: savedMatch }).catch(() => { });
        }
    }

    const jobWithMatch = await prisma.job.findUnique({
        where: { id: job.id },
        include: { match: true },
    });

    return jobWithMatch;
}

export async function getExistingJobUrls(urls: string[]) {
    const existing = await prisma.job.findMany({
        where: { url: { in: urls } },
        select: { url: true },
    });
    return existing.map((e) => e.url);
}
