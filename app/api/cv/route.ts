import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const [skills, profile] = await Promise.all([
    prisma.userSkill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.userProfile.findUnique({ where: { id: "singleton" } }),
  ]);
  return NextResponse.json({ skills, profile });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { skills, profile } = body;

  if (skills) {
    // Batch upsert skills
    await Promise.all(
      skills.map((skill: { name: string; level: string; category: string; yearsExp?: number | null }) =>
        prisma.userSkill.upsert({
          where: { name: skill.name },
          update: { level: skill.level as never, category: skill.category, yearsExp: skill.yearsExp },
          create: {
            name: skill.name,
            level: skill.level as never,
            category: skill.category,
            yearsExp: skill.yearsExp,
            source: "manual",
          },
        })
      )
    );
  }

  if (profile) {
    await prisma.userProfile.upsert({
      where: { id: "singleton" },
      update: { ...profile, updatedAt: new Date() },
      create: { id: "singleton", ...profile, updatedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillName = searchParams.get("skill");
  if (skillName) {
    await prisma.userSkill.delete({ where: { name: skillName } });
  }
  return NextResponse.json({ success: true });
}
