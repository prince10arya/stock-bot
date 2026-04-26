'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { useActions, useUIState } from 'ai/rsc'
import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'

// Plus icon
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// Send arrow icon
function SendIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}


export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [apiKey, setApiKey] = useLocalStorage('groqKey', '')

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  const hasInput = input.trim().length > 0

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()
        if (window.innerWidth < 600) e.target['message']?.blur()
        const value = input.trim()
        setInput('')
        if (!value) return
        setMessages(currentMessages => [
          ...currentMessages,
          { id: nanoid(), display: <UserMessage>{value}</UserMessage> }
        ])
        const responseMessage = await submitUserMessage(value, apiKey)
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }}
    >
      {/* Unified rounded container — adapts to dark/light via bg-secondary */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(var(--secondary))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {/* Textarea row */}
        <div className="px-4 pt-4 pb-2">
          <Textarea
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            placeholder="How can I help you today?"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed focus:outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            name="message"
            rows={1}
            maxRows={6}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left — + button */}
          <button
            type="button"
            onClick={() => router.push('/new')}
            className="flex items-center justify-center size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/40 transition-colors"
            title="New Chat"
          >
            <PlusIcon />
          </button>

          {/* Right — send button when typing */}
          <div className="flex items-center">
            {hasInput && (
              <button
                type="submit"
                className="flex items-center justify-center size-8 rounded-full text-white transition-opacity hover:opacity-90"
                style={{ background: '#c96442' }}
                title="Send"
              >
                <SendIcon active />
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
