'use client'

import { IconGroq } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { spinner } from './spinner'
import { CodeBlock } from '../ui/codeblock'
import { MemoizedReactMarkdown } from '../markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

// ==========================================
// 1. User Message (Right-aligned, Warm Sand)
// ==========================================
export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex w-full justify-end py-1.5 animate-in slide-in-from-right-2 duration-300">
      <div 
        className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md text-[15px] leading-relaxed relative"
        style={{ 
          background: 'hsl(var(--secondary))', 
          color: 'hsl(var(--secondary-foreground))',
          boxShadow: '0px 0px 0px 1px hsl(var(--border))'
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ==========================================
// 2. Bot Message (Left-aligned, Ivory)
// ==========================================
export function BotMessage({
  content,
  className
}: {
  content: string
  className?: string
}) {
  return (
    <div className={cn('group relative flex w-full justify-start py-1.5 animate-in slide-in-from-left-2 duration-300', className)}>
      <div 
        className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md text-[15px] leading-relaxed shadow-sm relative overflow-hidden"
        style={{ 
          background: 'hsl(var(--card))', 
          color: 'hsl(var(--card-foreground))',
          boxShadow: '0px 0px 0px 1px hsl(var(--border))'
        }}
      >
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-headings:font-serif prose-headings:font-normal prose-a:text-primary max-w-none"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-3 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children && children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 animate-pulse cursor-default text-primary">▍</span>
                  )
                }
                children[0] = (children[0] as string).replace('`▍`', '▍')
              }
              const match = /language-(\w+)/.exec(className || '')
              if (inline) {
                return (
                  <code className={className} style={{ fontFamily: 'var(--font-mono)' }} {...props}>
                    {children}
                  </code>
                )
              }
              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {content}
        </MemoizedReactMarkdown>
      </div>
    </div>
  )
}

// ==========================================
// 3. Bot Card (Widget Container)
// ==========================================
export function BotCard({
  children,
  showAvatar = false
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="group relative flex w-full justify-start py-2.5 animate-in fill-mode-backwards fade-in slide-in-from-bottom-2 duration-300">
      <div 
        className="w-full rounded-2xl overflow-hidden bg-card"
        style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 4px 24px, 0px 0px 0px 1px hsl(var(--border))' }}
      >
        {children}
      </div>
    </div>
  )
}


// ==========================================
// 4. System Message
// ==========================================
export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground font-sans">
      <div className="max-w-[600px] flex-initial p-2">{children}</div>
    </div>
  )
}

// ==========================================
// 5. Spinner Message
// ==========================================
export function SpinnerMessage() {
  return (
    <div className="group relative flex w-full justify-start py-1.5 animate-in slide-in-from-left-2 duration-300">
      <div 
        className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-3 shadow-sm relative overflow-hidden"
        style={{ 
          background: 'hsl(var(--card))', 
          boxShadow: '0px 0px 0px 1px hsl(var(--border))'
        }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-2 h-2 rounded-full"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `}} />
      </div>
    </div>
  )
}
