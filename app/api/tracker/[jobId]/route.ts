import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { jobId: string } }
) {
    const { status } = await req.json();

    const updated = await prisma.jobMatch.update({
        where: { jobId: params.jobId },
        data: {
            status,
            appliedAt: status === "APPLIED" ? new Date() : undefined,
        },
    });

    return NextResponse.json({ success: true, match: updated });
}
