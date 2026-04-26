import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex flex-col gap-4 p-8 bg-card border border-border rounded-2xl shadow-whisper">
        {/* Serif headline */}
        <h1
          className="text-3xl font-medium leading-tight text-foreground"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          Welcome to StockBot
        </h1>

        {/* Terracotta divider — brand fixed, fine on both modes */}
        <div className="w-10 h-0.5 rounded-full" style={{ background: '#c96442' }} />

        {/* Body */}
        <p className="text-[16px] text-muted-foreground" style={{ lineHeight: '1.6' }}>
          AI-powered chatbot that uses function calling to render live{' '}
          <ExternalLink href="https://tradingview.com">TradingView</ExternalLink>{' '}
          stock widgets — charts, prices, financials, news, screeners, and market
          heatmaps — powered by{' '}
          <ExternalLink href="https://groq.com">Llama 3.3 on Groq</ExternalLink>.
        </p>

        {/* Badges — use secondary token which flips in dark */}
        <div className="flex flex-wrap gap-2 mt-2">
          {['Stock Charts', 'Live Prices', 'Financials', 'Market Heatmap', 'News', 'Screener'].map(tag => (
            <span
              key={tag}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"
              style={{ letterSpacing: '0.12px' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
