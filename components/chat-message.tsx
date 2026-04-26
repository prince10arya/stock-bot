'use client'

import React from 'react'
import type { UIMessage, ToolResult } from '@/lib/types'
import { UserMessage, BotMessage, BotCard, SpinnerMessage } from '@/components/stocks/message'
import { StockChart } from '@/components/tradingview/stock-chart'
import { StockPrice } from '@/components/tradingview/stock-price'
import { StockFinancials } from '@/components/tradingview/stock-financials'
import { StockNews } from '@/components/tradingview/stock-news'
import { StockScreener } from '@/components/tradingview/stock-screener'
import { MarketOverview } from '@/components/tradingview/market-overview'
import { MarketHeatmap } from '@/components/tradingview/market-heatmap'
import { MarketTrending } from '@/components/tradingview/market-trending'
import { ETFHeatmap } from '@/components/tradingview/etf-heatmap'

// ================================================================
// Widget map — matches CODEBASE-backend.md Widget Types Reference
// ================================================================
const WIDGET_MAP: Record<string, React.FC<any>> = {
  AdvancedChart:  StockChart,
  SymbolOverview: StockPrice,
  Financials:     StockFinancials,
  Timeline:       StockNews,
  ScreenerWidget: StockScreener,
  MarketOverview: MarketOverview,
  MarketHeatMap:  MarketHeatmap,
  ETFHeatMap:     ETFHeatmap,
  HotLists:       MarketTrending,
}

function renderWidget(tr: ToolResult) {
  const Component = WIDGET_MAP[tr.widget]
  if (!Component) return null
  // Stock-based widgets need a symbol prop; market-wide don't
  const props = tr.props as Record<string, any>
  return <Component {...props} />
}

// ================================================================
// ChatMessage — renders one UIMessage entry
// ================================================================
export function ChatMessage({ message }: { message: UIMessage }) {
  if (message.isLoading) return <SpinnerMessage />

  if (message.role === 'user') {
    return <UserMessage>{message.content}</UserMessage>
  }

  // Tool results message (widget + caption)
  if (message.role === 'tool' && message.tool_results?.length) {
    return (
      <div className="space-y-2">
        {message.tool_results.map((tr, i) => {
          const widget = renderWidget(tr)
          return widget ? (
            <BotCard key={i}>{widget}</BotCard>
          ) : null
        })}
        {message.content && (
          <BotMessage content={message.content} />
        )}
      </div>
    )
  }

  // Plain assistant text
  return <BotMessage content={message.content} />
}
