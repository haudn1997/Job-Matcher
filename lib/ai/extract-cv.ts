import { geminiFlash, generateJSON } from "./gemini";

interface ExtractedSkill {
  name: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  yearsExp: number | null;
  category: "backend" | "frontend" | "database" | "devops" | "tools" | "soft";
}

interface ExtractedCV {
  skills: ExtractedSkill[];
  currentTitle: string | null;
  yearsExperience: number | null;
  desiredTitles: string[];
  name: string | null;
}

const SKILL_CATEGORIES = `
Categories:
- backend: C#, .NET, ASP.NET Core, Entity Framework, Node.js, Express, NestJS, Java, Python, Go
- frontend: React, Next.js, Vue, Angular, TypeScript, JavaScript, HTML, CSS, Tailwind, Redux, Zustand
- database: SQL Server, PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch
- devops: Docker, Kubernetes, Azure, AWS, GCP, CI/CD, GitHub Actions, Jenkins, Nginx, Linux
- tools: Git, REST API, GraphQL, Swagger, Postman, Jest, xUnit, Playwright, Figma, Jira
- soft: Agile, Scrum, Team Lead, System Design, Communication, Problem Solving
`;

export async function extractCVSkills(cvText: string): Promise<ExtractedCV> {
  const prompt = `
Bạn là chuyên gia phân tích CV IT. Hãy phân tích CV sau và trả về JSON CHÍNH XÁC theo schema được cung cấp.

${SKILL_CATEGORIES}

Rules:
- Chỉ extract skills được đề cập TRỰC TIẾP trong CV, không suy đoán
- yearsExp: số năm kinh nghiệm với skill đó (null nếu không rõ)
- level: dựa vào years experience (0-1: BEGINNER, 1-3: INTERMEDIATE, 3-5: ADVANCED, 5+: EXPERT)
- Normalize tên skill: "ReactJS" -> "React", "NodeJS" -> "Node.js", "Nextjs" -> "Next.js"
- desiredTitles: dựa vào skills và experience, gợi ý 2-3 job titles phù hợp

Return ONLY valid JSON matching this schema:
{
  "skills": [
    { "name": string, "level": "BEGINNER"|"INTERMEDIATE"|"ADVANCED"|"EXPERT", "yearsExp": number|null, "category": string }
  ],
  "currentTitle": string|null,
  "yearsExperience": number|null,
  "desiredTitles": string[],
  "name": string|null
}

CV Text:
---
${cvText}
---
`;

  return generateJSON<ExtractedCV>(geminiFlash, prompt);
}
