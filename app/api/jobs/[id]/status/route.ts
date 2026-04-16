import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { JobStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = [
  "NEW", "BOOKMARKED", "APPLIED", "PHONE_SCREEN",
  "INTERVIEW", "OFFER", "REJECTED", "IGNORED",
] as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body as { status?: string; notes?: string };

  if (status && !VALID_STATUSES.includes(status as JobStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (status) {
    updateData.status = status;
    if (status === "APPLIED") updateData.appliedAt = new Date();
  }
  if (notes !== undefined) updateData.notes = notes;

  const match = await prisma.jobMatch.update({
    where: { jobId: id },
    data: updateData,
  });

  return NextResponse.json({ success: true, match });
}
