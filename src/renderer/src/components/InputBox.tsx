import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, Square, Slash } from 'lucide-react'
import { cn } from '../lib/cn'
import SlashPalette, { filterItems, type SlashItem } from './SlashPalette'

type Props = {
  onSend: (text: string) => void
  onStop?: () => void
  streaming?: boolean
}

export default function InputBox({ onSend, onStop, streaming }: Props) {
  const [value, setValue] = useState('')
  const [skills, setSkills] = useState<SlashItem[]>([])
  const [selIdx, setSelIdx] = useState(0)
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    window.sworde.discovery.skills().then((list) => {
      const items: SlashItem[] = list.map((s) => ({
        name: s.name,
        source: s.source,
        path: s.path
      }))
      setSkills(items)
    })
  }, [])

  useEffect(() => {
    autoResize()
  }, [value])

  function autoResize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 240) + 'px'
  }

  const slashActive = useMemo(() => {
    if (!value.startsWith('/')) return false
    if (/\s/.test(value)) return false
    return true
  }, [value])

  const filteredItems = useMemo(() => {
    if (!slashActive) return []
    const query = value.slice(1)
    return filterItems(skills, query)
  }, [slashActive, value, skills])

  useEffect(() => {
    if (selIdx >= filteredItems.length) setSelIdx(0)
  }, [filteredItems.length, selIdx])

  function submit() {
    const text = value.trim()
    if (!text || streaming) return
    onSend(text)
    setValue('')
    setSelIdx(0)
  }

  function pickSlash(item: SlashItem) {
    setValue(`/${item.name} `)
    setSelIdx(0)
    requestAnimationFrame(() => ref.current?.focus())
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slashActive && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelIdx((i) => (i + 1) % filteredItems.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelIdx((i) => (i - 1 + filteredItems.length) % filteredItems.length)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        const item = filteredItems[selIdx]
        if (item) pickSlash(item)
        return
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        const item = filteredItems[selIdx]
        if (item && value.length > 1) {
          e.preventDefault()
          pickSlash(item)
          return
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setValue('')
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="px-6 pb-5 pt-2">
      <div className="max-w-[760px] mx-auto">
        {slashActive && (
          <div className="mb-2">
            <SlashPalette
              items={filteredItems}
              selectedIndex={selIdx}
              onSelect={pickSlash}
              onHover={setSelIdx}
            />
          </div>
        )}

        <div
          className={cn(
            'flex items-end gap-2 rounded-plate bg-obsidian-200 border border-edge px-3 py-2.5 shadow-plate transition',
            'focus-within:border-ember-500/50 focus-within:shadow-ember'
          )}
        >
          <Slash className="w-3.5 h-3.5 text-bone-500 mt-2 shrink-0 hidden md:block" />
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              streaming ? 'Sworde is responding…' : 'Speak the command — type / for skills'
            }
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none bg-transparent outline-none text-bone-50 placeholder:text-bone-500 text-[14px] leading-relaxed py-1 font-sans disabled:opacity-60"
          />
          {streaming ? (
            <button
              onClick={onStop}
              className="shrink-0 w-8 h-8 rounded-edge flex items-center justify-center transition bg-rust hover:bg-rust/80 text-obsidian-500"
              aria-label="Stop"
            >
              <Square className="w-3.5 h-3.5" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!value.trim()}
              className={cn(
                'shrink-0 w-8 h-8 rounded-edge flex items-center justify-center transition',
                value.trim()
                  ? 'bg-ember-500 text-obsidian-500 hover:bg-ember-400 shadow-plate'
                  : 'bg-obsidian-100 text-bone-500 cursor-not-allowed'
              )}
              aria-label="Send"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
        <div className="mt-2 text-center text-[10.5px] uppercase tracking-[0.16em] text-bone-500">
          <kbd>Enter</kbd> send · <kbd>Shift+Enter</kbd> newline · <kbd>/</kbd> skills
        </div>
      </div>
    </div>
  )
}
