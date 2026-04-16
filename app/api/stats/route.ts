import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const [totalJobs, jobsWithMatch, statusCounts, topMissingSkills, recentHighMatch] =
    await Promise.all([
      prisma.job.count(),
      prisma.jobMatch.aggregate({
        _avg: { matchScore: true },
        _count: true,
      }),
      prisma.jobMatch.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.jobMatch.findMany({
        select: { missingSkills: true },
        where: { matchScore: { lt: 80 } },
        take: 100,
      }),
      prisma.job.findMany({
        where: { match: { matchScore: { gte: 75 } } },
        include: { match: true },
        orderBy: { match: { matchScore: "desc" } },
        take: 5,
      }),
    ]);

  // Count missing skills frequency
  const missingMap = new Map<string, number>();
  topMissingSkills.forEach(({ missingSkills }) => {
    missingSkills.forEach((skill) => {
      missingMap.set(skill, (missingMap.get(skill) ?? 0) + 1);
    });
  });
  const topMissing = Array.from(missingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  const appliedCount =
    statusCounts.find((s) => s.status === "APPLIED")?._count.status ?? 0;
  const interviewCount =
    statusCounts.find((s) => s.status === "INTERVIEW")?._count.status ?? 0;

  return NextResponse.json({
    totalJobs,
    avgMatchScore: Math.round(jobsWithMatch._avg.matchScore ?? 0),
    appliedCount,
    interviewCount,
    statusCounts,
    topMissingSkills: topMissing,
    recentHighMatch,
  });
}
