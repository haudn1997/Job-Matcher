import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractCVSkills } from "@/lib/ai/extract-cv";

// pdf-parse v1.1.1: simple function(buffer) => {text, numpages, info, ...}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse");


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using pdf-parse v1.1.1 API: pdfParse(buffer) => {text}
    const pdfData = await pdfParse(buffer);
    const cvText = pdfData.text;

    if (!cvText || cvText.trim().length < 100) {
      return NextResponse.json(
        { error: "PDF appears to be empty or unreadable. Please try a text-based PDF." },
        { status: 400 }
      );
    }

    // Extract skills with AI
    const extracted = await extractCVSkills(cvText);

    // Upsert UserProfile
    await prisma.userProfile.upsert({
      where: { id: "singleton" },
      update: {
        name: extracted.name ?? undefined,
        currentTitle: extracted.currentTitle ?? undefined,
        yearsExperience: extracted.yearsExperience ?? undefined,
        desiredTitles: extracted.desiredTitles,
        cvText,
        cvUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        id: "singleton",
        name: extracted.name,
        currentTitle: extracted.currentTitle,
        yearsExperience: extracted.yearsExperience,
        desiredTitles: extracted.desiredTitles,
        cvText,
        cvUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Delete existing CV skills and recreate
    await prisma.userSkill.deleteMany({ where: { source: "cv" } });

    const skills = await prisma.$transaction(
      extracted.skills.map((skill) =>
        prisma.userSkill.upsert({
          where: { name: skill.name },
          update: {
            level: skill.level,
            yearsExp: skill.yearsExp,
            category: skill.category,
            source: "cv",
          },
          create: {
            name: skill.name,
            level: skill.level,
            yearsExp: skill.yearsExp,
            category: skill.category,
            source: "cv",
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      skills,
      profile: {
        name: extracted.name,
        currentTitle: extracted.currentTitle,
        yearsExperience: extracted.yearsExperience,
        desiredTitles: extracted.desiredTitles,
      },
      rawText: cvText.slice(0, 500) + "...",
    });
  } catch (error) {
    console.error("CV upload error:", error);
    return NextResponse.json(
      { error: "Failed to process CV. Please try again." },
      { status: 500 }
    );
  }
}
