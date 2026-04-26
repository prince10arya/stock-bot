# StockBot Backend — Codebase & API Documentation

> **AI-powered stock market chatbot backend** — FastAPI, LangGraph, SQLModel, Groq.
> Use this document as the contract for building the frontend.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Architecture](#architecture)
4. [API Endpoints](#api-endpoints)
   - [Health Check](#1-health-check)
   - [Send Message](#2-send-message)
   - [Send Message (SSE Streaming)](#3-send-message-sse-streaming)
   - [List Chats](#4-list-chats)
   - [Get Chat](#5-get-chat-by-id)
   - [Delete Chat](#6-delete-chat)
5. [Data Models](#data-models)
6. [Widget Types Reference](#widget-types-reference)
7. [LangGraph Agent Flow](#langgraph-agent-flow)
8. [Environment Variables](#environment-variables)
9. [Running the Backend](#running-the-backend)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| API Framework | FastAPI | >=0.115.0 |
| ORM | SQLModel (SQLAlchemy + Pydantic) | >=0.0.22 |
| AI Orchestration | LangGraph | >=0.4.0 |
| LLM Provider | Groq (langchain-groq) | >=0.3.0 |
| LLM Model | `llama-3.3-70b-versatile` | — |
| Validation | Pydantic + pydantic-settings | >=2.6.0 |
| Logging | structlog (JSON) | >=24.4.0 |
| Database | SQLite (aiosqlite) | — |
| Streaming | sse-starlette | >=2.1.0 |
| Python | 3.12+ | — |

---

## Project Structure

```
stock-bot-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app, lifespan, middleware
│   ├── config.py                # Pydantic Settings (env vars)
│   ├── database.py              # SQLModel async engine + sessions
│   ├── logging.py               # structlog + correlation ID middleware
│   │
│   ├── models/                  # SQLModel DB models
│   │   ├── __init__.py
│   │   ├── base.py              # Timestamp utilities
│   │   └── chat.py              # Chat, Message tables
│   │
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── chat.py              # ChatCreate, ChatResponse, MessageResponse
│   │   └── stock.py             # StockToolCall, StockToolResult
│   │
│   ├── api/                     # FastAPI routers
│   │   ├── __init__.py
│   │   ├── health.py            # GET /health
│   │   └── chat.py              # Chat CRUD + AI endpoints
│   │
│   ├── agent/                   # LangGraph AI agent
│   │   ├── __init__.py
│   │   ├── state.py             # AgentState TypedDict
│   │   ├── tools.py             # 9 stock tools
│   │   ├── nodes.py             # LLM call, tool execution, caption generation
│   │   └── graph.py             # StateGraph definition + compile
│   │
│   └── services/                # Business logic
│       ├── __init__.py
│       └── chat_service.py      # Agent invocation + DB persistence
│
├── tests/
│   ├── conftest.py              # Fixtures (in-memory DB, test client)
│   ├── test_api.py              # API endpoint tests
│   └── test_agent.py            # Tool unit tests
│
├── .env.example
├── api.rest                     # VS Code REST Client file
├── pyproject.toml
├── Dockerfile
└── README.md
```

---

## Architecture

```
Frontend (React/Next.js)
    │
    │  HTTP / SSE
    │
    ▼
┌──────────────────────────────────────────────┐
│  FastAPI Server (app/main.py)                │
│  ├─ CORS Middleware                          │
│  ├─ Correlation ID Middleware                │
│  │                                           │
│  ├─ /health          → health router         │
│  ├─ /api/chat        → chat router           │
│  ├─ /api/chat/stream → SSE streaming         │
│  └─ /api/chats       → CRUD operations       │
│                                              │
│  Chat Service (app/services/chat_service.py) │
│  ├─ Persist messages to SQLite               │
│  ├─ Build conversation history               │
│  └─ Invoke LangGraph agent                   │
│                                              │
│  LangGraph Agent (app/agent/)                │
│  ├─ call_model    → Groq LLM + 9 tools      │
│  ├─ execute_tools → Run tool calls           │
│  └─ generate_caption → 2nd LLM call          │
│                                              │
│  SQLModel DB (SQLite)                        │
│  ├─ chats table                              │
│  └─ messages table                           │
└──────────────────────────────────────────────┘
```

---

## API Endpoints

**Base URL:** `http://localhost:8000`

All endpoints return JSON. Errors return `{"detail": "error message"}` with appropriate HTTP status codes.

### Common Headers

```
Content-Type: application/json
X-Correlation-ID: <optional, auto-generated if absent — returned in response>
```

---

### 1. Health Check

```
GET /health
```

**Response** `200 OK`

```json
{
    "status": "ok",
    "model": "llama-3.3-70b-versatile",
    "service": "stockbot-backend"
}
```

---

### 2. Send Message

Send a message to the AI and get the full response (blocking).

```
POST /api/chat
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `content` | `string` | ✅ | User message (1–2000 chars) |
| `chat_id` | `string` | ❌ | Existing chat ID to continue. If omitted, creates new chat. |

**Example — New Chat**

```json
{
    "content": "Show me the AAPL stock chart"
}
```

**Example — Continue Chat**

```json
{
    "content": "Now show me the financials",
    "chat_id": "a1b2c3d4e5"
}
```

**Response** `200 OK`

```json
{
    "chat_id": "a1b2c3d4e5",
    "response": "Apple Inc. (AAPL) is currently trading at around $185. The chart shows a steady uptrend over the past quarter with strong support at the $175 level.",
    "tool_results": [
        {
            "widget": "AdvancedChart",
            "props": {
                "symbol": "AAPL"
            },
            "tool_name": "show_stock_chart",
            "tool_args": {
                "symbol": "AAPL"
            }
        }
    ]
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `404` | `chat_id` provided but not found |
| `422` | Validation error (empty content, too long, etc.) |
| `500` | LLM or internal error |

---

### 3. Send Message (SSE Streaming)

Same as Send Message, but streams the response via **Server-Sent Events**.

```
POST /api/chat/stream
Content-Type: application/json
```

**Request Body** — Same as [Send Message](#2-send-message).

**Response** `200 OK` — `text/event-stream`

The stream emits these event types in order:

| Event Type | Data Format | Description |
|---|---|---|
| `tool_result` | JSON object | Each tool result (may fire 0–N times) |
| `caption` | Plain text string | AI-generated caption for widgets |
| `done` | `{"chat_id": "..."}` | Stream complete |
| `error` | `{"error": "..."}` | If processing fails |

**Example SSE Stream**

```
event: tool_result
data: {"widget": "AdvancedChart", "props": {"symbol": "AAPL"}, "tool_name": "show_stock_chart", "tool_args": {"symbol": "AAPL"}}

event: caption
data: Apple Inc. (AAPL) is currently trading at around $185. The chart shows a steady uptrend over the past quarter.

event: done
data: {"chat_id": "a1b2c3d4e5"}
```

**Frontend SSE consumption (JavaScript)**

```javascript
const eventSource = new EventSource('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Show me AAPL chart' })
});

// Or use fetch with ReadableStream:
const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Show me AAPL chart' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    // Parse SSE events from text
    // event: tool_result\ndata: {...}\n\n
}
```

---

### 4. List Chats

```
GET /api/chats
```

**Response** `200 OK`

```json
[
    {
        "id": "a1b2c3d4e5",
        "title": "Show me the AAPL stock chart",
        "created_at": "2026-04-26T03:15:00Z",
        "updated_at": "2026-04-26T03:16:30Z",
        "message_count": 4
    },
    {
        "id": "f6g7h8i9j0",
        "title": "What are trending stocks today?",
        "created_at": "2026-04-25T10:00:00Z",
        "updated_at": "2026-04-25T10:05:00Z",
        "message_count": 2
    }
]
```

Returns chats in **most-recently-updated-first** order.

---

### 5. Get Chat by ID

```
GET /api/chats/{chat_id}
```

**Path Parameters**

| Param | Type | Description |
|---|---|---|
| `chat_id` | `string` | Chat identifier |

**Response** `200 OK`

```json
{
    "id": "a1b2c3d4e5",
    "title": "Show me the AAPL stock chart",
    "created_at": "2026-04-26T03:15:00Z",
    "updated_at": "2026-04-26T03:16:30Z",
    "messages": [
        {
            "id": "msg_001",
            "role": "user",
            "content": "Show me the AAPL stock chart",
            "tool_name": null,
            "tool_args": null,
            "created_at": "2026-04-26T03:15:00Z"
        },
        {
            "id": "msg_002",
            "role": "tool",
            "content": "{\"widget\": \"AdvancedChart\", \"props\": {\"symbol\": \"AAPL\"}, \"tool_name\": \"show_stock_chart\"}",
            "tool_name": "show_stock_chart",
            "tool_args": "{\"symbol\": \"AAPL\"}",
            "created_at": "2026-04-26T03:15:02Z"
        },
        {
            "id": "msg_003",
            "role": "assistant",
            "content": "Apple Inc. (AAPL) is currently trading at around $185...",
            "tool_name": null,
            "tool_args": null,
            "created_at": "2026-04-26T03:15:03Z"
        }
    ]
}
```

Messages sorted by `created_at` ascending.

**Error** `404` if chat not found.

---

### 6. Delete Chat

```
DELETE /api/chats/{chat_id}
```

**Response** `200 OK`

```json
{
    "deleted": true,
    "chat_id": "a1b2c3d4e5"
}
```

**Error** `404` if chat not found.

---

## Data Models

### Message Roles

| Role | Description |
|---|---|
| `user` | Message from the user |
| `assistant` | Text response from the AI |
| `tool` | Tool result — JSON in `content` field |

### Tool Message Content Structure

When `role === "tool"`, parse `content` as JSON:

```json
{
    "widget": "AdvancedChart",
    "props": {
        "symbol": "AAPL",
        "comparisonSymbols": [
            {"symbol": "MSFT", "position": "SameScale"}
        ]
    },
    "tool_name": "show_stock_chart",
    "tool_args": {"symbol": "AAPL"}
}
```

Use `widget` to select the TradingView component and `props` to configure it.

---

## Widget Types Reference

The AI can call 9 tools. Each returns a widget descriptor for the frontend to render.

| Tool Name | Widget Type | Props | TradingView Widget |
|---|---|---|---|
| `show_stock_chart` | `AdvancedChart` | `symbol`, `comparisonSymbols[]?` | Advanced Chart |
| `show_stock_price` | `SymbolOverview` | `symbol` | Symbol Overview |
| `show_stock_financials` | `Financials` | `symbol` | Company Financials |
| `show_stock_news` | `Timeline` | `symbol` | Timeline/News |
| `show_stock_screener` | `ScreenerWidget` | _(none)_ | Stock Screener |
| `show_market_overview` | `MarketOverview` | _(none)_ | Market Overview |
| `show_market_heatmap` | `MarketHeatMap` | _(none)_ | Market Heat Map |
| `show_etf_heatmap` | `ETFHeatMap` | _(none)_ | ETF Heat Map |
| `show_trending_stocks` | `HotLists` | _(none)_ | Hot Lists |

### Frontend Widget Mapping

```typescript
// Map widget type to TradingView component
const WIDGET_MAP: Record<string, React.FC<any>> = {
    'AdvancedChart':   StockChart,
    'SymbolOverview':  StockPrice,
    'Financials':      StockFinancials,
    'Timeline':        StockNews,
    'ScreenerWidget':  StockScreener,
    'MarketOverview':  MarketOverview,
    'MarketHeatMap':   MarketHeatmap,
    'ETFHeatMap':      ETFHeatmap,
    'HotLists':        MarketTrending,
};

// Render from tool result
function renderWidget(toolResult: ToolResult) {
    const Component = WIDGET_MAP[toolResult.widget];
    if (!Component) return null;
    return <Component {...toolResult.props} />;
}
```

### Comparison Symbols (for AdvancedChart)

```json
{
    "widget": "AdvancedChart",
    "props": {
        "symbol": "AAPL",
        "comparisonSymbols": [
            {"symbol": "MSFT", "position": "SameScale"},
            {"symbol": "GOOGL", "position": "SameScale"}
        ]
    }
}
```

### Crypto Symbols

All cryptocurrency tickers have `USD` appended by the LLM:
- `BTC` → `BTCUSD`
- `ETH` → `ETHUSD`
- `DOGE` → `DOGEUSD`

---

## LangGraph Agent Flow

```
User Message
     │
     ▼
┌─────────────┐
│ call_model   │  → Groq LLM with 9 tools bound
└──────┬──────┘
       │
       ├── LLM returns tool call(s)
       │        │
       │        ▼
       │  ┌───────────────┐
       │  │ execute_tools  │  → Run tool functions, collect widget JSON
       │  └──────┬────────┘
       │         │
       │         ▼
       │  ┌──────────────────┐
       │  │ generate_caption  │  → 2nd LLM call for natural language caption
       │  └──────┬───────────┘
       │         │
       │         ▼
       │       END  → { tool_results: [...], final_response: "caption" }
       │
       └── LLM returns plain text (no tools)
                │
                ▼
              END  → { tool_results: [], final_response: "text response" }
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | — | Groq API key from [console.groq.com](https://console.groq.com) |
| `DATABASE_URL` | ❌ | `sqlite+aiosqlite:///./stockbot.db` | Database connection URL |
| `MODEL_NAME` | ❌ | `llama-3.3-70b-versatile` | LLM model name |
| `LOG_LEVEL` | ❌ | `INFO` | Log level (DEBUG/INFO/WARNING/ERROR) |
| `CORS_ORIGINS` | ❌ | `["*"]` | Allowed CORS origins |

---

## Running the Backend

```bash
# 1. Create venv and install
uv venv
.venv\Scripts\activate
uv sync

# 2. Configure
cp .env.example .env
# Edit .env → set GROQ_API_KEY

# 3. Run (auto-creates DB on first start)
uvicorn app.main:app --reload

# Server: http://localhost:8000
# Docs:   http://localhost:8000/docs
```

### CORS Configuration

For local frontend development, the backend allows all origins by default (`CORS_ORIGINS=["*"]`).

For production, set specific origins:
```
CORS_ORIGINS=["https://yourdomain.com"]
```

---

*Generated for frontend development reference — 2026-04-26*
