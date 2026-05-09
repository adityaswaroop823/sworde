import { useEffect, useMemo, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'
import InputBox from './InputBox'
import StatusIndicator from './StatusIndicator'
import { cn } from '../lib/cn'
import type { Block, Conversation, Message, ToolUseBlock } from '../types'

type Props = {
  active: Conversation | null
  mode: 'chat' | 'agent'
  onUpsert: (conv: Conversation) => void
}

type StreamState = {
  streamId: string
  liveText: string
  blocks: Block[]
  toolIndex: Map<string, number> // tool_use id → index in blocks
}

export default function ChatView({ active, mode, onUpsert }: Props) {
  const [streamState, setStreamState] = useState<StreamState | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [streamStartedAt, setStreamStartedAt] = useState<number | null>(null)

  const stateRef = useRef<StreamState | null>(null)
  const activeRef = useRef<Conversation | null>(active)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    stateRef.current = streamState
  }, [streamState])

  const messages = active?.messages ?? []
  const streaming = streamState !== null

  useEffect(() => {
    const offDelta = window.sworde.agent.onDelta(({ streamId, text }) => {
      const s = stateRef.current
      if (!s || s.streamId !== streamId) return
      setStreamState({ ...s, liveText: s.liveText + text })
    })

    const offAssistant = window.sworde.agent.onAssistant(({ streamId, blocks }) => {
      const s = stateRef.current
      if (!s || s.streamId !== streamId) return

      const next: StreamState = {
        ...s,
        liveText: '', // text now folded into blocks
        blocks: [...s.blocks],
        toolIndex: new Map(s.toolIndex)
      }

      for (const raw of blocks) {
        if (raw.type === 'text' && raw.text) {
          next.blocks.push({ type: 'text', text: raw.text })
        } else if (raw.type === 'tool_use' && raw.id && raw.name) {
          const tool: ToolUseBlock = {
            type: 'tool_use',
            id: raw.id,
            name: raw.name,
            input: raw.input
          }
          next.toolIndex.set(raw.id, next.blocks.length)
          next.blocks.push(tool)
        } else if (raw.type === 'thinking') {
          // skip in v1
        }
      }

      setStreamState(next)
    })

    const offToolResult = window.sworde.agent.onToolResult(({ streamId, results }) => {
      const s = stateRef.current
      if (!s || s.streamId !== streamId) return

      const next: StreamState = { ...s, blocks: [...s.blocks], toolIndex: new Map(s.toolIndex) }
      for (const r of results) {
        const idx = next.toolIndex.get(r.tool_use_id)
        if (idx !== undefined) {
          const target = next.blocks[idx]
          if (target.type === 'tool_use') {
            next.blocks[idx] = { ...target, result: r.content, isError: r.is_error }
          }
        }
      }
      setStreamState(next)
    })

    const offEnd = window.sworde.agent.onEnd(({ streamId, result }) => {
      const s = stateRef.current
      if (!s || s.streamId !== streamId) return
      finalize(s, (result as { sessionId?: string })?.sessionId)
    })

    const offErr = window.sworde.agent.onError(({ streamId, error }) => {
      const s = stateRef.current
      if (!s || s.streamId !== streamId) return
      setErrorBanner(prettyError(error))
      setStreamState(null)
      setStreamStartedAt(null)
    })

    return () => {
      offDelta()
      offAssistant()
      offToolResult()
      offEnd()
      offErr()
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, streamState?.liveText, streamState?.blocks.length])

  function finalize(s: StreamState, sessionId?: string) {
    setStreamState(null)
    setStreamStartedAt(null)
    const conv = activeRef.current
    const allBlocks: Block[] = [...s.blocks]
    if (s.liveText.trim()) allBlocks.push({ type: 'text', text: s.liveText })
    if (!conv || allBlocks.length === 0) return

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      blocks: allBlocks,
      createdAt: Date.now()
    }
    onUpsert({
      ...conv,
      sessionId: sessionId ?? conv.sessionId,
      messages: [...conv.messages, assistantMsg],
      updatedAt: Date.now()
    })
  }

  async function handleSend(text: string) {
    setErrorBanner(null)
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      blocks: [{ type: 'text', text }],
      createdAt: Date.now()
    }

    const now = Date.now()
    const conv: Conversation =
      active ??
      {
        id: crypto.randomUUID(),
        title: text.slice(0, 60),
        createdAt: now,
        updatedAt: now,
        messages: []
      }

    const updated: Conversation = {
      ...conv,
      messages: [...conv.messages, userMsg],
      updatedAt: now
    }
    onUpsert(updated)
    activeRef.current = updated

    const streamId = crypto.randomUUID()
    const fresh: StreamState = {
      streamId,
      liveText: '',
      blocks: [],
      toolIndex: new Map()
    }
    setStreamState(fresh)
    setStreamStartedAt(Date.now())
    stateRef.current = fresh

    await window.sworde.agent.sendMessage({
      streamId,
      prompt: text,
      mode,
      resumeSessionId: conv.sessionId
    })
  }

  function handleStop() {
    if (stateRef.current) {
      window.sworde.agent.abort(stateRef.current.streamId)
    }
    setStreamState(null)
    setStreamStartedAt(null)
  }

  // Derive a friendly activity string from current stream state
  const activity = useMemo(() => {
    if (!streamState) return null
    const last = streamState.blocks[streamState.blocks.length - 1]
    if (last?.type === 'tool_use') {
      if (last.result === undefined) {
        return verbForTool(last.name) + (last.name ? ` · ${last.name}` : '')
      }
    }
    if (streamState.liveText.length > 0) return null // text is visible, no extra status
    if (streamState.blocks.length === 0) return null // initial — let rotating verb take over
    return 'Continuing'
  }, [streamState])

  return (
    <div className="flex flex-col h-full bg-obsidian-400">
      <div className="titlebar-drag h-9 shrink-0 border-b border-edge-soft flex items-center justify-center bg-obsidian-300/40">
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-bone-400 truncate px-4 max-w-[80%]">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-sharp font-semibold',
              mode === 'agent'
                ? 'bg-ember-500/15 text-ember-300 border border-ember-500/30'
                : 'bg-obsidian-200 text-bone-300 border border-edge'
            )}
          >
            <span className={cn('w-1 h-1 rounded-full', mode === 'agent' ? 'bg-ember-400' : 'bg-bone-400')} />
            {mode}
          </span>
          <span className="text-bone-500">·</span>
          <span className="truncate font-medium text-bone-300 normal-case tracking-normal">
            {active?.title ?? 'New conversation'}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto surface-grid">
        {messages.length === 0 && !streaming ? (
          <EmptyState mode={mode} />
        ) : (
          <div className="max-w-[760px] mx-auto px-6 py-8 space-y-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} blocks={m.blocks} />
            ))}
            {streamState && (
              <>
                <MessageBubble
                  role="assistant"
                  blocks={streamState.blocks}
                  text={streamState.liveText}
                  streaming
                />
                <div className="pl-10">
                  <StatusIndicator
                    active
                    activity={activity}
                    startedAt={streamStartedAt}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {errorBanner && (
        <div className="max-w-[760px] mx-auto w-full px-6">
          <div className="text-[12.5px] text-rust bg-rust/10 border border-rust/30 rounded-edge px-3 py-2 mb-2 font-mono">
            {errorBanner}
          </div>
        </div>
      )}

      <div className="shrink-0">
        <InputBox onSend={handleSend} onStop={handleStop} streaming={streaming} />
      </div>
    </div>
  )
}

function EmptyState({ mode }: { mode: 'chat' | 'agent' }) {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-[10.5px] uppercase tracking-[0.22em] text-ember-400 font-semibold mb-3">
          {mode === 'agent' ? 'agent · armed' : 'chat · idle'}
        </div>
        <h2 className="display text-3xl text-bone-50 mb-3 tracking-tightest">
          {mode === 'agent' ? 'Whet the blade.' : 'Speak freely.'}
        </h2>
        <p className="text-bone-400 text-[13.5px] leading-relaxed max-w-sm mx-auto">
          {mode === 'agent' ? (
            <>
              Files, shell, MCP, every loaded skill — all in your hands. Set your working
              directory in Settings, type{' '}
              <kbd>/</kbd> to summon a skill, or just ask.
            </>
          ) : (
            <>Pure conversation. No tools, no side effects — just thinking out loud.</>
          )}
        </p>
      </div>
    </div>
  )
}

function verbForTool(name: string): string {
  switch (name) {
    case 'Read':
      return 'Reading'
    case 'Write':
      return 'Writing'
    case 'Edit':
      return 'Editing'
    case 'Bash':
      return 'Running'
    case 'Grep':
      return 'Searching'
    case 'Glob':
      return 'Globbing'
    case 'WebFetch':
      return 'Fetching'
    case 'WebSearch':
      return 'Searching the web'
    case 'TodoWrite':
      return 'Planning'
    case 'Agent':
    case 'Task':
      return 'Delegating'
    default:
      if (name.startsWith('mcp__')) return 'Calling MCP tool'
      return 'Running'
  }
}

function prettyError(raw: string): string {
  if (/authentication_failed|oauth/i.test(raw))
    return 'Your Claude session expired. Run `claude login` and try again.'
  if (/billing/i.test(raw)) return 'Anthropic flagged a billing issue on your account.'
  if (/rate_limit/i.test(raw)) return 'Rate limited by Anthropic. Wait a moment and retry.'
  return raw
}
