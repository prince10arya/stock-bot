# StockBot on Groq — Codebase Documentation

> **Lightning-fast AI chatbot** that responds with live interactive stock charts, financials, news, screeners, and more — powered by [Groq](https://groq.com) and [TradingView](https://www.tradingview.com/).

> **Design system**: Claude/Anthropic-inspired warm parchment aesthetic. See [`DESIGN.md`](./DESIGN.md) for the full spec. Key tokens: Parchment `#f5f4ed` background, Terracotta `#c96442` accent, Lora serif headlines, Inter sans UI text, warm-toned neutrals only.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture](#architecture)
5. [Data Flow](#data-flow)
6. [Core Modules](#core-modules)
   - [lib/chat/actions.tsx](#libchatactionstsx)
   - [lib/types.ts](#libtypests)
   - [lib/utils.ts](#libutilsts)
7. [Components](#components)
   - [Layout & Shell](#layout--shell)
   - [Chat Components](#chat-components)
   - [Stock / TradingView Widgets](#stock--tradingview-widgets)
   - [UI Primitives](#ui-primitives)
8. [AI Tools Reference](#ai-tools-reference)
9. [Hooks](#hooks)
10. [Environment Variables](#environment-variables)
11. [Scripts & Commands](#scripts--commands)
12. [Known Architectural Issues](#known-architectural-issues)

---

## Project Overview

StockBot is a **Generative UI chatbot** built on the Vercel AI SDK RSC (`ai/rsc`) framework. The user types a natural language question about stocks or markets; the LLM (Llama 3.3 70B running on Groq) decides which TradingView widget to render and streams both the widget and a short caption back to the user — all in real time.

**Key capabilities:**

| Capability | How |
|---|---|
| Stock charts | TradingView `AdvancedChart` widget |
| Live price + history | TradingView `SymbolOverview` widget |
| Company financials | TradingView `Financials` widget |
| Latest news | TradingView `Timeline` widget |
| Stock screener | TradingView `ScreenerWidget` |
| Market overview | TradingView `MarketOverview` widget |
| Market heatmap | TradingView `MarketHeatMap` widget |
| ETF heatmap | TradingView `ETFHeatMap` widget |
| Trending stocks | TradingView `HotLists` widget |
| Ticker tape | TradingView `Ticker` tape (always visible on empty screen) |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 14.2.4 |
| Language | TypeScript | ^5.5.2 |
| AI SDK | Vercel AI SDK (`ai`) | ^3.2.16 |
| LLM Provider | Groq (via `@ai-sdk/openai` compat layer) | ^0.0.34 |
| LLM Model | `llama-3.3-70b-versatile` | — |
| UI Components | Radix UI primitives + shadcn/ui convention | ^1–2.x |
| Styling | Tailwind CSS | ^3.4.4 |
| Animations | Framer Motion | ^11.2.12 |
| Font | Geist Sans & Geist Mono | ^1.3.0 |
| Toasts | Sonner | ^1.5.0 |
| Markdown | react-markdown + remark-gfm | ^8 / ^3 |
| Schema validation | Zod | ^3.23.8 |
| ID generation | nanoid (custom alphabet, 7-char) | ^5.0.7 |
| Package manager | pnpm | 8.6.3 |

---

## Project Structure

```
stockbot-on-groq/
├── app/
│   ├── (chat)/                   # Route group — the main chat UI
│   │   ├── layout.tsx            # Chat-specific layout wrapper
│   │   └── page.tsx              # "/" route — renders <Chat>
│   ├── new/                      # "/new" route — redirects/creates a new chat
│   ├── actions.ts                # Top-level server action (checkApiKey)
│   ├── error.tsx                 # Next.js error boundary
│   ├── globals.css               # Global CSS / Tailwind base
│   └── layout.tsx                # Root layout (font, Header, Providers)
│
├── components/
│   ├── chat.tsx                  # Root chat orchestrator (client)
│   ├── chat-list.tsx             # Renders the message list
│   ├── chat-panel.tsx            # Bottom panel: example chips + prompt form
│   ├── prompt-form.tsx           # Textarea + submit button
│   ├── button-scroll-to-bottom.tsx
│   ├── empty-screen.tsx          # Shown when no messages yet
│   ├── header.tsx                # Sticky top bar (logo, GitHub link)
│   ├── footer.tsx                # Footer disclaimer text
│   ├── markdown.tsx              # Renders markdown via react-markdown
│   ├── missing-api-key-banner.tsx # Warning banner when GROQ_API_KEY missing
│   ├── model-selector.tsx        # (UI only — model is hardcoded server-side)
│   ├── providers.tsx             # next-themes ThemeProvider wrapper
│   ├── theme-toggle.tsx          # 'use client' component using useTheme from next-themes
│   ├── external-link.tsx         # Styled <a> for external URLs
│   │
│   ├── stocks/
│   │   ├── message.tsx           # BotCard, BotMessage, UserMessage, SpinnerMessage
│   │   └── spinner.tsx           # Loading spinner SVG
│   │
│   ├── tradingview/              # One file per TradingView widget (10 total)
│   │   ├── stock-chart.tsx
│   │   ├── stock-price.tsx
│   │   ├── stock-financials.tsx
│   │   ├── stock-news.tsx
│   │   ├── stock-screener.tsx
│   │   ├── market-overview.tsx
│   │   ├── market-heatmap.tsx
│   │   ├── market-trending.tsx
│   │   ├── etf-heatmap.tsx
│   │   └── ticker-tape.tsx
│   │
│   └── ui/                       # shadcn/ui primitives (button, icons, etc.)
│
├── lib/
│   ├── chat/
│   │   └── actions.tsx           # ⭐ Core AI logic — ALL tool definitions, AI state, Groq client
│   ├── hooks/
│   │   ├── use-copy-to-clipboard.tsx
│   │   ├── use-enter-submit.tsx
│   │   ├── use-local-storage.ts
│   │   ├── use-scroll-anchor.tsx
│   │   └── use-streamable-text.ts
│   ├── types.ts                  # Shared TypeScript types
│   └── utils.ts                  # cn(), nanoid, fetcher, formatDate, ResultCode
│
├── .env                          # Local secrets (gitignored)
├── .env.example                  # Template for required env vars
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Architecture

```
Browser (Client)
│
│  useUIState()  ←─────────────────────────────────────────┐
│  useAIState()                                            │
│  useActions() → submitUserMessage(text)                  │
│       │                                                  │
│  React RSC streaming ──────────────────────────────────►│
│                                                         │
│                    Next.js Server (RSC)                 │
│                    ┌──────────────────────────────────┐ │
│                    │  submitUserMessage()              │ │
│                    │    ├─ MutableAIState.update()    │ │
│                    │    ├─ createOpenAI (Groq compat) │ │
│                    │    ├─ streamUI(model, tools)     │ │
│                    │    │   └─ LLM picks a tool       │ │
│                    │    │       └─ generate*()        │ │
│                    │    │           ├─ yield <Spinner> │ │
│                    │    │           ├─ aiState.done() │ │
│                    │    │           ├─ generateCaption│ │ (2nd LLM call)
│                    │    │           └─ return <Widget>│ │
│                    │    └─ return { id, display }     │ │
│                    └──────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Patterns

- **Generative UI (RSC)**: The server streams React nodes (not just text) back to the client. Widget components are rendered on the server and hydrated on the client.
- **Dual LLM calls per tool use**: `submitUserMessage` calls the LLM once for tool selection, then `generateCaption` makes a *second* call for the accompanying text description.
- **Mutable AI State**: `getMutableAIState()` is used to append messages (including tool-call + tool-result pairs) to the conversation history, keeping the multi-turn context accurate.
- **Groq via OpenAI compat**: The `@ai-sdk/openai` `createOpenAI()` is pointed at `https://api.groq.com/openai/v1` with the Groq API key, reusing the OpenAI SDK wire protocol.

---

## Data Flow

```
User types message
       │
       ▼
PromptForm → submitUserMessage(content)                  [client action call]
       │
       ▼
aiState.update() ─ appends user message to history
       │
       ▼
streamUI(groq model, tools)                              [server, streaming]
       │
       ├─ LLM returns plain text → BotMessage (streamed)
       │
       └─ LLM calls a tool (e.g. showStockChart)
              │
              ├─ yield <BotCard><></> </BotCard>          [immediate spinner]
              │
              ├─ aiState.done() ─ appends tool-call + tool-result
              │
              ├─ generateCaption()                        [2nd Groq call, await]
              │
              └─ return <BotCard>
                           <StockChart .../>
                           {caption}
                         </BotCard>                      [final streamed UI]
```

---

## Core Modules

### `lib/chat/actions.tsx`

The **heart of the application** — a single 848-line server file that owns:

| Concern | Details |
|---|---|
| Groq client | `createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey })` — created inline in two places |
| Model constants | `MODEL = 'llama-3.3-70b-versatile'`, `TOOL_MODEL = 'llama-3.3-70b-versatile'` |
| `AIState` type | `{ chatId: string; messages: Message[] }` |
| `UIState` type | `{ id: string; display: React.ReactNode }[]` |
| `generateCaption()` | Async fn — takes `symbol`, `comparisonSymbols`, `toolName`, `aiState`; makes a non-streaming LLM call and returns a 2–3 sentence description |
| `submitUserMessage()` | Server action — orchestrates the full tool-calling + streaming pipeline |
| Tool definitions | 9 tools defined inline (see [AI Tools Reference](#ai-tools-reference)) |
| `AI` export | `createAI<AIState, UIState>({ actions, initialUIState, initialAIState })` — the RSC AI context |

**System prompt** (used in `submitUserMessage`):
> "You are a stock market conversation bot. You can provide the user information about stocks include prices and charts in the UI. You do not have access to any information and should only provide information by calling functions."

**Caption system prompt** (used in `generateCaption`):
> Similar to above, but instructs the model to generate a 2–3 sentence natural language caption to accompany the widget already shown.

---

### `lib/types.ts`

```ts
type Message = CoreMessage & { id: string }

interface Chat {
  id: string; title: string; createdAt: Date
  userId: string; path: string
  messages: Message[]; sharePath?: string
}

type ServerActionResult<Result> = Promise<Result | { error: string }>

interface Session { user: { id: string; email: string } }
interface AuthResult { type: string; message: string }
interface User { id: string; email: string; password: string; salt: string }
```

> **Note:** `Chat`, `Session`, `AuthResult`, and `User` types are defined but not actively used in the current (auth-free) version of the app — they are scaffolding for a future auth layer.

---

### `lib/utils.ts`

| Export | Purpose |
|---|---|
| `cn(...inputs)` | Merges Tailwind classes via `clsx` + `tailwind-merge` |
| `nanoid` | Custom 7-char alphanumeric ID generator |
| `fetcher<JSON>()` | Typed `fetch` wrapper with error extraction |
| `formatDate(input)` | Formats a date to `"Month DD, YYYY"` |
| `formatNumber(value)` | Formats a number as USD currency |
| `runAsyncFnWithoutBlocking(fn)` | Fire-and-forget async call |
| `sleep(ms)` | Promise-based delay |
| `getStringFromBuffer(buffer)` | ArrayBuffer → hex string (for auth/crypto) |
| `ResultCode` (enum) | String codes for auth result states |
| `getMessageFromCode(code)` | Maps `ResultCode` → human-readable message |

---

## Components

### Layout & Shell

#### `app/layout.tsx` — Root Layout
- Sets font variables: `GeistSans`, `GeistMono`
- Wraps everything in `<Providers>` (next-themes) and `<Header>`
- Sets global `metadata` and `viewport` (theme color)
- `<ThemeToggle>` is present but commented out

#### `components/header.tsx` — Header
- Sticky, glassmorphic top bar (`backdrop-blur-xl`, gradient background)
- Left side: StockBot name + "Start New Chat" link (`/new`)
- Right side: **ThemeToggle** (sun/moon icon button) + GitHub repository link with icon

#### `components/providers.tsx`
- Thin wrapper around `next-themes` `ThemeProvider`

#### `components/footer.tsx`
- Disclaimer footer text (rendered inside `ChatPanel`)

---

### Chat Components

#### `components/chat.tsx` — Chat Orchestrator *(client)*
The root chat component. Responsibilities:
- Reads `useUIState()` and `useAIState()` from RSC context
- Handles URL rewriting on first message (`/chat/:id`)
- Triggers router refresh after 2nd message (title update)
- Persists `newChatId` to localStorage
- Shows `<MissingApiKeyBanner>` or `<TickerTape>` at the top depending on state
- Delegates rendering to `<ChatList>` and input to `<ChatPanel>`
- Uses `useScrollAnchor()` for auto-scroll behavior

#### `components/chat-list.tsx`
- Maps over `messages` (UIState) and renders each `display` node

#### `components/chat-panel.tsx` *(client)*
- Fixed bottom panel
- Shows 2–6 **example prompt chips** (randomised on mount, responsive grid)
- Clicking a chip calls `submitUserMessage` directly
- Contains `<PromptForm>` and `<FooterText>`

#### `components/prompt-form.tsx` *(client)*
- Auto-resizing textarea (`react-textarea-autosize`)
- Enter to submit (via `useEnterSubmit` hook)
- Calls `submitUserMessage` and updates UIState optimistically

#### `components/empty-screen.tsx`
- Shown when `messages.length === 0`
- Displays the StockBot tagline and brief feature list

#### `components/missing-api-key-banner.tsx`
- Shows a warning if `GROQ_API_KEY` is not set

#### `components/button-scroll-to-bottom.tsx`
- Floating button that appears when not at bottom of scroll

#### `components/markdown.tsx`
- Wraps `react-markdown` with `remarkGfm` plugin

---

### Stock / TradingView Widgets

All widgets in `components/tradingview/` follow the same pattern:
1. A React functional component that accepts props (usually `symbol` or `props`)
2. Uses `useEffect` to inject a `<script>` tag that initialises the TradingView widget
3. Renders a `<div>` as the widget mount point

| Component | TradingView Widget | Key Props |
|---|---|---|
| `StockChart` | `AdvancedChart` | `symbol`, `comparisonSymbols[]` |
| `StockPrice` | `SymbolOverview` | `props` (symbol string) |
| `StockFinancials` | `Financials` | `props` (symbol string) |
| `StockNews` | `Timeline` | `props` (symbol string) |
| `StockScreener` | `ScreenerWidget` | none |
| `MarketOverview` | `MarketOverview` | none |
| `MarketHeatmap` | `MarketHeatMap` | none |
| `MarketTrending` | `HotLists` | none |
| `ETFHeatmap` | `ETFHeatMap` | none |
| `TickerTape` | `Ticker` | none (always AAPL, GOOGL, AMZN, NVDA, TSLA…) |

#### `components/stocks/message.tsx`
Defines the four message wrapper components:

| Component | Description |
|---|---|
| `UserMessage` | Right-aligned user bubble |
| `BotMessage` | Left-aligned streaming bot text (uses `useStreamableText`) |
| `BotCard` | Container for a TradingView widget response |
| `SpinnerMessage` | Spinner shown while a tool is generating |

---

### UI Primitives

`components/ui/` follows the shadcn/ui pattern — hand-owned copies of Radix UI components styled with Tailwind. Includes: `button`, `icons`, `sonner` (toast), `select`, `separator`, `tooltip`, `dialog`, `alert-dialog`, `dropdown-menu`, `label`, `switch`, `slot`.

---

## AI Tools Reference

All 9 tools are defined inside `submitUserMessage` in `lib/chat/actions.tsx`. Each is a Zod-validated tool with a `generate` async generator.

| Tool Name | Description | Parameters |
|---|---|---|
| `showStockChart` | Shows a stock chart; optionally overlays multiple tickers | `symbol: string`, `comparisonSymbols: { symbol, position }[]` |
| `showStockPrice` | Shows real-time price + price history | `symbol: string` |
| `showStockFinancials` | Shows company financial statements | `symbol: string` |
| `showStockNews` | Shows latest news & events for a stock/crypto | `symbol: string` |
| `showStockScreener` | Opens a generic stock screener | _(no params)_ |
| `showMarketOverview` | Shows stocks, futures, bonds, forex overview | _(no params)_ |
| `showMarketHeatmap` | Shows sector heatmap (preferred over MarketOverview for stocks) | _(no params)_ |
| `showETFHeatmap` | Shows ETF heatmap (preferred over MarketOverview for ETFs) | _(no params)_ |
| `showTrendingStocks` | Shows top gaining, losing, and most-active stocks today | _(no params)_ |

**Cryptocurrency note:** All crypto tickers must have `"USD"` appended (e.g. `DOGE` → `DOGEUSD`). This is enforced via the system prompt.

---

## Hooks

Located in `lib/hooks/`:

| Hook | File | Purpose |
|---|---|---|
| `useLocalStorage` | `use-local-storage.ts` | Typed get/set with localStorage, SSR-safe |
| `useScrollAnchor` | `use-scroll-anchor.tsx` | Tracks scroll position; exposes `isAtBottom`, `scrollToBottom`, and refs for `messagesRef`, `scrollRef`, `visibilityRef` |
| `useEnterSubmit` | `use-enter-submit.tsx` | Returns `formRef` + `onKeyDown` handler — submits on Enter, new line on Shift+Enter |
| `useCopyToClipboard` | `use-copy-to-clipboard.tsx` | Copies a string to clipboard; returns `{ isCopied, copyToClipboard }` |
| `useStreamableText` | `use-streamable-text.ts` | Reads a `StreamableValue<string>` and returns the accumulated string for progressive rendering |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | API key from [console.groq.com](https://console.groq.com) |

The app checks for this key in `app/actions.ts` (`checkApiKey`) and surfaces a `<MissingApiKeyBanner>` to the user if missing. The key is read server-side in `lib/chat/actions.tsx` via `process.env.GROQ_API_KEY`.

---

## Scripts & Commands

```bash
# Development (Turbopack)
npm run dev         # or: pnpm dev

# Production build
npm run build
npm run start

# Preview (build + start)
npm run preview

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npm run format:write
npm run format:check
```

---

## Known Architectural Issues

The following friction points exist in the current codebase (surfaced by the `improve-codebase-architecture` skill analysis):

| # | Issue | Affected Files | Severity |
|---|---|---|---|
| 1 | **God-module `actions.tsx`** — all 9 tools, Groq client, state mutations, and AI context in one 848-line file | `lib/chat/actions.tsx` | 🔴 High |
| 2 | **Groq client constructed twice** — `createOpenAI(...)` called separately in `generateCaption` and `submitUserMessage` | `lib/chat/actions.tsx` L60, L190 | 🟠 Medium |
| 3 | **System prompt duplication** — tool list described in both the routing prompt and the caption prompt independently | `lib/chat/actions.tsx` L74–146, L199–217 | 🟠 Medium |
| 4 | **10 shallow TradingView wrappers** — each is a pass-through `<script>` injector; all could be one `TradingViewWidget` with a `variant` prop | `components/tradingview/*.tsx` | 🟡 Low |
| 5 | **`aiState.done()` pattern repeated 9× verbatim** — only `toolName` and `args` differ per tool | `lib/chat/actions.tsx` (each tool block) | 🟠 Medium |
| 6 | **Unused auth types** — `Chat`, `User`, `AuthResult`, `Session`, `ResultCode`, `getMessageFromCode` are defined but have no live callers | `lib/types.ts`, `lib/utils.ts` | 🟡 Low |

---

*Generated by Antigravity — 2026-04-26*
