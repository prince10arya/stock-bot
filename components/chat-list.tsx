'use client'

import { cn } from '@/lib/utils'
import type { UIMessage, Session } from '@/lib/types'
import { ChatMessage } from '@/components/chat-message'
import { Separator } from '@/components/ui/separator'

interface ChatListProps {
  messages: UIMessage[]
  session?: Session
  isShared?: boolean
}

export function ChatList({ messages, session, isShared }: ChatListProps) {
  if (!messages || !messages.length) return null

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => (
        <div key={message.id}>
          <ChatMessage message={message} />
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}
