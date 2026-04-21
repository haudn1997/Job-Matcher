import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractJobFromText } from "@/lib/ai/extract-job";
import { upsertJobAndMatch } from "@/lib/db/job-service";

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
    const source = url ? "manual-url" : "manual";

    // Save job and run auto-matching using shared service
    const jobWithMatch = await upsertJobAndMatch(extracted, jobUrl, source);

    return NextResponse.json({ success: true, job: jobWithMatch });
  } catch (error) {
    console.error("Job import error:", error);
    return NextResponse.json(
      { error: "Failed to import job. Please try again." },
      { status: 500 }
    );
  }
}
