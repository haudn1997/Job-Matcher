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

# Phase 2 Tasks — Auto Scraping

## Step 7: Scraper Infrastructure
- [x] So sánh & chọn công cụ (Chốt: Playwright vượt qua Cloudflare)
- [x] Thiết lập Base Scraper Interface kết nối với Database
- [x] Xử lý chống trùng lặp Job (bằng URL hoặc External ID)

## Step 8: ITviec Scraper
- [x] Phân tích cấu trúc DOM / API ngầm của trang tìm kiếm ITviec
- [x] Viết hàm extract danh sách Job (Title, Company, Salary, Location, URL)
- [x] Viết hàm extract chi tiết Job (Description, Requirements)

## Step 9: TopCV Scraper
- [x] Phân tích điểm cuối tìm kiếm API / HTML của TopCV
- [x] Viết hàm extract danh sách Job từ TopCV
- [x] Trích xuất chi tiết JD để đưa qua Gemini phân tích

## Step 10: Auto Matching & Cron Job
- [x] Code endpoint `/api/cron/scrape` chạy cả 2 scraper
- [x] Liên kết list job mới crawl với hàm AI Matching `extractJob` và `matchSkills`
- [x] Cấu hình `vercel.json` để chạy Cron mỗi ngày

