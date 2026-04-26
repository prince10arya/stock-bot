// ============================================================
// StockBot Types — aligned with Python FastAPI backend schema
// ============================================================

/** Tool result descriptor — maps to a TradingView widget */
export interface ToolResult {
  widget: string
  props: Record<string, unknown>
  tool_name: string
  tool_args: Record<string, unknown>
}

/** A single message in a chat */
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  tool_name?: string | null
  tool_args?: string | null
  created_at: string
}

/** Full chat with messages */
export interface Chat {
  id: string
  title?: string | null
  created_at: string
  updated_at: string
  messages: Message[]
}

/** Chat list item (no messages) */
export interface ChatListItem {
  id: string
  title?: string | null
  created_at: string
  updated_at: string
  message_count: number
}

/** POST /api/chat request body */
export interface SendMessageRequest {
  content: string
  chat_id?: string
}

/** POST /api/chat response */
export interface SendMessageResponse {
  chat_id: string
  response: string
  tool_results: ToolResult[]
}

/**
 * A UI message — what the frontend renders in the chat list.
 * `tool_results` is populated for tool-type messages.
 */
export interface UIMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  tool_results?: ToolResult[]
  isLoading?: boolean
}

export interface Session {
  user: {
    id: string
    email: string
  }
}
