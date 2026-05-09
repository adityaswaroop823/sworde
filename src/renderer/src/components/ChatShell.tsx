import { useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import ChatView from './ChatView'
import SettingsModal from './SettingsModal'
import type { Conversation } from '../types'

export default function ChatShell() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mode, setMode] = useState<'chat' | 'agent'>('agent')
  const [skillCount, setSkillCount] = useState(0)
  const [mcpCount, setMcpCount] = useState(0)
  const loadedRef = useRef(false)

  // Load on mount
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    ;(async () => {
      const [list, cfg, skills, mcps] = await Promise.all([
        window.sworde.conversations.load(),
        window.sworde.config.all(),
        window.sworde.discovery.skills(),
        window.sworde.discovery.mcp()
      ])
      const convs = (list as Conversation[]).filter((c) => c && c.id)
      // Sort by updatedAt desc
      convs.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      setConversations(convs)
      if (cfg.systemMode) setMode(cfg.systemMode)
      setSkillCount(skills.length)
      setMcpCount(mcps.length)
    })()
  }, [])

  // Persist on every conversation change (debounced naturally — small lists)
  useEffect(() => {
    if (!loadedRef.current) return
    window.sworde.conversations.save(conversations as never)
  }, [conversations])

  // Re-poll mode/skills when settings closes
  useEffect(() => {
    if (settingsOpen) return
    ;(async () => {
      const [cfg, skills, mcps] = await Promise.all([
        window.sworde.config.all(),
        window.sworde.discovery.skills(),
        window.sworde.discovery.mcp()
      ])
      if (cfg.systemMode) setMode(cfg.systemMode)
      setSkillCount(skills.length)
      setMcpCount(mcps.length)
    })()
  }, [settingsOpen])

  function handleNewChat() {
    setActiveId(null)
  }

  function handleSelect(id: string) {
    setActiveId(id)
  }

  function handleDelete(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) setActiveId(null)
  }

  function upsertConversation(conv: Conversation) {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conv.id)
      if (idx === -1) return [conv, ...prev]
      const copy = [...prev]
      copy[idx] = conv
      // Move to top
      copy.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      return copy
    })
    setActiveId(conv.id)
  }

  const active = conversations.find((c) => c.id === activeId) ?? null

  return (
    <div className="h-full w-full flex bg-obsidian-400">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        skillCount={skillCount}
        mcpCount={mcpCount}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView active={active} mode={mode} onUpsert={upsertConversation} />
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
