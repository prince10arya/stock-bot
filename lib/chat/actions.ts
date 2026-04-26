// ============================================================
// StockBot API client — calls Python FastAPI backend
// ============================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

import type { Chat, ChatListItem, SendMessageResponse, ToolResult } from '@/lib/types'

/** POST /api/chat — blocking, returns full response */
export async function sendMessage(
  content: string,
  chatId?: string
): Promise<SendMessageResponse> {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, chat_id: chatId ?? undefined }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to send message')
  }
  return res.json()
}

/**
 * POST /api/chat/stream — SSE streaming.
 * Calls onToolResult for each widget, onCaption for text, onDone when complete.
 */
export async function sendMessageStream(
  content: string,
  chatId: string | undefined,
  callbacks: {
    onToolResult: (tr: ToolResult) => void
    onCaption: (text: string) => void
    onDone: (chatId: string) => void
    onError: (err: string) => void
  }
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, chat_id: chatId ?? undefined }),
  })

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    callbacks.onError(err.detail ?? 'Stream failed')
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE format: "event: <type>\ndata: <payload>\n\n"
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? '' // keep incomplete chunk

    for (const chunk of chunks) {
      const lines = chunk.split('\n')
      let eventType = ''
      let dataLine = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim()
        if (line.startsWith('data: ')) dataLine = line.slice(6).trim()
      }
      if (!eventType || !dataLine) continue

      switch (eventType) {
        case 'tool_result':
          try { callbacks.onToolResult(JSON.parse(dataLine)) } catch {}
          break
        case 'caption':
          callbacks.onCaption(dataLine)
          break
        case 'done':
          try { callbacks.onDone(JSON.parse(dataLine).chat_id) } catch {}
          break
        case 'error':
          try { callbacks.onError(JSON.parse(dataLine).error) } catch {}
          break
      }
    }
  }
}

/** GET /api/chats */
export async function listChats(): Promise<ChatListItem[]> {
  const res = await fetch(`${BACKEND_URL}/api/chats`)
  if (!res.ok) throw new Error('Failed to list chats')
  return res.json()
}

/** GET /api/chats/:id */
export async function getChat(id: string): Promise<Chat> {
  const res = await fetch(`${BACKEND_URL}/api/chats/${id}`)
  if (!res.ok) throw new Error('Chat not found')
  return res.json()
}

/** DELETE /api/chats/:id */
export async function deleteChat(id: string): Promise<void> {
  await fetch(`${BACKEND_URL}/api/chats/${id}`, { method: 'DELETE' })
}

/** GET /health */
export async function checkHealth(): Promise<{ status: string; model: string }> {
  const res = await fetch(`${BACKEND_URL}/health`)
  if (!res.ok) throw new Error('Backend unhealthy')
  return res.json()
}
