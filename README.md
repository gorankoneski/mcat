# MCAT Prep

Private, invite-only MCAT preparation app. Web first, iOS next. Anthropic-powered AI Study Counselor.

## Stack

- **Web**: Next.js 15 + TypeScript + Tailwind, served via Docker
- **DB**: Postgres 16 (Prisma ORM)
- **Cache/queue**: Redis 7
- **Object storage**: MinIO (S3-compatible)
- **Auth**: Auth.js v5 — Sign in with Apple + email magic link, **invite-only**
- **AI**: Anthropic SDK, Claude Sonnet 4.6 for the counselor, Haiku 4.5 for inline hints, prompt caching on
- **iOS** (next): SwiftUI hitting the same REST API

## Layout

```
.
├── docker-compose.yml     # postgres, redis, minio, web
├── .env.example           # copy to .env and fill in
├── web/                   # Next.js app
│   ├── prisma/schema.prisma
│   └── src/app/api/{health,counselor,auth}
└── ios/                   # SwiftUI app (placeholder)
```

## Run it

Requires Docker (Linux or Mac) and Node 22+ if developing outside the container.

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY and AUTH_SECRET at minimum
openssl rand -base64 32    # use for AUTH_SECRET

docker compose up --build
```

Then:
- Web app: http://localhost:3000
- Postgres: localhost:5432 (mcat / mcat / mcat)
- MinIO console: http://localhost:9001 (minioadmin / minioadmin)

### First-time DB setup

```bash
docker compose exec web npx prisma migrate dev --name init
docker compose exec web npx prisma db seed   # optional, once a seed exists
```

### Issue an invite (required — app is invite-only)

```bash
docker compose exec web npx tsx scripts/invite.ts user@example.com
```

## MCAT sections

Content is tagged by AAMC section: **C/P** (Chem/Phys), **CARS**, **B/B** (Bio/Biochem), **P/S** (Psych/Soc).

## MVP checklist

- [x] Docker compose skeleton
- [x] Next.js + Prisma scaffold
- [x] Auth.js with Apple + email magic link, invite gate
- [x] Anthropic counselor streaming endpoint
- [ ] Prisma migration + seed
- [ ] Lesson viewer (MDX + KaTeX)
- [ ] Question runner + full-length sim
- [ ] Progress dashboard (scaled score, heatmap)
- [ ] Flashcards (FSRS)
- [ ] Admin content authoring
- [ ] iOS SwiftUI client
