import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractJobFromText } from "@/lib/ai/extract-job";
import { matchJobWithSkills } from "@/lib/ai/match-skills";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const minScore = searchParams.get("minScore");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") ?? "score";
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 20;

  const matchWhere: Record<string, unknown> = {};
  if (status) matchWhere.status = status;
  if (minScore) matchWhere.matchScore = { gte: parseFloat(minScore) };

  const jobWhere: Record<string, unknown> = {};
  if (source) jobWhere.source = source;
  if (search) {
    jobWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Record<string, unknown>[] =
    sort === "score"
      ? [{ match: { matchScore: "desc" } }]
      : sort === "date"
      ? [{ scrapedAt: "desc" }]
      : [{ match: { matchScore: "desc" } }];

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where: {
        ...jobWhere,
        match: matchWhere,
      },
      include: { match: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({
      where: { ...jobWhere, match: matchWhere },
    }),
  ]);

  return NextResponse.json({
    jobs,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, url } = body as { text: string; url?: string };

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description too short. Please provide at least 50 characters." },
        { status: 400 }
      );
    }

    // Extract job data with AI
    const extracted = await extractJobFromText(text);

    // Generate unique URL if not provided
    const jobUrl = url || `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Save job to DB
    const job = await prisma.job.upsert({
      where: { url: jobUrl },
      update: {
        title: extracted.title,
        company: extracted.company,
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
        source: url ? "manual-url" : "manual",
      },
      create: {
        title: extracted.title,
        company: extracted.company,
        location: extracted.location,
        isRemote: extracted.isRemote,
        salaryMin: extracted.salaryMin,
        salaryMax: extracted.salaryMax,
        currency: extracted.currency,
        jobType: extracted.jobType,
        seniority: extracted.seniority,
        description: extracted.description,
        url: jobUrl,
        source: url ? "manual-url" : "manual",
        requiredSkills: extracted.requiredSkills,
        niceToHave: extracted.niceToHave,
        postedAt: extracted.postedAt ? new Date(extracted.postedAt) : null,
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

      await prisma.jobMatch.upsert({
        where: { jobId: job.id },
        update: matchResult,
        create: { jobId: job.id, ...matchResult },
      });
    }

    const jobWithMatch = await prisma.job.findUnique({
      where: { id: job.id },
      include: { match: true },
    });

    return NextResponse.json({ success: true, job: jobWithMatch });
  } catch (error) {
    console.error("Job import error:", error);
    return NextResponse.json(
      { error: "Failed to import job. Please try again." },
      { status: 500 }
    );
  }
}
