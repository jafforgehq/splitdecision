# SplitDecision

AI agents debate two options and return a winner with confidence.

## Live App

- https://splitdecision.vercel.app/
- Feel free to use it until I have credits left.

## What It Does

SplitDecision lets you compare two options (for example `React vs Svelte`) and watch a structured 2-round debate between 4 agent personas:

- The Analyst
- The Contrarian
- The Pragmatist
- The Wildcard

After both rounds, a verdict model picks a winner and assigns a confidence score.

## Current Feature Set

- Real-time token streaming for all agent responses and verdict
- Two debate rounds (initial takes + rebuttals)
- 9 themed debate panels:
  - Default Panel
  - Startup Bros
  - Academic Panel
  - Bar Argument
  - Shark Tank
  - Reddit Thread
  - Courtroom Trial
  - Sports Commentary
  - Philosophy Seminar
- Input validation before debate starts
- Content moderation check on submitted options
- Server-side OpenAI key usage via environment variables
- Fixed model: `gpt-4o-mini`
- IP-based rate limiting
- VS splash animation, verdict reveal animation, and confetti
- Share modal: copy link, export PNG, share to X
- Trending feed backed by Redis (`/api/comparisons`)

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- OpenAI SDK
- Upstash Redis + Upstash Ratelimit
- html2canvas

## API Endpoints

- `POST /api/validate` - validates comparison + moderates content
- `POST /api/stream` - streams agent/verdict output
- `GET /api/comparisons` - fetches recent comparisons
- `POST /api/comparisons` - saves completed comparison results

## Project Structure

```text
app/
  page.tsx                # main UI and debate orchestration
  api/
    stream/route.ts       # server-side streaming proxy + rate limit
    validate/route.ts     # validation + moderation
    comparisons/route.ts  # trending storage/retrieval

components/
  ComparisonInput.tsx
  AgentMessage.tsx
  VerdictCard.tsx
  VSSplash.tsx
  ShareCard.tsx
  TrendingFeed.tsx

lib/
  config.ts               # agents, themes, prompts, parser config
  stream.ts               # browser helpers for API validation/streaming
  rate-limit.ts           # Upstash fixed-window limiter
  redis.ts                # Redis helpers for recent comparisons
  types.ts
```

## Local Development

### 1. Install

```bash
npm install
```

### 2. Configure env vars

Copy example file:

```bash
cp .env.local.example .env.local
```

Set values:

```env
OPENAI_API_KEY=sk-...
DAILY_FREE_LIMIT=50
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Notes:

- `OPENAI_API_KEY` is used by server routes for all AI calls.
- `DAILY_FREE_LIMIT` is a request limit per IP in a 24h window.
- If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are missing locally, Next.js may show Upstash warnings during build/start.

### 3. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint` (currently prompts for ESLint setup in this repo)

## Deployment

Deployed on Vercel: `https://splitdecision.vercel.app/`

To deploy your own instance, add the same env vars in Vercel project settings.

## License

MIT
