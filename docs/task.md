# Job Matcher — Phase 1 Tasks

## Step 1: Project Setup
- [x] Init Next.js 14 project tại d:/job-matcher
- [x] Cài dependencies: prisma, shadcn/ui, pdf-parse, @google/generative-ai, zod
- [x] Setup .env.local (DATABASE_URL, GEMINI_API_KEY)
- [x] Setup Supabase project → lấy connection string
- [x] Init Prisma schema + run migration
- [x] Setup global layout (sidebar navigation)

## Step 2: CV Manager (/cv)
- [x] UI: Upload CV PDF + drag-and-drop zone
- [x] API: POST /api/cv/upload → pdf-parse → Gemini extract → save UserSkill[]
- [x] UI: Skill tags display (add/remove/edit level)
- [x] UI: UserProfile form (titles, locations, salary)

## Step 3: Manual Job Import (/jobs/import)
- [x] UI: Paste job URL hoặc raw job text
- [x] API: POST /api/jobs/import → Gemini parse → save Job
- [x] Auto trigger match sau khi save

## Step 4: AI Matching Engine
- [x] lib/ai/extract-cv.ts
- [x] lib/ai/extract-job.ts
- [x] lib/ai/match-skills.ts
- [x] API: POST /api/jobs/[id]/match

## Step 5: Job Board (/jobs)
- [x] Job list với sort by match score
- [x] Filter panel (score, source, location, status)
- [x] Job card component (score badge, matched skills)
- [x] Job detail page (/jobs/[id])
- [x] Status update dropdown

## Step 6: Dashboard (/)
- [x] Stats cards (total, avg score, applied)
- [x] Recent high-match jobs
- [x] Skill gap chart
