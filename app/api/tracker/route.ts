import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const TRACKED_STATUSES = ["BOOKMARKED", "APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED"];

export async function GET() {
    const jobs = await prisma.job.findMany({
        where: {
            match: {
                status: { in: TRACKED_STATUSES as any[] },
            },
        },
        include: { match: true },
        orderBy: { match: { updatedAt: "asc" } },
    });

    // Group by status
    const grouped = TRACKED_STATUSES.reduce((acc, status) => {
        acc[status] = jobs.filter((j) => j.match?.status === status);
        return acc;
    }, {} as Record<string, typeof jobs>);

    return NextResponse.json({ columns: grouped });
}
