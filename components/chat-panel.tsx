import * as React from 'react'
import { useState, useEffect } from 'react'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { FooterText } from '@/components/footer'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import type { AI } from '@/lib/chat/actions'
import { nanoid } from 'nanoid'
import { UserMessage } from './stocks/message'

export interface ChatPanelProps {
  id?: string
  title?: string
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
}

export function ChatPanel({
  id,
  title,
  input,
  setInput,
  isAtBottom,
  scrollToBottom
}: ChatPanelProps) {
  const [aiState] = useAIState()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  const exampleMessages = [
    {
      heading: 'What is the price',
      subheading: 'of Apple Inc.?',
      message: 'What is the price of Apple stock?'
    },
    {
      heading: 'Show me a stock chart',
      subheading: 'for $GOOGL',
      message: 'Show me a stock chart for $GOOGL'
    },
    {
      heading: 'What are some recent',
      subheading: `events about Amazon?`,
      message: `What are some recent events about Amazon?`
    },
    {
      heading: `What are Microsoft's`,
      subheading: 'latest financials?',
      message: `What are Microsoft's latest financials?`
    },
    {
      heading: 'How is the stock market',
      subheading: 'performing today by sector?',
      message: `How is the stock market performing today by sector?`
    },
    {
      heading: 'Show me a screener',
      subheading: 'to find new stocks',
      message: 'Show me a screener to find new stocks'
    }
  ]

  interface ExampleMessage {
    heading: string
    subheading: string
    message: string
  }

  const [randExamples, setRandExamples] = useState<ExampleMessage[]>([])

  useEffect(() => {
    const shuffledExamples = [...exampleMessages].sort(
      () => 0.5 - Math.random()
    )
    setRandExamples(shuffledExamples)
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-background/0 to-background duration-300 ease-in-out animate-in">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        {/* Example prompt chips */}
        <div className="mb-3 grid grid-cols-2 gap-2 px-4 sm:px-0">
          {messages.length === 0 &&
            randExamples.map((example, index) => (
              <div
                key={example.heading}
                className={`cursor-pointer p-3 rounded-lg border border-border bg-card transition-shadow hover:shadow-[0px_0px_0px_1px_hsl(var(--border))] ${
                  index >= 4 ? 'hidden md:block' : ''
                } ${index >= 2 ? 'hidden 2xl:block' : ''}`}
                onClick={async () => {
                  setMessages(currentMessages => [
                    ...currentMessages,
                    {
                      id: nanoid(),
                      display: <UserMessage>{example.message}</UserMessage>
                    }
                  ])
                  const responseMessage = await submitUserMessage(example.message)
                  setMessages(currentMessages => [
                    ...currentMessages,
                    responseMessage
                  ])
                }}
              >
                <div className="text-sm font-medium text-foreground">
                  {example.heading}
                </div>
                <div className="text-sm text-muted-foreground">
                  {example.subheading}
                </div>
              </div>
            ))}
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 sm:px-0">
          <PromptForm input={input} setInput={setInput} />
          <FooterText className="hidden sm:block mt-2" />
        </div>
      </div>
    </div>
  )
}
