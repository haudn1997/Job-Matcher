import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { matchJobWithSkills } from "@/lib/ai/match-skills";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userSkills = await prisma.userSkill.findMany();
  if (userSkills.length === 0) {
    return NextResponse.json(
      { error: "No skills found. Please upload your CV first." },
      { status: 400 }
    );
  }

  const matchResult = await matchJobWithSkills(
    userSkills.map((s) => ({ name: s.name, level: s.level, yearsExp: s.yearsExp })),
    job.requiredSkills,
    job.niceToHave,
    job.title
  );

  const match = await prisma.jobMatch.upsert({
    where: { jobId: id },
    update: matchResult,
    create: { jobId: id, ...matchResult },
  });

  return NextResponse.json({ success: true, match });
}
