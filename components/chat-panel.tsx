import * as React from 'react'
import { useState, useEffect } from 'react'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { FooterText } from '@/components/footer'
import { UserMessage } from './stocks/message'
import type { UIMessage } from '@/lib/types'

export interface ChatPanelProps {
  messages: UIMessage[]
  isLoading: boolean
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
  onSubmit: (value: string) => void
}

const EXAMPLE_MESSAGES = [
  { heading: 'What is the price', subheading: 'of Apple Inc.?', message: 'What is the price of Apple stock?' },
  { heading: 'Show me a stock chart', subheading: 'for $GOOGL', message: 'Show me a stock chart for $GOOGL' },
  { heading: 'What are some recent', subheading: 'events about Amazon?', message: 'What are some recent events about Amazon?' },
  { heading: "What are Microsoft's", subheading: 'latest financials?', message: "What are Microsoft's latest financials?" },
  { heading: 'How is the stock market', subheading: 'performing today by sector?', message: 'How is the stock market performing today by sector?' },
  { heading: 'Show me a screener', subheading: 'to find new stocks', message: 'Show me a screener to find new stocks' },
]

export function ChatPanel({
  messages,
  isLoading,
  input,
  setInput,
  isAtBottom,
  scrollToBottom,
  onSubmit,
}: ChatPanelProps) {
  const [randExamples, setRandExamples] = useState(EXAMPLE_MESSAGES)

  useEffect(() => {
    setRandExamples([...EXAMPLE_MESSAGES].sort(() => 0.5 - Math.random()))
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-background/0 to-background duration-300 ease-in-out animate-in">
      <ButtonScrollToBottom isAtBottom={isAtBottom} scrollToBottom={scrollToBottom} />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        {/* Example prompt chips — only when no messages */}
        <div className="mb-4 grid grid-cols-2 gap-3 px-4 sm:px-0">
          {messages?.length === 0 &&
            randExamples.map((example, index) => (
              <div
                key={example.heading}
                className={`group cursor-pointer p-3.5 rounded-xl border border-border bg-card transition-all duration-200 hover:bg-secondary hover:shadow-[0px_0px_0px_1px_hsl(var(--border)),rgba(0,0,0,0.05)_0px_4px_24px] ${
                  index >= 4 ? 'hidden md:block' : ''
                } ${index >= 2 ? 'hidden 2xl:block' : ''}`}
                onClick={() => !isLoading && onSubmit(example.message)}
              >
                <div className="text-[14px] font-medium text-foreground font-sans transition-colors group-hover:text-primary">
                  {example.heading}
                </div>
                <div className="text-[13px] text-muted-foreground mt-0.5">
                  {example.subheading}
                </div>
              </div>
            ))}
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 sm:px-0">
          <PromptForm
            input={input}
            setInput={setInput}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
          <FooterText className="hidden sm:block mt-2" />
        </div>
      </div>
    </div>
  )
}
