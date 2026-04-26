'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { useRouter } from 'next/navigation'

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

interface PromptFormProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (value: string) => void
  isLoading: boolean
}

export function PromptForm({ input, setInput, onSubmit, isLoading }: PromptFormProps) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  const hasInput = input.trim().length > 0

  return (
    <form
      ref={formRef}
      onSubmit={(e: any) => {
        e.preventDefault()
        if (window.innerWidth < 600) e.target['message']?.blur()
        const value = input.trim()
        setInput('')
        if (!value || isLoading) return
        onSubmit(value)
      }}
    >
      <div
        className="w-full rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: 'hsl(var(--card))',
          boxShadow: 'rgba(0, 0, 0, 0.05) 0px 4px 24px, 0px 0px 0px 1px hsl(var(--border))',
          opacity: isLoading ? 0.8 : 1,
        }}
      >
        <div className="px-5 pt-4 pb-2">
          <Textarea
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            placeholder={isLoading ? 'StockBot is thinking...' : 'Ask about any stock, market trend, or financial data...'}
            className="w-full resize-none bg-transparent text-[16px] leading-relaxed focus:outline-none text-foreground placeholder:text-muted-foreground font-sans min-h-[24px] max-h-[160px]"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            name="message"
            rows={1}
            maxRows={6}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between px-3 pb-3">
          <button
            type="button"
            onClick={() => router.push('/new')}
            className="flex items-center justify-center size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="New Chat"
            disabled={isLoading}
          >
            <PlusIcon />
          </button>

          <div className="flex items-center">
            {hasInput && !isLoading ? (
              <button
                type="submit"
                className="flex items-center justify-center size-9 rounded-xl text-white transition-opacity hover:opacity-90 active:scale-95 animate-in zoom-in-95 duration-200"
                style={{ background: 'hsl(var(--primary))' }}
                title="Send"
              >
                <SendIcon active />
              </button>
            ) : isLoading ? (
              <div className="size-9 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="size-9" />
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
