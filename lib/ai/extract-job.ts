import { geminiFlash, generateJSON } from "./gemini";

export interface ExtractedJob {
  title: string;
  company: string;
  location: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  jobType: string | null;
  seniority: string | null;
  description: string;
  requiredSkills: string[];
  niceToHave: string[];
  postedAt: string | null;
  expiresAt: string | null;
}

export async function extractJobFromText(
  text: string
): Promise<ExtractedJob> {
  const prompt = `
Bạn là chuyên gia phân tích tin tuyển dụng IT. Phân tích nội dung JD sau và trả về JSON.

Rules:
- requiredSkills: skills BẮT BUỘC (must have, required)
- niceToHave: skills ưu tiên nhưng không bắt buộc (nice to have, preferred, plus)
- Normalize skill names: "ReactJS"->"React", "NodeJS"->"Node.js", "Nextjs"->"Next.js", "C#"->"C#"
- seniority: "junior"|"mid"|"senior"|"lead"|"manager"|null
- jobType: "full-time"|"part-time"|"contract"|"freelance"|null
- salary: số nguyên (VND hoặc USD tùy CV), null nếu không có
- currency: "VND"|"USD"|"SGD" (default "VND")
- isRemote: true nếu có từ "remote", "work from home", "WFH"

Return ONLY valid JSON:
{
  "title": string,
  "company": string,
  "location": string|null,
  "isRemote": boolean,
  "salaryMin": number|null,
  "salaryMax": number|null,
  "currency": string,
  "jobType": string|null,
  "seniority": string|null,
  "description": string,
  "requiredSkills": string[],
  "niceToHave": string[],
  "postedAt": string|null,
  "expiresAt": string|null
}

Job Description:
---
${text}
---
`;

  return generateJSON<ExtractedJob>(geminiFlash, prompt);
}
