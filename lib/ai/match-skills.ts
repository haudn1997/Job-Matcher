import { geminiFlash, generateJSON } from "./gemini";

export interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];
  shouldApply: boolean;
  aiSummary: string;
}

interface UserSkillInput {
  name: string;
  level: string;
  yearsExp: number | null;
}

export async function matchJobWithSkills(
  userSkills: UserSkillInput[],
  requiredSkills: string[],
  niceToHave: string[],
  jobTitle: string
): Promise<MatchResult> {
  if (requiredSkills.length === 0) {
    return {
      matchScore: 50,
      matchedSkills: [],
      missingSkills: [],
      bonusSkills: userSkills.map((s) => s.name),
      shouldApply: true,
      aiSummary: "Không có thông tin skill bắt buộc. Có thể apply thử.",
    };
  }

  const userSkillNames = userSkills.map((s) => s.name.toLowerCase());
  const userSkillsFormatted = userSkills
    .map((s) => `${s.name} (${s.level}${s.yearsExp ? `, ${s.yearsExp}yr` : ""})`)
    .join(", ");

  const prompt = `
Bạn là tech recruiter chuyên về IT. Đánh giá mức độ phù hợp của candidate cho vị trí "${jobTitle}".

CANDIDATE SKILLS: ${userSkillsFormatted}
REQUIRED SKILLS: ${requiredSkills.join(", ")}
NICE TO HAVE: ${niceToHave.join(", ") || "none"}

Rules cho matching:
- Matching case-insensitive và handle aliases: "React" = "ReactJS", "Node.js" = "NodeJS", "C#" = "CSharp"
- matchedSkills: skills có trong BOTH candidate và required
- missingSkills: required skills candidate KHÔNG có
- bonusSkills: candidate skills có trong nice-to-have HOẶC có thể bổ sung cho job
- matchScore: 0-100, tính theo: (matched/required)*70 + (niceToHaveMatched/niceToHave)*30
  - Nếu matched >= 80% required -> score >= 75
  - Nếu missing critical skills (.NET, React, etc.) -> giảm điểm mạnh
- shouldApply: true nếu matchScore >= 55
- aiSummary: nhận xét 1-2 câu bằng tiếng Việt, thực tế và hữu ích

Return ONLY valid JSON:
{
  "matchScore": number,
  "matchedSkills": string[],
  "missingSkills": string[],
  "bonusSkills": string[],
  "shouldApply": boolean,
  "aiSummary": string
}
`;

  return generateJSON<MatchResult>(geminiFlash, prompt);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
  if (score >= 40) return "bg-orange-500/20 border-orange-500/30";
  return "bg-red-500/20 border-red-500/30";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Rất phù hợp";
  if (score >= 60) return "Phù hợp";
  if (score >= 40) return "Một phần";
  return "Ít phù hợp";
}
