import { Plus, MessageSquare, Settings, Sparkles, Wrench, Trash2 } from 'lucide-react'
import { cn } from '../lib/cn'
import type { Conversation } from '../types'
import BrandMark from './BrandMark'

type Props = {
  conversations: Conversation[]
  activeId: string | null
  skillCount: number
  mcpCount: number
  onNewChat: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onOpenSettings: () => void
}

export default function Sidebar({
  conversations,
  activeId,
  skillCount,
  mcpCount,
  onNewChat,
  onSelect,
  onDelete,
  onOpenSettings
}: Props) {
  return (
    <aside className="w-[248px] shrink-0 h-full bg-obsidian-300 border-r border-edge-soft flex flex-col">
      <div className="titlebar-drag h-9 shrink-0" />

      <div className="px-3 pt-1 pb-3 titlebar-nodrag">
        <div className="flex items-center gap-2.5 px-1.5 mb-3">
          <BrandMark size={26} />
          <div className="flex flex-col leading-none">
            <span className="display text-[14px] text-bone-50">Sworde</span>
            <span className="text-[9.5px] uppercase tracking-[0.18em] text-bone-500 mt-0.5">
              Forge build
            </span>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-edge bg-obsidian-100 hover:bg-obsidian-50 border border-edge transition text-[12.5px] font-medium text-bone-100 shadow-plate"
        >
          <Plus className="w-3.5 h-3.5 text-ember-400" />
          New chat
          <span className="ml-auto text-[10px] font-mono text-bone-500">⌘N</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 titlebar-nodrag">
        {conversations.length === 0 ? (
          <div className="px-2.5 py-4 text-[11.5px] text-bone-500 leading-relaxed">
            Conversations will appear here.
          </div>
        ) : (
          <>
            <div className="px-2.5 pt-1 pb-1.5 text-[10px] uppercase tracking-[0.18em] text-bone-500 font-medium">
              Recent
            </div>
            <ul className="space-y-px">
              {conversations.map((c) => (
                <li key={c.id} className="group/row relative">
                  <button
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-edge transition text-[12.5px] truncate text-left pr-8',
                      activeId === c.id
                        ? 'bg-obsidian-100 text-bone-50 border border-edge-strong'
                        : 'text-bone-300 hover:bg-obsidian-200 hover:text-bone-100 border border-transparent'
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        'w-3.5 h-3.5 shrink-0',
                        activeId === c.id ? 'text-ember-400' : 'text-bone-500'
                      )}
                    />
                    <span className="truncate">{c.title || 'Untitled'}</span>
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-sharp text-bone-500 hover:text-rust hover:bg-obsidian-300 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="border-t border-edge-soft p-2 space-y-px titlebar-nodrag">
        <FooterItem
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Skills"
          count={skillCount}
          onClick={onOpenSettings}
        />
        <FooterItem
          icon={<Wrench className="w-3.5 h-3.5" />}
          label="MCP"
          count={mcpCount}
          onClick={onOpenSettings}
        />
        <FooterItem
          icon={<Settings className="w-3.5 h-3.5" />}
          label="Settings"
          onClick={onOpenSettings}
        />
      </div>
    </aside>
  )
}

function FooterItem({
  icon,
  label,
  count,
  onClick
}: {
  icon: React.ReactNode
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-edge text-[12.5px] text-bone-300 hover:bg-obsidian-200 hover:text-bone-100 transition"
    >
      <span className="text-bone-500">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-ember-300 bg-obsidian-300 border border-edge px-1.5 py-0.5 rounded-sharp">
          {count}
        </span>
      )}
    </button>
  )
}
