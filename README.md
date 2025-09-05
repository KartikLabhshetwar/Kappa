# Kappa

> AI-powered chat interface with web browsing and React component generation capabilities.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fkappa&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fkappa%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Features

- **Multi-Model Support**: xAI Grok, Google Gemini (Pro, Flash, Pro Vision)
- **Web Browsing**: AI-powered web scraping with [Firecrawl](https://firecrawl.dev)
- **Component Generation**: Generate React components from API documentation
- **TypeScript**: Full type safety and IntelliSense support
- **Streaming**: Real-time AI responses with tool integration
- **Authentication**: Secure user management with Auth.js

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database
- API keys for AI providers

### Installation

```bash
# Clone and install
git clone https://github.com/vercel/kappa.git
cd kappa
pnpm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kappa"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI Providers
XAI_API_KEY="your-xai-api-key"                    # For Grok models
GOOGLE_GENERATIVE_AI_API_KEY="your-google-key"    # For Gemini models

# Web Scraping
FIRECRAWL_API_KEY="fc-your-firecrawl-key"

# Optional: Redis for resumable streams
REDIS_URL="redis://localhost:6379"
```

### Development

```bash
# Start development server
pnpm dev

# Database migration
pnpm db:migrate
```

## Usage

### Web Browsing

```
Browse the Stripe API documentation and show me the payment methods
```

### Component Generation

```
Create a React component for a pricing card based on the Stripe API
```

### Full Integration

```
Browse billingsdk.com and dodopayments.com, then create pricing components for both
```

## Architecture

- **Frontend**: Next.js 15 with App Router, React 19, TailwindCSS
- **AI**: Vercel AI SDK with multi-provider support
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Auth.js with guest access
- **Web Scraping**: Firecrawl API integration
- **Deployment**: Vercel-optimized

## API Reference

### Tools

- `browseWeb(url, options)` - Scrape and analyze web content
- `generateComponent(name, props, options)` - Generate React components

### Models

- **Grok Vision** - Multimodal capabilities
- **Grok Reasoning** - Chain-of-thought reasoning
- **Gemini Pro** - Complex reasoning and code generation
- **Gemini Flash** - Fast responses
- **Gemini Pro Vision** - Advanced vision understanding

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [Documentation](https://chat-sdk.dev)
- [Issues](https://github.com/vercel/kappa/issues)
- [Discussions](https://github.com/vercel/kappa/discussions)
