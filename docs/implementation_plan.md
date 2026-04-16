# Job Matcher — Kế hoạch chi tiết (Đã cập nhật)

## Tổng quan

Website cá nhân giúp **Fullstack Developer (.NET / NodeJS / React / Next.js)** tự động lọc và match job listings từ **TopCV** và **ITviec** với skills trong CV.

### Quyết định đã chốt:
| Câu hỏi | Quyết định |
|---|---|
| Lĩnh vực | Fullstack: .NET, NodeJS, ReactJS, NextJS |
| Nguồn job | TopCV + ITviec (ưu tiên), có thể mở rộng sau |
| Auth | ❌ Bỏ qua (personal site) |
| Deploy | ✅ Vercel |

---

## Tech Stack

| Layer | Tech | Lý do |
|---|---|---|
| **Framework** | Next.js 14 (App Router) + TypeScript | Quen thuộc, deploy Vercel ngay |
| **Styling** | Tailwind CSS + shadcn/ui | Nhanh, đẹp, dark mode sẵn |
| **Database** | PostgreSQL via Supabase | Free tier, setup 5 phút |
| **ORM** | Prisma | Type-safe, migration dễ |
| **AI Matching** | Google Gemini 1.5 Flash API | Free 1M tokens/ngày, nhanh |
| **CV Parsing** | `pdf-parse` + Gemini | Extract raw text → structured skills |
| **Job Scraping** | Playwright (headless Chromium) | Handle JS-rendered pages của TopCV/ITviec |
| **Background Jobs** | Vercel Cron Jobs + `pg` queue | Cron miễn phí trên Vercel, đơn giản |
| **Deploy** | Vercel | Auto deploy từ GitHub |
| **Cache** | Supabase (lưu kết quả match) | Tránh gọi AI lại nhiều lần |

> **Tại sao không dùng BullMQ/Redis?** — Vì Vercel Cron Jobs đủ đơn giản cho personal use, không cần Redis. Tiết kiệm chi phí và setup.

---

## Skill Taxonomy cho Fullstack .NET/JS

AI sẽ nhận diện và nhóm skills theo categories sau:

```
Backend:
  .NET:    C#, ASP.NET Core, Entity Framework, LINQ, SignalR, .NET MAUI
  NodeJS:  Express, NestJS, Fastify, TypeORM, Prisma, Socket.io

Frontend:
  React:   ReactJS, Redux, Zustand, React Query, React Hook Form
  Next:    NextJS, App Router, Server Actions, ISR/SSR/SSG

Database:
  SQL:     SQL Server, PostgreSQL, MySQL
  NoSQL:   MongoDB, Redis, Elasticsearch

DevOps:
  Cloud:   Azure, AWS, GCP
  CI/CD:   Docker, Kubernetes, GitHub Actions, Jenkins
  Other:   Nginx, Linux

Tools:
  Version: Git, GitHub, GitLab
  Testing: xUnit, Jest, Vitest, Playwright
  API:     REST, GraphQL, gRPC, Swagger/OpenAPI

Soft skills:
  Agile, Scrum, Team Lead, System Design, Microservices
```

---

## Kiến trúc hệ thống (Simplified - No Auth)

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App                        │
│                                                          │
│   /          /jobs        /cv          /tracker          │
│  Dashboard  Job Board   CV Manager   App Tracker         │
│                                                          │
│  ┌────────────────────── API Routes ──────────────────┐ │
│  │  POST /api/cv/upload   GET /api/jobs               │ │
│  │  POST /api/jobs/import GET /api/jobs/[id]/match    │ │
│  │  POST /api/scrape/run  PUT /api/jobs/[id]/status   │ │
│  └──────────────┬─────────────────────────────────────┘ │
└─────────────────┼───────────────────────────────────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
┌────▼────┐ ┌────▼────┐ ┌────▼──────────┐
│Supabase │ │Gemini   │ │Vercel Cron    │
│Postgres │ │1.5 Flash│ │(every 6h)     │
│         │ │         │ │→ Playwright   │
│         │ │         │ │  scrape       │
│         │ │         │ │  TopCV/ITviec │
└─────────┘ └─────────┘ └───────────────┘
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Skills của user (từ CV)
model UserSkill {
  id        String   @id @default(cuid())
  name      String
  level     SkillLevel @default(INTERMEDIATE)
  yearsExp  Float?
  category  String   // backend/frontend/database/devops/tools
  source    String   @default("cv") // cv | manual
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

// Thông tin user profile
model UserProfile {
  id              String   @id @default("singleton") // chỉ 1 profile
  name            String?
  currentTitle    String?
  yearsExperience Float?
  desiredTitles   String[] // ["Fullstack Developer", "Backend Developer"]
  desiredLocations String[] // ["Hà Nội", "Remote", "HCM"]
  salaryMin       Int?
  salaryMax       Int?
  currency        String   @default("VND")
  cvText          String?  // raw text từ CV
  cvUpdatedAt     DateTime?
  updatedAt       DateTime @updatedAt
}

// Job listings đã scrape/import
model Job {
  id             String   @id @default(cuid())
  title          String
  company        String
  companyLogo    String?
  location       String?
  isRemote       Boolean  @default(false)
  salaryMin      Int?
  salaryMax      Int?
  currency       String   @default("VND")
  jobType        String?  // full-time/part-time/contract/freelance
  seniority      String?  // junior/mid/senior/lead
  description    String   @db.Text
  url            String   @unique
  source         String   // topcv | itviec | manual
  externalId     String?  // ID từ nguồn gốc
  requiredSkills String[]
  niceToHave     String[]
  postedAt       DateTime?
  expiresAt      DateTime?
  scrapedAt      DateTime @default(now())

  match          JobMatch?

  @@index([source])
  @@index([scrapedAt])
}

// Kết quả AI match
model JobMatch {
  id               String   @id @default(cuid())
  jobId            String   @unique
  job              Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  matchScore       Float    // 0-100
  matchedSkills    String[] // skills có trong cả CV và JD
  missingSkills    String[] // skills JD yêu cầu nhưng CV không có
  bonusSkills      String[] // skills CV có mà JD không yêu cầu (điểm cộng)
  aiSummary        String?  // AI nhận xét ngắn gọn
  shouldApply      Boolean? // AI gợi ý có nên apply không
  status           JobStatus @default(NEW)
  notes            String?  // ghi chú cá nhân
  appliedAt        DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

enum JobStatus {
  NEW
  BOOKMARKED
  APPLIED
  PHONE_SCREEN
  INTERVIEW
  OFFER
  REJECTED
  IGNORED
}

// Log scraping runs
model ScrapeLog {
  id        String   @id @default(cuid())
  source    String
  status    String   // success | failed | partial
  jobsFound Int      @default(0)
  jobsNew   Int      @default(0)
  error     String?
  duration  Int?     // milliseconds
  createdAt DateTime @default(now())
}
```

---

## Phase 1 — MVP (Tuần 1-2) ⭐ BẮT ĐẦU ĐÂY

### Tuần 1: Core Setup + CV Manager

**Ngày 1-2: Setup project**
```bash
npx create-next-app@latest d:/job-matcher --typescript --tailwind --app
cd d:/job-matcher
npx shadcn@latest init
npm install prisma @prisma/client pdf-parse @google/generative-ai
npx prisma init
# Setup Supabase connection
```

**Ngày 3-4: CV Manager**
- Trang `/cv` — Upload PDF, preview skills
- `POST /api/cv/upload` → pdf-parse → Gemini extract → save UserSkill[]
- UI: Skill tags có thể add/remove/edit level
- UserProfile form: desired titles, locations, salary range

**Ngày 5-7: Manual Job Import**
- Trang `/jobs/import` — Paste URL hoặc paste raw job description text
- `POST /api/jobs/import` → Gemini parse → save Job
- Ngay sau khi save → auto run matching → save JobMatch

### Tuần 2: Job Board + Matching UI

**Job Board (`/jobs`)**
- List component với sort by match score (default)
- Filter panel: score range, source, location, job type, status
- Job card: company, title, score badge (màu sắc theo điểm), matched skills preview
- Skeleton loading states

**Job Detail (`/jobs/[id]`)**
- Full JD hiển thị
- Match breakdown: matched ✅ / missing ❌ / bonus ⭐ skills
- AI summary + recommendation
- Status dropdown (New → Applied → Interview...)
- Notes textarea
- Link to original posting

**Dashboard (`/`)**
- Stats: Total jobs, Avg match score, Applied count, By source
- Recent high-match jobs
- Skills gap chart (most frequently missing skills)

---

## Phase 2 — Auto Scraping (Tuần 3-4)

### ITviec Scraper

```typescript
// src/lib/scrapers/itviec.ts
// ITviec có cấu trúc HTML tương đối ổn định
// Search URL: https://itviec.com/it-jobs/ho-chi-minh-city?query=fullstack+developer

async function scrapeItviec(keywords: string[], pages = 3) {
  // 1. Dùng Playwright navigate tới search results
  // 2. Extract job cards: title, company, salary, location, tags
  // 3. Visit each job detail page → extract full description
  // 4. Upsert vào DB (skip nếu URL đã tồn tại)
}
```

### TopCV Scraper

```typescript
// src/lib/scrapers/topcv.ts
// TopCV: https://www.topcv.vn/tim-viec-lam-it-phan-mem?keyword=fullstack
// TopCV có API không chính thức có thể dùng fetch trực tiếp

async function scrapeTopcv(keywords: string[], pages = 5) {
  // Option A: TopCV JSON API (nếu tìm được endpoint)
  // Option B: Playwright scrape
}
```

### Vercel Cron Setup

```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 */6 * * *"  // mỗi 6 tiếng
    }
  ]
}
```

```typescript
// src/app/api/cron/scrape/route.ts
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Run scrapers
  const keywords = ['fullstack developer', 'nodejs developer', '.net developer', 'react developer']
  await Promise.allSettled([
    scrapeItviec(keywords),
    scrapeTopcv(keywords),
  ])

  // Auto match new jobs
  await matchNewJobs()

  return Response.json({ success: true })
}
```

> **Lưu ý**: Vercel Serverless Functions có timeout 60s (Hobby) → nếu scraping lâu hơn, cần dùng Vercel Pro (300s) hoặc chạy scraper riêng trên một VPS nhỏ.

---

## Phase 3 — Smart Features (Tuần 5-6)

### 1. Telegram Bot Notifications
- Khi có job mới match > 75% → gửi Telegram message
- Dùng `node-telegram-bot-api`
- Setup: BotFather → lấy token → gửi message tới chat ID của bạn

### 2. Skill Gap Dashboard
- Chart (Recharts): Top 10 skills thiếu nhiều nhất
- "Bạn hay bị thiếu: Docker, Kubernetes, Azure" → gợi ý học
- Skills được cover tốt nhất

### 3. Application Tracker (Kanban)
- Drag-and-drop kanban: `@hello-pangea/dnd`
- Columns: Bookmarked → Applied → Phone Screen → Interview → Offer/Rejected
- Stats: Conversion rate, Average days per stage

### 4. Smart Search & Filter
- Full-text search trong job descriptions
- "Show only jobs I can apply now" (score > 60%)
- Salary filter nếu có thông tin

---

## Folder Structure

```
d:/job-matcher/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Dashboard
│   │   ├── layout.tsx                  # Root layout (sidebar nav)
│   │   ├── cv/
│   │   │   └── page.tsx                # CV Manager
│   │   ├── jobs/
│   │   │   ├── page.tsx                # Job Board
│   │   │   ├── import/page.tsx         # Manual import
│   │   │   └── [id]/page.tsx           # Job Detail
│   │   ├── tracker/
│   │   │   └── page.tsx                # Kanban tracker
│   │   ├── settings/
│   │   │   └── page.tsx                # Settings (keywords, etc.)
│   │   └── api/
│   │       ├── cv/
│   │       │   └── upload/route.ts
│   │       ├── jobs/
│   │       │   ├── route.ts            # GET list, POST import
│   │       │   └── [id]/
│   │       │       ├── route.ts        # GET detail
│   │       │       ├── match/route.ts  # POST re-match
│   │       │       └── status/route.ts # PATCH status
│   │       └── cron/
│   │           └── scrape/route.ts     # Vercel Cron endpoint
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── header.tsx
│   │   ├── cv/
│   │   │   ├── cv-upload.tsx
│   │   │   ├── skill-tag.tsx
│   │   │   └── skill-editor.tsx
│   │   ├── jobs/
│   │   │   ├── job-card.tsx
│   │   │   ├── job-list.tsx
│   │   │   ├── job-filters.tsx
│   │   │   └── match-breakdown.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   └── skill-gap-chart.tsx
│   │   └── ui/                         # shadcn components
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── gemini.ts               # Gemini client setup
│   │   │   ├── extract-cv.ts           # CV text → UserSkill[]
│   │   │   ├── extract-job.ts          # Job text/HTML → Job{}
│   │   │   └── match-skills.ts         # Skills matching logic
│   │   ├── scrapers/
│   │   │   ├── itviec.ts
│   │   │   ├── topcv.ts
│   │   │   └── base-scraper.ts         # shared utilities
│   │   ├── db/
│   │   │   └── prisma.ts               # Prisma client singleton
│   │   └── utils/
│   │       ├── job-status.ts
│   │       └── score-color.ts          # score → color mapping
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── .env.local
├── vercel.json                         # Cron config
└── package.json
```

---

## AI Prompts (Key)

### 1. Extract CV Skills
```
Hãy phân tích CV sau và trả về JSON với danh sách skills:
{
  "skills": [
    { "name": "C#", "level": "ADVANCED", "yearsExp": 3, "category": "backend" },
    ...
  ],
  "currentTitle": "Fullstack Developer",
  "yearsExperience": 4,
  "desiredTitles": ["Senior Fullstack", "Backend Developer"]
}

CV Text:
{cvText}
```

### 2. Match Skills
```
Bạn là recruiter. So sánh skills của candidate với job requirements:

CANDIDATE SKILLS: {userSkills}
JOB REQUIRED: {requiredSkills}
JOB NICE TO HAVE: {niceToHave}

Trả về JSON:
{
  "matchScore": 78,
  "matchedSkills": ["C#", "ASP.NET Core", "ReactJS"],
  "missingSkills": ["Docker", "Azure"],
  "bonusSkills": ["NextJS", "TypeScript"],
  "shouldApply": true,
  "aiSummary": "Bạn đáp ứng 78% yêu cầu. Thiếu Docker và Azure nhưng có thể học nhanh..."
}
```

---

## Estimated Cost

| Service | Plan | Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Supabase | Free (500MB) | $0 |
| Gemini 1.5 Flash | Free (1M tokens/day) | $0 |
| **Total** | | **$0/tháng** |

---

## Verification Plan

### Phase 1 checklist:
- [ ] Upload CV PDF → xem skills được extract đúng không
- [ ] Paste job URL TopCV/ITviec → xem AI parse được không
- [ ] Match score trông có hợp lý không (test với 5 jobs thật)
- [ ] Job Board hiển thị đúng, filter/sort hoạt động

### Phase 2 checklist:
- [ ] Scraper chạy không bị block
- [ ] Cron tự động chạy mỗi 6h trên Vercel
- [ ] New jobs tự động được match

---

## ⏩ Bước tiếp theo — Bắt đầu ngay

Tôi đề nghị bắt đầu theo thứ tự:

1. **Init Next.js project** tại `d:/job-matcher`
2. **Setup Supabase** + Prisma schema + migration
3. **Build CV Manager** (upload + AI extract)
4. **Build Manual Job Import** (paste URL/text + AI parse + match)
5. **Build Job Board** với sort/filter

**Bạn có muốn bắt đầu build ngay từ bước 1 không?**
