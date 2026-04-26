'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useEffect, useState, useCallback, useRef } from 'react'
import type { UIMessage, ToolResult, Session } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import { TickerTape } from '@/components/tradingview/ticker-tape'
import { MissingApiKeyBanner } from '@/components/missing-api-key-banner'
import { sendMessageStream } from '@/lib/chat/actions'
import { nanoid } from '@/lib/utils'

export interface ChatProps extends React.ComponentProps<'div'> {
  id?: string
  initialMessages?: UIMessage[]
  session?: Session
  missingKeys: string[]
}

export function Chat({ id, initialMessages, className, session, missingKeys }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages || [])
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<string | undefined>(id)

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } = useScrollAnchor()

  // Navigate to /chat/<id> after first message
  useEffect(() => {
    if (chatId && messages?.length >= 2 && !path.includes('chat')) {
      window.history.replaceState({}, '', `/chat/${chatId}`)
    }
  }, [chatId, messages?.length, path])

  // Show missing key toasts
  useEffect(() => {
    missingKeys.forEach(key => toast.error(`Missing ${key} environment variable!`))
  }, [missingKeys])

  const handleSubmit = useCallback(async (value: string) => {
    if (!value.trim() || isLoading) return

    const userMsgId = nanoid()
    const botMsgId = nanoid()

    // Optimistically add user message
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: value },
      { id: botMsgId, role: 'assistant', content: '', isLoading: true },
    ])
    setIsLoading(true)
    scrollToBottom()

    let accToolResults: ToolResult[] = []
    let accCaption = ''
    let newChatId = chatId

    try {
      await sendMessageStream(value, chatId, {
        onToolResult: (tr) => {
          accToolResults = [...accToolResults, tr]
          // Update bot message as tools arrive
          setMessages(prev =>
            prev.map(m =>
              m.id === botMsgId
                ? { ...m, role: 'tool' as const, tool_results: accToolResults, isLoading: true }
                : m
            )
          )
          scrollToBottom()
        },
        onCaption: (text) => {
          accCaption = text
          setMessages(prev =>
            prev.map(m =>
              m.id === botMsgId
                ? {
                    ...m,
                    role: accToolResults.length ? 'tool' as const : 'assistant' as const,
                    content: text,
                    tool_results: accToolResults,
                    isLoading: true,
                  }
                : m
            )
          )
        },
        onDone: (returnedChatId) => {
          newChatId = returnedChatId
          setChatId(returnedChatId)
          setMessages(prev =>
            prev.map(m =>
              m.id === botMsgId
                ? {
                    ...m,
                    role: accToolResults.length ? 'tool' as const : 'assistant' as const,
                    content: accCaption,
                    tool_results: accToolResults,
                    isLoading: false,
                  }
                : m
            )
          )
          setIsLoading(false)
          scrollToBottom()
        },
        onError: (err) => {
          toast.error(`StockBot error: ${err}`)
          setMessages(prev => prev.filter(m => m.id !== botMsgId))
          setIsLoading(false)
        },
      })
    } catch (err: any) {
      toast.error(`Failed to connect to StockBot backend.`)
      setMessages(prev => prev.filter(m => m.id !== botMsgId))
      setIsLoading(false)
    }
  }, [chatId, isLoading, scrollToBottom])

  return (
    <div
      className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      {messages?.length ? (
        <MissingApiKeyBanner missingKeys={missingKeys} />
      ) : (
        <TickerTape />
      )}

      <div
        className={cn(
          messages?.length ? 'pb-[200px] pt-4 md:pt-6' : 'pb-[200px] pt-0',
          className
        )}
        ref={messagesRef}
      >
        {messages?.length ? (
          <ChatList messages={messages} isShared={false} session={session} />
        ) : (
          <EmptyScreen />
        )}
        <div className="w-full h-px" ref={visibilityRef} />
      </div>

      <ChatPanel
        messages={messages}
        isLoading={isLoading}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
