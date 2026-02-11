# SplitDecision

Can't decide between two options? Let AI agents argue it out for you.

SplitDecision is a web app where you enter two options (React vs Svelte, Tesla vs BMW, WFH vs Office — anything), and four AI agents with distinct personalities debate the merits of each in two rounds before delivering a final verdict with a confidence score.

## How It Works

1. **Enter two options** and pick a debate theme
2. **Validation** — an AI check ensures the comparison is meaningful (no "banana vs SQL")
3. **Round 1** — four agents give their initial takes, streamed in real-time:
   - **The Analyst** — data-driven, cites specs and benchmarks
   - **The Contrarian** — argues for the underdog, challenges assumptions
   - **The Pragmatist** — speaks from hands-on experience
   - **The Wildcard** — unexpected angles and creative takes
4. **Round 2** — agents read each other's Round 1 takes and respond with rebuttals
5. **Verdict** — a synthesizer agent reads all arguments and picks a winner with a confidence percentage

The entire debate streams token-by-token so you can watch it unfold live.

## Debate Themes

Each theme changes the agents' personalities and speaking style:

| Theme | Vibe |
|-------|------|
| Default Panel | Professional expert panel |
| Startup Bros | Hustle culture meets VC energy |
| Academic Panel | Peer-reviewed discourse and citations |
| Bar Argument | Loud opinions and friendly roasting |
| Shark Tank | Investment pitch evaluation |
| Reddit Thread | Upvotes, hot takes, and "well actually..." |
| Courtroom Trial | Legal drama debate |
| Sports Commentary | Play-by-play breakdown |
| Philosophy Seminar | Deep existential deliberation |

## Features

- **Real-time streaming** — all responses stream token-by-token via OpenAI's streaming API
- **VS Splash** — fighting-game-style animation when a debate starts
- **Confetti reveal** — verdict card bursts with confetti when the winner is announced
- **Share card** — download your result as a PNG or share directly to X
- **Trending feed** — recent comparisons from other users
- **BYO API key** — paste your own OpenAI key for unlimited use, or use the free tier (5 comparisons/day)
- **Multiple models** — supports GPT-4o Mini, GPT-4.1 Nano, and GPT-4.1 Mini

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **OpenAI API** (GPT-4o Mini by default)
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Upstash Redis** for rate limiting and trending feed storage
- **html2canvas** for share card image export

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key
- An Upstash Redis database (free tier works)

### Setup

```bash
git clone https://github.com/jafforgehq/splitdecision.git
cd splitdecision
npm install
```

Copy the example env file and fill in your keys:

```bash
cp .env.local.example .env.local
```

```
OPENAI_API_KEY=sk-...
DAILY_FREE_LIMIT=50
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy

Works out of the box on Vercel — just connect the GitHub repo and add your environment variables.

## Architecture

```
app/
  page.tsx              — main UI, orchestrates the debate flow
  layout.tsx            — metadata + OG tags
  icon.tsx              — dynamic favicon
  opengraph-image.tsx   — auto-generated OG image for social sharing
  api/
    stream/             — proxies OpenAI streaming for free-tier users
    validate/           — comparison validation endpoint
    comparisons/        — stores + retrieves recent comparisons

components/
  ComparisonInput.tsx   — form with options, theme picker, model selector
  AgentMessage.tsx      — renders a single agent's streamed message
  VerdictCard.tsx       — final verdict with confetti reveal animation
  VSSplash.tsx          — full-screen VS animation overlay
  ShareCard.tsx         — share modal with download + social sharing
  TrendingFeed.tsx      — recent comparisons from other users

lib/
  config.ts             — agents, themes, prompt templates, verdict parser
  types.ts              — TypeScript types
  stream.ts             — streaming logic (direct for BYO key, API route for free tier)
  rate-limit.ts         — Upstash-based rate limiting
  redis.ts              — Redis client setup
```

## How Streaming Works

When a user brings their own API key, the OpenAI SDK runs directly in the browser — no server round-trip. For free-tier users, requests go through `/api/stream` which proxies the OpenAI streaming response using the server's API key, with Upstash rate limiting per IP.

## License

MIT
