import { useEffect, useRef } from 'react'
import { Sparkles, Wrench, Hash } from 'lucide-react'
import { cn } from '../lib/cn'

export type SlashItem = {
  name: string
  source: string
  path?: string
}

type Props = {
  items: SlashItem[]
  selectedIndex: number
  onSelect: (item: SlashItem) => void
  onHover: (index: number) => void
}

export default function SlashPalette({ items, selectedIndex, onSelect, onHover }: Props) {
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-idx="${selectedIndex}"]`
    ) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (items.length === 0) {
    return (
      <div className="rounded-plate border border-edge bg-obsidian-200 shadow-deep overflow-hidden">
        <div className="px-4 py-3 text-[12px] text-bone-500 font-mono">no matches</div>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="rounded-plate border border-edge bg-obsidian-200 shadow-deep overflow-hidden max-h-80 overflow-y-auto"
    >
      <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-bone-500 font-semibold border-b border-edge-soft mb-1">
        Skills · {items.length} match{items.length === 1 ? '' : 'es'}
      </div>
      {items.map((item, i) => {
        const Icon = iconFor(item.source)
        const sourceLabel = labelFor(item.source)
        const active = i === selectedIndex
        return (
          <button
            key={`${item.source}:${item.name}`}
            data-idx={i}
            onMouseEnter={() => onHover(i)}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(item)
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition border-l-2',
              active
                ? 'bg-obsidian-100 border-ember-500'
                : 'border-transparent hover:bg-obsidian-300'
            )}
          >
            <Icon
              className={cn(
                'w-3.5 h-3.5 shrink-0',
                active ? 'text-ember-400' : 'text-bone-500'
              )}
            />
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'text-[12.5px] font-mono truncate',
                  active ? 'text-bone-50 font-semibold' : 'text-bone-200'
                )}
              >
                /{item.name}
              </div>
            </div>
            <div className="text-[9.5px] uppercase tracking-[0.16em] text-bone-500 shrink-0">
              {sourceLabel}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function iconFor(source: string) {
  if (source === 'command') return Hash
  if (source.startsWith('plugin:')) return Sparkles
  return Wrench
}

function labelFor(source: string) {
  if (source === 'command') return 'cmd'
  if (source === 'sworde') return 'sworde'
  if (source === 'claude') return 'skill'
  if (source.startsWith('plugin:')) return source.replace('plugin:', '')
  return source
}

export function filterItems(items: SlashItem[], query: string): SlashItem[] {
  if (!query) return items.slice(0, 50)
  const q = query.toLowerCase()
  const ranked = items
    .map((item) => {
      const name = item.name.toLowerCase()
      let score = -1
      if (name === q) score = 1000
      else if (name.startsWith(q)) score = 900 - name.length
      else if (name.includes(q)) score = 700 - name.length
      else {
        let i = 0
        for (const ch of name) {
          if (ch === q[i]) i++
          if (i === q.length) break
        }
        if (i === q.length) score = 400 - name.length
      }
      return { item, score }
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
  return ranked.map((r) => r.item)
}
