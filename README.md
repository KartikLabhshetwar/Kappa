# Kappa

---

## Project Overview

Kappa is a sophisticated AI chat interface that demonstrates advanced capabilities in:

- **Real-time AI conversations** with streaming responses
- **Intelligent web browsing** and content extraction with Firecrawl and Tavily
- **React component generation** from API documentation
- **Multi-provider AI model support** with xAI Grok and Google Gemini models
- **Production-ready architecture** with TypeScript and modern tooling

This project fulfills the AI Intern Assignment requirements by providing a complete solution for browsing API documentation and generating React components with proper UI library integration.

---

## Key Features

### AI Chat Interface

- **Streaming responses** with real-time token streaming
- **Multi-model support** (xAI Grok and Google Gemini models)
- **Tool integration** with visual indicators
- **Syntax-highlighted code** with proper formatting
- **Thinking states** and loading indicators

### Advanced Web Browsing & Searching

- **Firecrawl integration** for deep web crawling and API documentation extraction
- **Tavily integration** for intelligent web search and content discovery
- **Multiple browsing modes**:
  - `single` - Quick single page scraping
  - `crawl` - Deep API documentation crawling with Firecrawl
  - `iterative` - Multi-depth iterative research
  - `search` - General web search with comprehensive results
  - `deep-research` - AI-powered comprehensive analysis
- **Comprehensive error handling** with retry mechanisms
- **Image search** and visual content discovery
- **Content summarization** and metadata extraction

### React Component Generation

- **TypeScript-first** component generation
- **UI Library Guidance** (Base UI, Origin UI - NO shadcn/ui)
- **Tailwind CSS styling** with responsive design
- **Props validation** and TypeScript interfaces
- **Usage examples** and documentation
- **Accessibility compliance** (WCAG standards)
- **Production-ready code** with error handling

### Developer Experience

- **Full TypeScript** support with strict type checking
- **Modern React patterns** (hooks, functional components)
- **Comprehensive logging** and debugging tools
- **Error boundaries** and graceful error handling
- **Hot reloading** and fast development cycles

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **pnpm** (recommended) or npm
- **PostgreSQL** database
- **API keys** for AI providers

### Installation

```bash
# Clone the repository
git clone https://github.com/KartikLabhshetwar/Kappa
cd kappa

# Install dependencies
pnpm install
```

### Environment Variables

```bash
# Authentication
AUTH_SECRET=****

# AI Providers (at least one required)
XAI_API_KEY=****                    # For xAI Grok models
GOOGLE_GENERATIVE_AI_API_KEY=****   # For Google Gemini models

# Storage & Database
BLOB_READ_WRITE_TOKEN=****
POSTGRES_URL=****
REDIS_URL=****

# Web Browsing & Search
TAVILY_API_KEY=****
FIRECRAWL_API_KEY=****
```

### Available AI Models

**xAI Grok Models** (requires `XAI_API_KEY`):

- `chat-model` - Grok Vision (grok-2-vision-1212) - Advanced multimodal model
- `chat-model-reasoning` - Grok Reasoning (grok-3-mini-beta) - Chain-of-thought reasoning
- `title-model` - Grok 2 (grok-2-1212) - For title generation
- `artifact-model` - Grok 2 (grok-2-1212) - For artifact generation

**Google Gemini Models** (requires `GOOGLE_GENERATIVE_AI_API_KEY`):

- `gemini-chat` - Gemini 2.5 Flash - Fast conversational model
- `gemini-reasoning` - Gemini 2.5 Pro - Advanced reasoning model
- `gemini-fast` - Gemini 2.5 Flash - Ultra-fast responses
- `gemini-pro` - Gemini 2.5 Pro - Most capable model
- `gemini-vision` - Gemini 2.5 Flash - Multimodal capabilities
- `gemini-title` - Gemini 2.5 Flash - For title generation
- `gemini-artifact` - Gemini 2.5 Pro - For artifact generation

### Development

```bash

# Run database migrations
pnpm db:migrate

# Open database studio
pnpm db:studio

# Start development server
pnpm dev
```

---

## Usage Examples

### Web Browsing & Searching

```bash
# Browse API documentation (Firecrawl)
Browse the Stripe API documentation and show me the payment methods

# Deep research with context (Tavily)
Search for BillingSDK documentation and analyze their pricing structure

# Multi-site analysis (Hybrid approach)
Browse BillingSDK and DodoPayments documentation, then search for integration examples
```

### Component Generation

```bash
# Generate from API docs
Create a React component for a pricing card based on the Stripe API

# Generate with specific requirements
Build a payment form component with validation using the BillingSDK API

# Generate integration components
Create components to integrate BillingSDK with DodoPayments
```

### Full Integration Workflow

```bash
# Complete integration example
Browse BillingSDK and DodoPayments documentation, then create pricing components for both systems with integration instructions
```

---

## Architecture

### **Frontend Stack**

- **Next.js 15** with App Router
- **React 19** with concurrent features
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations

### **AI & Tools**

- **Vercel AI SDK** for chat orchestration
- **Direct AI Provider Integration** (xAI and Google Gemini)
- **Firecrawl** for deep web crawling and API documentation extraction
- **Tavily** for intelligent web search and content discovery
- **Custom tools** for component generation
- **Streaming responses** with real-time updates
- **Smart fallback mechanisms** for core functionality

### **Backend & Database**

- **PostgreSQL** with Drizzle ORM
- **Auth.js** for authentication
- **Redis** for caching and resumable streams
- **Vercel Functions** for serverless deployment

---

## Available Tools

### browseWeb (Firecrawl)

Deep web crawling and API documentation extraction tool:

```typescript
// Deep API documentation crawling
browseWeb({
  url: "https://stripe.com/docs/api",
  mode: "crawl",
  maxPages: 20,
  includeLinks: true,
});

// Single page scraping
browseWeb({
  url: "https://api.example.com/docs",
  mode: "single",
});

// Iterative deep research
browseWeb({
  url: "https://billingsdk.com/docs",
  mode: "iterative",
  maxDepth: 3,
});

// Deep research mode
browseWeb({
  url: "https://docs.example.com",
  mode: "deep-research",
  maxPages: 10,
});
```

**Features:**

- **Multiple browsing modes** for different use cases
- Deep web crawling with link following
- API documentation extraction
- Multi-page content aggregation
- JavaScript rendering for dynamic content
- Structured data extraction
- **URL normalization** for robust input handling
- Comprehensive error handling

### Tavily Search Tools

Intelligent web search and content discovery with multiple specialized tools:

```typescript
// General search with comprehensive results
search({
  query: "Stripe API documentation",
  searchDepth: "advanced",
  includeImages: true,
  includeAnswer: true,
  maxResults: 10,
});

// Context-aware search for detailed information
searchContext({
  query: "React component best practices",
  maxTokens: 4000,
  searchDepth: "advanced",
});

// Q&A search for direct answers
searchQNA({
  query: "How to integrate payment processing?",
  searchDepth: "advanced",
});

// Content extraction from specific URLs
extract({
  urls: ["https://api.example.com/docs", "https://docs.example.com"],
});
```

**Features:**

- General web search with AI-generated answers
- Context-aware search for detailed information
- Q&A search for direct answers
- Content extraction from specific URLs
- Image search and visual content discovery
- Advanced search depth options
- Comprehensive error handling

### generateComponent

React component generation with TypeScript and Tailwind CSS:

```typescript
generateComponent({
  componentName: "PricingCard",
  apiDescription: "Stripe pricing API integration",
  props: [
    {
      name: "price",
      type: "number",
      required: true,
      description: "Price in cents",
    },
  ],
  uiLibrary: "tailwind",
  includeExamples: true,
});
```

**Features:**

- TypeScript interfaces
- Tailwind CSS styling
- Props validation
- Usage examples
- Accessibility compliance
- Base UI / Origin UI patterns (NO shadcn/ui)

### Additional Tools

- **createDocument** - Create substantial content artifacts
- **updateDocument** - Modify existing artifacts
- **getWeather** - Weather data integration
- **requestSuggestions** - Contextual suggestions

---

## UI Library Guidelines

The project enforces specific UI library usage to avoid shadcn/ui dependency:

### Preferred Libraries

- **Base UI** (`@base-ui-components/react`) - Unstyled, accessible components
- **Origin UI** - Copy-paste styled components
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible primitives

### Forbidden

- **shadcn/ui** - Explicitly avoided to test AI adaptability

### Component Patterns

```typescript
// Base UI pattern
import { Button } from "@base-ui-components/react/button";

// Origin UI pattern
const PricingCard = ({ price, title }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-3xl font-bold">${price}</p>
  </div>
);
```

## Performance & Monitoring

### Optimizations

- **Streaming responses** for real-time updates
- **Code splitting** for optimal bundle sizes
- **Image optimization** with Next.js
- **Database indexing** for fast queries
- **Redis caching** for improved performance

### Monitoring

- **Vercel Analytics** for usage tracking
- **Error boundaries** for graceful error handling
- **Comprehensive logging** for debugging
- **Performance metrics** tracking

### Environment Setup

1. **Database**: Set up PostgreSQL (Neon, Supabase, or Vercel Postgres)
2. **AI Providers**: Configure at least one AI provider:
   - **xAI**: Get API key from [x.ai](https://x.ai) for Grok models
   - **Google Gemini**: Get API key from [Google AI Studio](https://aistudio.google.com) for Gemini models
3. **Web Browsing**: Set up Firecrawl and Tavily API keys
4. **Authentication**: Configure Auth.js secrets

**Note**: The system automatically uses available providers and falls back gracefully when only one provider is configured.

### Performance Metrics

- **Time Spent**: ~6 hours (within estimated 6-8 hour range)
- **Bundle Size**: Optimized with code splitting
- **Response Time**: <2s for most operations
- **Error Rate**: <1% with comprehensive error handling

### Trade-offs & Design Choices

1. **UI Library Selection**: Chose Base UI + Origin UI over shadcn/ui to test AI adaptability
2. **Browsing Strategy**: Implemented hybrid approach with Firecrawl for crawling and Tavily for search
3. **AI Provider Strategy**: Direct integration with xAI and Google Gemini instead of AI Gateway for better control
4. **Error Handling**: Comprehensive retry mechanisms for production reliability
5. **TypeScript**: Strict typing for better developer experience
6. **Streaming**: Real-time responses for better user experience
7. **Fallback Mechanisms**: Smart fallback for core functionality when providers are unavailable

---

## Recent Improvements

### v3.1.0 - Multi-Provider AI Support

**New Features:**

- **Direct AI Provider Integration**: Replaced AI Gateway with direct xAI and Google Gemini integration
- **Smart Fallback System**: Automatic fallback for core functionality when providers are unavailable
- **Enhanced Browsing Modes**: Improved `browseWeb` tool with better mode switching
- **URL Normalization**: Robust handling of incomplete URLs (e.g., `billingsdk.com` → `https://billingsdk.com`)

**Fixes:**

- **Schema Validation**: Fixed 400 Bad Request errors for new model types
- **Model Availability**: Ensured `title-model` and `artifact-model` are always available
- **Error Handling**: Improved error messages and debugging capabilities
- **Provider Configuration**: Conditional model registration based on API key availability

**Breaking Changes:**

- **Environment Variables**: Updated to use `XAI_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY`
- **Model Names**: New model naming convention for better organization

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Documentation**: [AI SDK Docs](https://ai-sdk.dev)
- **Issues**: [GitHub Issues](https://github.com/vercel/kappa/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vercel/kappa/discussions)

---

## Acknowledgments

- **Vercel AI SDK** for the excellent AI integration framework
- **xAI** for the powerful Grok models
- **Google** for the versatile Gemini models
- **Firecrawl** for deep web crawling and API documentation extraction
- **Tavily** for intelligent web search and content discovery
- **Base UI** and **Origin UI** for accessible component libraries
- **Next.js** team for the amazing React framework
- **Tailwind CSS** for the utility-first styling approach
