
# VerifyAI - AI Search with Sources

VerifyAI is an AI-powered metasearch app that finds relevant web pages, news, and images via Firecrawl, then generates fast, source-grounded summaries and answers using Groq-hosted LLMs. It aims to deliver concise responses with inline citations and a clean, minimal UI.

Key ideas:

- Fetch multi-source evidence first, answer second.

- Always cite sources, show result cards, and keep a full reference trail.

- Optimize for latency using Groq’s low-latency inference.


## Screenshots

![App Screenshot](https://drive.google.com/uc?export=download&id=1oX6LVKEKUJNWMsRaptV-kPn3Oz919MFS)


## Features

- Web, news, and image search via Firecrawl

- Source expansion: scrape/crawl pages to get LLM-ready markdown

- Answer synthesis using Groq LLMs with explicit grounding in fetched sources

- Inline citations and reference list

- Result cards with titles, snippets, and favicon/thumbnails

- Follow-up questions and conversational context

- Safety filters and prompt-guardrails

- Caching for deduping identical queries



## Tech Stack

**Language**: TypeScript for full-stack type safety

**Runtime**: Node.js (server) and modern browser (client)

**Frameworks**: Next.js or Vite + React (SPA/SSR choice up to implementation)

**Styling**: CSS modules or Tailwind CSS

**Data fetching**: Fetch/axios with retries and timeouts

**API**:
- Firecrawl API for search, crawl, scrape, images

- Groq API for LLM summarization, answer synthesis, and citation formatting

**Build Tooling**: 
ESLint, Prettier, pnpm/npm






## Installation

Install my-project with npm

```bash
# 1. Clone the repo
git clone https://github.com/harshaygadekar/VerifyAI.git
cd VerifyAI

# 2. Copy env example
cp .env.example .env

# 3. Install dependencies
# Using pnpm or npm
pnpm install
# or
npm install

# 4. Run development server
pnpm dev
# or
npm run dev

# 5. Build for production (if needed)
pnpm build
# or
npm run build

# 6. Start production server
pnpm start
# or
npm run start
```
    
