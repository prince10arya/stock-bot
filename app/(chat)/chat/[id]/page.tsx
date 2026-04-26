import { Chat } from '@/components/chat'
import { getMissingKeys } from '@/app/actions'
import { getChat } from '@/lib/chat/actions'
import { notFound } from 'next/navigation'
import type { UIMessage } from '@/lib/types'

export const metadata = {
  title: 'StockBot powered by Groq'
}

export default async function ChatPage({ params }: { params: { id: string } }) {
  const missingKeys = await getMissingKeys()
  let chat
  try {
    chat = await getChat(params.id)
  } catch (error) {
    notFound()
  }

  // Map backend Message[] to frontend UIMessage[]
  const uiMessages: UIMessage[] = []
  let currentToolMsg: UIMessage | null = null

  for (const m of chat?.messages || []) {
    if (m.role === 'user') {
      uiMessages.push({
        id: m.id,
        role: 'user',
        content: m.content
      })
    } else if (m.role === 'tool') {
      if (!currentToolMsg) {
        currentToolMsg = {
          id: m.id,
          role: 'tool',
          content: '',
          tool_results: []
        }
      }
      try {
        currentToolMsg.tool_results!.push(JSON.parse(m.content))
      } catch (e) {
        console.error('Failed to parse tool result', m.content)
      }
    } else if (m.role === 'assistant') {
      if (currentToolMsg) {
        currentToolMsg.content = m.content
        uiMessages.push(currentToolMsg)
        currentToolMsg = null
      } else {
        uiMessages.push({
          id: m.id,
          role: 'assistant',
          content: m.content
        })
      }
    }
  }
  
  if (currentToolMsg) {
    uiMessages.push(currentToolMsg)
  }

  return <Chat id={chat.id} initialMessages={uiMessages} missingKeys={missingKeys} />
}
