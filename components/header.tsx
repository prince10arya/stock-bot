'use client'

import * as React from 'react'
import { IconGitHub, IconSeparator } from '@/components/ui/icons'
import { ThemeToggle } from '@/components/theme-toggle'

function UserOrLogin() {
  return (
    <div className="flex items-center gap-1">
      <IconSeparator className="size-5 text-muted-foreground/40" />
      {/* Wordmark — Lora serif per DESIGN.md */}
      <a
        href="/new"
        className="font-medium text-[17px] leading-none"
        style={{ fontFamily: "'Lora', Georgia, serif" }}
      >
        StockBot
      </a>
      <IconSeparator className="size-5 text-muted-foreground/40" />
      {/* Primary CTA — Terracotta Brand #c96442 */}
      <a
        href="/new"
        className="inline-flex items-center text-sm font-medium transition-opacity hover:opacity-90"
        style={{
          background: '#c96442',
          color: '#faf9f5',
          borderRadius: '8px',
          padding: '6px 12px'
        }}
      >
        New Chat
      </a>
    </div>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-14 px-4 shrink-0 bg-background border-b border-border">
      {/* Left */}
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <a
          target="_blank"
          href="https://github.com/prince10arya/stock-bot"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 border border-border text-foreground hover:bg-muted transition-colors"
        >
          <IconGitHub />
          <span className="hidden ml-1 md:inline">GitHub</span>
        </a>
      </div>
    </header>
  )
}
