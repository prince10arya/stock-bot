import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-5 p-8 bg-card rounded-2xl relative" style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 4px 24px, 0px 0px 0px 1px hsl(var(--border))' }}>
        {/* Serif headline */}
        <h1 className="text-[2rem] font-serif leading-tight text-foreground">
          Welcome to StockBot
        </h1>

        {/* Terracotta divider */}
        <div className="w-12 h-[3px] rounded-full bg-primary" />

        {/* Body */}
        <p className="text-[16px] text-muted-foreground font-sans leading-relaxed max-w-lg">
          Your thoughtful AI-powered market companion. I can render live{' '}
          <ExternalLink href="https://tradingview.com" className="text-primary hover:underline">TradingView</ExternalLink>{' '}
          stock widgets — charts, prices, financials, news, screeners, and market
          heatmaps — all powered cleanly by{' '}
          <ExternalLink href="https://groq.com" className="text-primary hover:underline">Groq</ExternalLink>.
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2.5 mt-2">
          {['Stock Charts', 'Live Prices', 'Financials', 'Market Heatmap', 'News', 'Screener'].map(tag => (
            <span
              key={tag}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-border/60"
              style={{ letterSpacing: '0.2px' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

