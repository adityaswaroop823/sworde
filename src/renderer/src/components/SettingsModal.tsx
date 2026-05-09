import { useEffect, useState } from 'react'
import { X, Folder, Cpu, Shield, MessageSquare, Wrench, Sparkles, ExternalLink, Trash2 } from 'lucide-react'
import { cn } from '../lib/cn'

type ConfigSnapshot = {
  workingDir?: string
  model?: string
  systemMode?: 'chat' | 'agent'
  permissionMode?: 'acceptEdits' | 'bypassPermissions' | 'default'
  hasApiKey: boolean
}
type SkillEntry = { name: string; path: string; source: string }
type McpEntry = { name: string; config: unknown; source: string }

const MODELS: Array<{ id: string; label: string; sub: string }> = [
  { id: 'claude-opus-4-7', label: 'Opus 4.7', sub: 'Most capable · slowest' },
  { id: 'claude-sonnet-4-5', label: 'Sonnet 4.5', sub: 'Balanced · default' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5', sub: 'Fastest · cheapest' }
]

const PERMISSION_MODES: Array<{
  id: 'acceptEdits' | 'bypassPermissions' | 'default'
  label: string
  sub: string
}> = [
  { id: 'acceptEdits', label: 'Auto-accept edits', sub: 'Tools run on their own.' },
  { id: 'bypassPermissions', label: 'Bypass everything', sub: 'No prompts at all — handle with care.' },
  { id: 'default', label: 'Ask for everything', sub: 'Verbose · prompts on every tool.' }
]

export default function SettingsModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) {
  const [config, setConfig] = useState<ConfigSnapshot | null>(null)
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [mcps, setMcps] = useState<McpEntry[]>([])

  useEffect(() => {
    if (!open) return
    refresh()
  }, [open])

  async function refresh() {
    const [c, s, m] = await Promise.all([
      window.sworde.config.all(),
      window.sworde.discovery.skills(),
      window.sworde.discovery.mcp()
    ])
    setConfig(c)
    setSkills(s)
    setMcps(m)
  }

  async function update<K extends keyof ConfigSnapshot>(key: K, value: ConfigSnapshot[K]) {
    await window.sworde.config.set(key as string, value)
    await refresh()
  }

  async function pickDir() {
    const dir = await window.sworde.dialog.pickDirectory()
    if (dir) refresh()
  }

  async function clearKey() {
    await window.sworde.config.clearApiKey()
    await refresh()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-obsidian-500/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[82vh] overflow-y-auto bg-obsidian-300 rounded-plate shadow-deep border border-edge-strong"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge-soft sticky top-0 bg-obsidian-300/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-ember-400 font-semibold">
              Configure
            </span>
            <span className="text-bone-500">·</span>
            <h2 className="display text-lg text-bone-50">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-edge hover:bg-obsidian-200 flex items-center justify-center text-bone-400 hover:text-bone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-7">
          <Section
            icon={<Folder className="w-3.5 h-3.5" />}
            title="Working directory"
            hint="Where Claude reads, writes, and runs commands."
          >
            <button
              onClick={pickDir}
              className="w-full text-left px-3 py-2.5 rounded-edge bg-obsidian-200 border border-edge hover:border-ember-500/40 transition text-[12.5px] font-mono text-ember-300 truncate"
            >
              {config?.workingDir || '~'}
            </button>
          </Section>

          <Section icon={<MessageSquare className="w-3.5 h-3.5" />} title="Mode">
            <div className="grid grid-cols-2 gap-2">
              <ModeCard
                active={config?.systemMode === 'agent'}
                title="Agent"
                desc="Full Claude Code: tools, files, bash, MCP, skills."
                onClick={() => update('systemMode', 'agent')}
              />
              <ModeCard
                active={config?.systemMode === 'chat'}
                title="Chat"
                desc="Pure conversation. No tools, no side effects."
                onClick={() => update('systemMode', 'chat')}
              />
            </div>
          </Section>

          <Section icon={<Cpu className="w-3.5 h-3.5" />} title="Model">
            <div className="space-y-1">
              {MODELS.map((m) => (
                <RadioRow
                  key={m.id}
                  active={config?.model === m.id}
                  label={m.label}
                  sub={m.sub}
                  onClick={() => update('model', m.id)}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={<Shield className="w-3.5 h-3.5" />}
            title="Permission mode"
            hint="Only matters in Agent mode."
          >
            <div className="space-y-1">
              {PERMISSION_MODES.map((p) => (
                <RadioRow
                  key={p.id}
                  active={config?.permissionMode === p.id}
                  label={p.label}
                  sub={p.sub}
                  onClick={() => update('permissionMode', p.id)}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={<Sparkles className="w-3.5 h-3.5" />}
            title={`Skills · ${skills.length}`}
            hint="From ~/.claude/skills, ~/.claude/plugins, ~/.claude/commands, ~/.sworde/skills."
          >
            {skills.length === 0 ? (
              <div className="text-[12.5px] text-bone-500 font-mono">none discovered</div>
            ) : (
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
                {skills.map((s) => (
                  <div
                    key={s.path}
                    className="px-2 py-1 rounded-sharp bg-obsidian-200 border border-edge-soft text-[11.5px] font-mono text-bone-200 truncate"
                    title={s.path}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            icon={<Wrench className="w-3.5 h-3.5" />}
            title={`MCP servers · ${mcps.length}`}
            hint="From ~/.claude/config.json and ~/.sworde/mcp.json."
          >
            {mcps.length === 0 ? (
              <div className="text-[12.5px] text-bone-500 font-mono">none configured</div>
            ) : (
              <div className="space-y-1">
                {mcps.map((m) => (
                  <div
                    key={m.name}
                    className="px-2.5 py-1.5 rounded-sharp bg-obsidian-200 border border-edge-soft text-[12px] flex items-center justify-between"
                  >
                    <span className="font-mono font-semibold text-bone-100">{m.name}</span>
                    <span className="text-[10px] text-bone-500 truncate max-w-[55%] font-mono">
                      {m.source.split('/').slice(-2).join('/')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section icon={<Shield className="w-3.5 h-3.5" />} title="Authentication">
            {config?.hasApiKey ? (
              <button
                onClick={clearKey}
                className="flex items-center gap-2 px-3 py-2 rounded-edge bg-rust/10 border border-rust/30 text-rust hover:bg-rust/20 transition text-[12.5px]"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove stored API key
              </button>
            ) : (
              <div className="text-[12.5px] text-bone-300 font-mono">
                using Claude subscription via{' '}
                <code className="text-ember-300 bg-obsidian-200 border border-edge-soft px-1.5 py-0.5 rounded-sharp">
                  claude login
                </code>
              </div>
            )}
          </Section>

          <div className="text-center pt-2 text-[10px] uppercase tracking-[0.22em]">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                window.sworde.shell.openExternal('https://github.com/adityaswaroop/sworde')
              }}
              className="inline-flex items-center gap-1 text-bone-500 hover:text-ember-400 transition"
            >
              Sworde on GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  hint,
  children
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-ember-400 font-semibold mb-2">
        {icon}
        {title}
      </div>
      {hint && <div className="text-[11.5px] text-bone-500 mb-2 leading-relaxed">{hint}</div>}
      {children}
    </div>
  )
}

function ModeCard({
  active,
  title,
  desc,
  onClick
}: {
  active: boolean
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left rounded-edge border px-3 py-3 transition',
        active
          ? 'border-ember-500/60 bg-ember-500/10 shadow-ember'
          : 'border-edge bg-obsidian-200 hover:bg-obsidian-100 hover:border-edge-strong'
      )}
    >
      <div
        className={cn(
          'text-[13px] font-semibold mb-0.5 display',
          active ? 'text-ember-300' : 'text-bone-50'
        )}
      >
        {title}
      </div>
      <div className="text-[11px] text-bone-400 leading-relaxed">{desc}</div>
    </button>
  )
}

function RadioRow({
  active,
  label,
  sub,
  onClick
}: {
  active: boolean
  label: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 rounded-edge flex items-start gap-2.5 transition border',
        active
          ? 'bg-ember-500/10 border-ember-500/30'
          : 'border-transparent hover:bg-obsidian-200'
      )}
    >
      <div
        className={cn(
          'mt-1 w-3.5 h-3.5 rounded-sharp border-2 shrink-0 transition',
          active ? 'border-ember-500 bg-ember-500' : 'border-edge-strong'
        )}
      />
      <div className="flex-1 min-w-0">
        <div className={cn('text-[12.5px]', active ? 'text-ember-300 font-semibold' : 'text-bone-100')}>
          {label}
        </div>
        <div className="text-[11px] text-bone-500 leading-relaxed">{sub}</div>
      </div>
    </button>
  )
}
