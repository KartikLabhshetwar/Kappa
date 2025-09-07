# Kappa

An AI-powered chat interface that can browse the web, extract API documentation, and generate React components automatically.

## What It Does

- **Chat with AI** using xAI Grok or Google Gemini models
- **Browse websites** and extract API documentation using Firecrawl
- **Search the web** intelligently using Tavily
- **Generate React components** from API docs using Google Gemini 2.5 Flash
- **Create integrations** between different APIs and services

## Key Features

### 🤖 AI Chat

- Real-time streaming responses
- Multiple AI models (xAI Grok, Google Gemini)
- Visual tool indicators and syntax highlighting

### 🌐 Web Tools

- **Search**: Find information using Tavily
- **Scrape**: Extract content from URLs using Firecrawl
- Multiple modes: single page, deep crawl, iterative research

### ⚛️ Component Generation

- Generate TypeScript React components from API docs
- Tailwind CSS styling with accessibility features
- Production-ready code with proper error handling

---

## Quick Start

### 1. Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm or npm
- PostgreSQL database
- API keys (see below)

### 2. Installation

```bash
git clone https://github.com/KartikLabhshetwar/Kappa
cd kappa
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file with:

```bash
# Required: At least one AI provider
XAI_API_KEY=your_xai_key_here                    # For Grok models
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key     # For Gemini models

# Required: Database
POSTGRES_URL=your_postgres_url

# Required: Web tools
TAVILY_API_KEY=your_tavily_key                   # For web search
FIRECRAWL_API_KEY=your_firecrawl_key             # For web scraping

# Required: Authentication
AUTH_SECRET=your_auth_secret

# Optional: Additional services
BLOB_READ_WRITE_TOKEN=your_blob_token
REDIS_URL=your_redis_url
```

### 4. Get API Keys

**AI Models** (choose one or both):

- **xAI**: Get key from [x.ai](https://x.ai) for Grok models
- **Google Gemini**: Get key from [Google AI Studio](https://aistudio.google.com)

**Web Tools**:

- **Tavily**: Get key from [tavily.com](https://tavily.com) for web search
- **Firecrawl**: Get key from [firecrawl.dev](https://firecrawl.dev) for web scraping

**Database**:

- Use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/storage/postgres)

### 5. Run the App

```bash
# Setup database
pnpm db:migrate

# Start development server
pnpm dev
```

Visit `http://localhost:3000` and start chatting!

---

## How to Use

### 🔍 Search the Web

```text
Search for React component libraries and show me the best options
```

### 🕷️ Scrape Websites

```text
Browse the Stripe API documentation and extract the payment methods
```

### ⚛️ Generate Components

```text
Create a React pricing card component based on the Stripe API
```

### 🔗 Full Integration Workflow

```text
Browse BillingSDK and DodoPayments documentation, then create components to integrate both systems
```

## Example Workflows

### 1. API Documentation Analysis

1. **Search**: "Find Stripe API documentation"
2. **Scrape**: Browse the Stripe docs to extract endpoints
3. **Generate**: Create React components for payment processing

### 2. Multi-Service Integration

1. **Scrape**: Browse both BillingSDK and DodoPayments docs
2. **Generate**: Create individual components for each service
3. **Integrate**: Build a component that connects both services
4. **Document**: Get step-by-step integration instructions

---

## Tech Stack

### Frontend

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** for accessible components

### AI & Tools

- **Vercel AI SDK** for chat orchestration
- **xAI Grok** and **Google Gemini** models
- **Firecrawl** for web scraping
- **Tavily** for web search
- **Custom tools** for component generation

### Backend

- **PostgreSQL** with Drizzle ORM
- **Auth.js** for authentication
- **Redis** for caching
- **Vercel Functions** for deployment

---

## Available Tools

### 🔍 Search Tools (Tavily)

- **search** - General web search with AI answers
- **searchContext** - Context-aware search with token limits
- **searchQNA** - Direct Q&A search
- **extract** - Extract content from specific URLs

### 🕷️ Scraping Tools (Firecrawl)

- **browseWeb** - Deep web crawling and API documentation extraction
  - `single` - Quick single page scraping
  - `crawl` - Multi-page API documentation crawling
  - `iterative` - Depth-based exploration
  - `search` - Content discovery
  - `deep-research` - AI-powered comprehensive analysis

### ⚛️ Component Generation Tool

- **generateComponent** - Create React components from API docs
  - TypeScript interfaces
  - Tailwind CSS styling
  - Props validation
  - Usage examples
  - Accessibility compliance

### 📄 Additional Tools

- **createDocument** - Create content artifacts
- **updateDocument** - Modify existing artifacts
- **getWeather** - Weather data integration
- **requestSuggestions** - Contextual suggestions

---

## UI Libraries

### ✅ Preferred

- **Base UI** - Unstyled, accessible components
- **Origin UI** - Copy-paste styled components
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible primitives

### ❌ Avoided

- **shadcn/ui** - Explicitly avoided to test AI adaptability

## Performance

- **Streaming responses** for real-time updates
- **Code splitting** for optimal bundle sizes
- **Redis caching** for improved performance
- **Error boundaries** for graceful error handling

## Support

- **Issues**: [GitHub Issues](https://github.com/KartikLabhshetwar/Kappa/issues)

## Acknowledgments

- **Vercel AI SDK** for the excellent AI integration framework
- **xAI** for the powerful Grok models
- **Google** for the versatile Gemini models
- **Firecrawl** for web crawling and API documentation extraction
- **Tavily** for intelligent web search and content discovery
- **Base UI** and **Origin UI** for accessible component libraries
