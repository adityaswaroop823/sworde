import { useState } from 'react'
import {
  FileText,
  FileEdit,
  FilePlus,
  Terminal,
  Search,
  Globe,
  Wrench,
  ChevronRight,
  AlertCircle,
  Check
} from 'lucide-react'
import { cn } from '../lib/cn'
import type { ToolUseBlock } from '../types'

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Read: FileText,
  Edit: FileEdit,
  Write: FilePlus,
  Bash: Terminal,
  Grep: Search,
  Glob: Search,
  WebFetch: Globe,
  WebSearch: Globe
}

function getIcon(name: string) {
  if (TOOL_ICONS[name]) return TOOL_ICONS[name]
  return Wrench
}

function summarizeInput(name: string, input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const i = input as Record<string, unknown>
  switch (name) {
    case 'Read':
      return String(i.file_path ?? '')
    case 'Edit':
    case 'Write':
      return String(i.file_path ?? '')
    case 'Bash':
      return String(i.command ?? '').slice(0, 200)
    case 'Grep':
      return `${i.pattern ?? ''}${i.path ? ` ${i.path}` : ''}`
    case 'Glob':
      return String(i.pattern ?? '')
    case 'WebFetch':
    case 'WebSearch':
      return String(i.url ?? i.query ?? '')
    default: {
      const keys = Object.keys(i).slice(0, 2)
      return keys.map((k) => `${k}: ${truncate(JSON.stringify(i[k]), 60)}`).join(', ')
    }
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function resultText(result: unknown): string {
  if (!result) return ''
  if (typeof result === 'string') return result
  if (Array.isArray(result)) {
    return result
      .map((r) => {
        if (typeof r === 'string') return r
        if (r && typeof r === 'object' && 'text' in r) return String((r as { text: string }).text)
        return JSON.stringify(r)
      })
      .join('\n')
  }
  if (typeof result === 'object' && 'text' in (result as object))
    return String((result as { text: string }).text)
  return JSON.stringify(result, null, 2)
}

export default function ToolBlock({ block }: { block: ToolUseBlock }) {
  const [open, setOpen] = useState(false)
  const Icon = getIcon(block.name)
  const summary = summarizeInput(block.name, block.input)
  const hasResult = block.result !== undefined
  const resStr = hasResult ? resultText(block.result) : ''

  return (
    <div
      className={cn(
        'rounded-edge border bg-obsidian-300/60 overflow-hidden font-mono',
        block.isError ? 'border-rust/40' : 'border-edge'
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-obsidian-200 transition"
      >
        <span className="text-ember-400 text-[10.5px] uppercase tracking-[0.18em] font-sans font-semibold">
          {hasResult ? (block.isError ? 'fail' : 'ok') : 'run'}
        </span>
        <span className="text-bone-500 select-none">·</span>
        <Icon
          className={cn(
            'w-3.5 h-3.5 shrink-0',
            block.isError ? 'text-rust' : hasResult ? 'text-bone-200' : 'text-ember-400'
          )}
        />
        <span className="text-[12px] font-semibold font-sans text-bone-50">{block.name}</span>
        {summary && (
          <span className="text-[12px] text-bone-300 truncate flex-1 min-w-0">{summary}</span>
        )}
        <span className="ml-auto flex items-center gap-1 shrink-0">
          {block.isError ? (
            <AlertCircle className="w-3 h-3 text-rust" />
          ) : hasResult ? (
            <Check className="w-3 h-3 text-sage" />
          ) : null}
          <ChevronRight
            className={cn(
              'w-3.5 h-3.5 text-bone-500 transition',
              open && 'rotate-90 text-bone-300'
            )}
          />
        </span>
      </button>
      {open && (
        <div className="border-t border-edge-soft px-3 py-2 space-y-2 bg-obsidian-400/60">
          {block.input != null && Object.keys(block.input as object).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-bone-500 mb-1 font-sans font-semibold">
                Input
              </div>
              <pre className="text-[11.5px] font-mono text-bone-200 bg-obsidian-500 border border-edge-soft rounded-sharp p-2 overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(block.input, null, 2)}
              </pre>
            </div>
          )}
          {hasResult && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-bone-500 mb-1 font-sans font-semibold">
                {block.isError ? 'Error' : 'Output'}
              </div>
              <pre
                className={cn(
                  'text-[11.5px] font-mono rounded-sharp p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-[420px] overflow-y-auto border',
                  block.isError
                    ? 'text-rust bg-rust/5 border-rust/30'
                    : 'text-bone-200 bg-obsidian-500 border-edge-soft'
                )}
              >
                {resStr || '(empty)'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
