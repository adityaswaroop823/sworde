import { useEffect, useState } from 'react'
import { Flame, MessageSquare, ArrowUp, Clock } from 'lucide-react'

type NewsItem = {
  title: string
  url: string
  source: string
  domain: string
  author: string
  points: number
  comments: number
  ageHours: number
  excerpt: string
}

const REFRESH_MS = 10 * 60 * 1000

export default function NewsBanner() {
  const [items, setItems] = useState<NewsItem[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const list = await window.sworde.news.latest()
        if (!cancelled) setItems(list)
      } catch {
        // ignore — banner stays empty
      }
    }
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (items.length === 0) return null

  // Duplicate so the marquee loop is seamless (animation translates -50%)
  const loop = [...items, ...items]

  function formatAge(h: number) {
    if (h < 1) return 'just now'
    if (h < 24) return `${h}h ago`
    return `${Math.round(h / 24)}d ago`
  }

  return (
    <div className="shrink-0 border-b border-edge bg-obsidian-300/85 backdrop-blur supports-[backdrop-filter]:bg-obsidian-300/65">
      <div className="flex items-stretch overflow-hidden">
        <div className="shrink-0 flex items-center gap-1.5 px-3 text-[11px] uppercase tracking-wider font-semibold text-ember-400 border-r border-edge bg-obsidian-400/40">
          <Flame className="w-3.5 h-3.5" />
          <span>Trending AI</span>
        </div>
        <div className="flex-1 overflow-hidden py-2">
          <div className="ticker-track gap-3 pr-3">
            {loop.map((item, idx) => (
              <button
                key={`${item.url}-${idx}`}
                onClick={() => window.sworde.shell.openExternal(item.url)}
                className="group inline-flex flex-col items-start gap-1 text-left px-3.5 py-1.5 mx-1 rounded-edge bg-obsidian-200/60 hover:bg-obsidian-100 border border-edge hover:border-ember-500/40 transition shrink-0 w-[420px] max-w-[420px]"
                title={item.excerpt || item.title}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-bone-400 font-mono w-full">
                  <span className="text-ember-400 font-semibold">{item.source}</span>
                  <span className="text-bone-500">·</span>
                  <span className="truncate">{item.domain}</span>
                  {item.author && (
                    <>
                      <span className="text-bone-500">·</span>
                      <span className="truncate text-bone-400">@{item.author}</span>
                    </>
                  )}
                </div>
                <div className="text-[13px] leading-snug text-bone-100 group-hover:text-bone-50 transition line-clamp-1 w-full">
                  {item.title}
                </div>
                <div className="flex items-center gap-3 text-[10.5px] text-bone-500 font-mono w-full">
                  <span className="inline-flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /> {item.points}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {item.comments}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatAge(item.ageHours)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
