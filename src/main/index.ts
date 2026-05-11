import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { promises as fs } from 'fs'
import { execFile } from 'child_process'
import Store from 'electron-store'

// When Electron is launched from Finder/Spotlight/Dock on macOS, it inherits a
// minimal PATH and cannot find user-installed binaries like `claude`. Prepend
// the common user-bin locations synchronously (no shell spawn — must be fast
// so the window appears instantly).
function fixPath(): void {
  if (process.platform === 'win32') return
  const extras = [
    join(homedir(), '.local/bin'),
    join(homedir(), '.bun/bin'),
    join(homedir(), '.npm-global/bin'),
    join(homedir(), 'bin'),
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    '/usr/local/bin'
  ]
  process.env.PATH = [...extras, process.env.PATH || ''].filter(Boolean).join(':')
}

fixPath()

type StoreSchema = {
  apiKey?: string
  workingDir?: string
  model?: string
  systemMode?: 'chat' | 'agent'
  permissionMode?: 'acceptEdits' | 'bypassPermissions' | 'default'
}

const store = new Store<StoreSchema>({
  name: 'sworde-config',
  defaults: {
    model: 'claude-haiku-4-5',
    workingDir: homedir(),
    systemMode: 'agent',
    permissionMode: 'acceptEdits'
  }
})

const SWORDE_DIR = join(homedir(), '.sworde')
const CONVERSATIONS_FILE = join(SWORDE_DIR, 'conversations.json')

async function ensureDirs() {
  await fs.mkdir(SWORDE_DIR, { recursive: true })
}

async function readConversations(): Promise<unknown[]> {
  try {
    const text = await fs.readFile(CONVERSATIONS_FILE, 'utf-8')
    return JSON.parse(text)
  } catch {
    return []
  }
}

async function writeConversations(list: unknown[]) {
  await ensureDirs()
  await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(list, null, 2), 'utf-8')
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 880,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0D0F15',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  await ensureDirs()
  createWindow()
  // Prewarm the Agent SDK in background so the first message doesn't pay subprocess startup cost
  prewarmSdk().catch(() => undefined)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

async function prewarmSdk(): Promise<void> {
  try {
    const sdk = await getSdk()
    // Load the SDK module + initialize internals; query() actual call lazy
    void sdk.query
  } catch {
    // ignore
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Agent SDK loader (ESM-only, dynamic import) ──────────────────────────
type AgentSdk = typeof import('@anthropic-ai/claude-agent-sdk')
let cachedSdk: AgentSdk | null = null
async function getSdk(): Promise<AgentSdk> {
  if (cachedSdk) return cachedSdk
  cachedSdk = await import('@anthropic-ai/claude-agent-sdk')
  return cachedSdk
}

// ─── Config IPC ────────────────────────────────────────────────────────────
ipcMain.handle('config:get', (_e, key: keyof StoreSchema) => store.get(key))
ipcMain.handle('config:set', (_e, key: keyof StoreSchema, value: unknown) => {
  store.set(key, value as never)
})
ipcMain.handle('config:hasApiKey', () => Boolean(store.get('apiKey')))
ipcMain.handle('config:clearApiKey', () => store.delete('apiKey'))
ipcMain.handle('config:all', () => ({
  workingDir: store.get('workingDir'),
  model: store.get('model'),
  systemMode: store.get('systemMode'),
  permissionMode: store.get('permissionMode'),
  hasApiKey: Boolean(store.get('apiKey'))
}))

// ─── Conversations IPC ────────────────────────────────────────────────────
ipcMain.handle('conversations:load', () => readConversations())
ipcMain.handle('conversations:save', (_e, list: unknown[]) => writeConversations(list))

// ─── Auth probe ────────────────────────────────────────────────────────────
const AUTH_LOG = join(SWORDE_DIR, 'auth-debug.log')
async function logAuth(line: string) {
  try {
    await ensureDirs()
    await fs.appendFile(AUTH_LOG, `[${new Date().toISOString()}] ${line}\n`, 'utf-8')
  } catch {
    // ignore
  }
}

ipcMain.handle('auth:probe', async () => {
  const apiKey = store.get('apiKey')
  if (apiKey) process.env.ANTHROPIC_API_KEY = apiKey

  await logAuth(`probe start — PATH=${process.env.PATH?.slice(0, 200)}... HOME=${process.env.HOME} hasApiKey=${Boolean(apiKey)}`)

  try {
    const { query } = await getSdk()
    const q = query({
      prompt: 'ping',
      options: {
        cwd: store.get('workingDir') || homedir(),
        maxTurns: 1,
        permissionMode: 'bypassPermissions',
        allowedTools: [],
        systemPrompt: 'Reply with the single word OK.'
      }
    })

    for await (const msg of q) {
      await logAuth(`msg type=${msg.type} subtype=${(msg as { subtype?: string }).subtype ?? ''} error=${(msg as { error?: string }).error ?? ''}`)
      if (msg.type === 'assistant') {
        if (msg.error === 'authentication_failed' || msg.error === 'oauth_org_not_allowed') {
          return { ok: false, reason: 'unauthenticated' as const }
        }
        return { ok: true as const, source: (apiKey ? 'apiKey' : 'claudeLogin') as 'apiKey' | 'claudeLogin' }
      }
      if (msg.type === 'result') {
        if (msg.subtype === 'success') {
          return { ok: true as const, source: (apiKey ? 'apiKey' : 'claudeLogin') as 'apiKey' | 'claudeLogin' }
        }
        return { ok: false, reason: 'unauthenticated' as const }
      }
    }
    await logAuth('probe done — no terminal message received')
    return { ok: false, reason: 'no_response' as const }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ''
    await logAuth(`probe threw: ${message}\n${stack}`)
    if (/auth|unauthor|401|403|login/i.test(message)) {
      return { ok: false, reason: 'unauthenticated' as const, message }
    }
    return { ok: false, reason: 'error' as const, message }
  }
})

// ─── Agent: streaming chat (with tools) ───────────────────────────────────
const activeQueries = new Map<string, { close?: () => void; aborted: boolean }>()

ipcMain.handle(
  'agent:sendMessage',
  async (
    event,
    payload: {
      streamId: string
      prompt: string
      cwd?: string
      model?: string
      mode?: 'chat' | 'agent'
      resumeSessionId?: string
    }
  ) => {
    const apiKey = store.get('apiKey')
    if (apiKey) process.env.ANTHROPIC_API_KEY = apiKey

    const session = { aborted: false } as { close?: () => void; aborted: boolean }
    activeQueries.set(payload.streamId, session)
    const mode = payload.mode || store.get('systemMode') || 'agent'

    try {
      const { query } = await getSdk()

      const baseOptions: Record<string, unknown> = {
        cwd: payload.cwd || store.get('workingDir') || homedir(),
        model: payload.model || store.get('model'),
        includePartialMessages: true
      }

      if (payload.resumeSessionId) {
        baseOptions.resume = payload.resumeSessionId
      }

      if (mode === 'agent') {
        // Full Claude Code mode: all tools, skills, MCP auto-loaded via preset
        baseOptions.systemPrompt = { type: 'preset', preset: 'claude_code' }
        baseOptions.permissionMode = store.get('permissionMode') || 'acceptEdits'
      } else {
        // Pure chat mode: no tools, custom prompt
        baseOptions.systemPrompt =
          'You are Sworde, a helpful AI assistant. Reply directly to the user in plain text. You do not have any tools available.'
        baseOptions.allowedTools = []
        baseOptions.permissionMode = 'bypassPermissions'
        baseOptions.maxTurns = 1
      }

      const q = query({ prompt: payload.prompt, options: baseOptions as never })
      session.close = () => q.close?.()

      for await (const msg of q) {
        if (session.aborted) break

        if (msg.type === 'stream_event') {
          const ev = (
            msg as unknown as {
              event?: { type?: string; delta?: { type?: string; text?: string } }
            }
          ).event
          if (ev?.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            event.sender.send('agent:delta', {
              streamId: payload.streamId,
              text: ev.delta.text || ''
            })
          }
          continue
        }

        if (msg.type === 'assistant') {
          if (msg.error) {
            event.sender.send('agent:error', {
              streamId: payload.streamId,
              error: msg.error
            })
            break
          }
          const blocks = (msg.message?.content ?? []) as Array<{
            type: string
            text?: string
            id?: string
            name?: string
            input?: unknown
          }>
          event.sender.send('agent:assistant', {
            streamId: payload.streamId,
            blocks
          })
          continue
        }

        if (msg.type === 'user') {
          // Tool results come back as user messages with tool_result blocks
          const content = (msg as unknown as { message?: { content?: unknown } }).message?.content
          if (Array.isArray(content)) {
            const toolResults = content.filter(
              (b: unknown) => (b as { type?: string }).type === 'tool_result'
            )
            if (toolResults.length > 0) {
              event.sender.send('agent:toolResult', {
                streamId: payload.streamId,
                results: toolResults
              })
            }
          }
          continue
        }

        if (msg.type === 'result') {
          event.sender.send('agent:end', {
            streamId: payload.streamId,
            result: {
              subtype: msg.subtype,
              durationMs: msg.duration_ms,
              numTurns: msg.num_turns,
              totalCostUsd: msg.total_cost_usd,
              isError: msg.is_error,
              sessionId: msg.session_id
            }
          })
          break
        }
      }

      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[sworde] sendMessage error:', message)
      event.sender.send('agent:error', { streamId: payload.streamId, error: message })
      return { ok: false, error: message }
    } finally {
      activeQueries.delete(payload.streamId)
    }
  }
)

ipcMain.handle('agent:abort', (_e, streamId: string) => {
  const s = activeQueries.get(streamId)
  if (!s) return false
  s.aborted = true
  s.close?.()
  return true
})

// ─── Working directory picker ─────────────────────────────────────────────
ipcMain.handle('dialog:pickDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: store.get('workingDir') || homedir()
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const picked = result.filePaths[0]
  store.set('workingDir', picked)
  return picked
})

// ─── Skills/MCP discovery ─────────────────────────────────────────────────
ipcMain.handle('discovery:skills', async () => {
  const all: Array<{ name: string; path: string; source: string }> = []
  const seen = new Set<string>()

  // Direct skills folders
  const direct = [join(homedir(), '.claude', 'skills'), join(homedir(), '.sworde', 'skills')]
  for (const dir of direct) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && !seen.has(entry.name)) {
          seen.add(entry.name)
          all.push({
            name: entry.name,
            path: join(dir, entry.name),
            source: dir.includes('.sworde') ? 'sworde' : 'claude'
          })
        }
      }
    } catch {
      // skip
    }
  }

  // Plugin skills: ~/.claude/plugins/*/skills/*
  const pluginsDir = join(homedir(), '.claude', 'plugins')
  try {
    const plugins = await fs.readdir(pluginsDir, { withFileTypes: true })
    for (const plugin of plugins) {
      if (!plugin.isDirectory()) continue
      const skillsDir = join(pluginsDir, plugin.name, 'skills')
      try {
        const skills = await fs.readdir(skillsDir, { withFileTypes: true })
        for (const skill of skills) {
          if (skill.isDirectory()) {
            const key = `${plugin.name}:${skill.name}`
            if (seen.has(key)) continue
            seen.add(key)
            all.push({
              name: key,
              path: join(skillsDir, skill.name),
              source: `plugin:${plugin.name}`
            })
          }
        }
      } catch {
        // no skills folder in this plugin
      }
    }
  } catch {
    // no plugins folder
  }

  // Commands count toward "skills" loosely
  try {
    const cmdsDir = join(homedir(), '.claude', 'commands')
    const cmds = await fs.readdir(cmdsDir, { withFileTypes: true })
    for (const c of cmds) {
      if (c.isFile() && c.name.endsWith('.md')) {
        const name = c.name.replace(/\.md$/, '')
        if (seen.has(`cmd:${name}`)) continue
        seen.add(`cmd:${name}`)
        all.push({
          name,
          path: join(cmdsDir, c.name),
          source: 'command'
        })
      }
    }
  } catch {
    // no commands
  }

  return all
})

ipcMain.handle('discovery:mcp', async () => {
  const candidates = [
    join(homedir(), '.claude', 'config.json'),
    join(homedir(), '.claude', 'mcp.json'),
    join(homedir(), '.sworde', 'mcp.json')
  ]
  for (const path of candidates) {
    try {
      const text = await fs.readFile(path, 'utf-8')
      const json = JSON.parse(text)
      if (json.mcpServers) {
        return Object.entries(json.mcpServers).map(([name, cfg]) => ({ name, config: cfg, source: path }))
      }
    } catch {
      // skip
    }
  }
  return []
})

// ─── Shell helpers ────────────────────────────────────────────────────────
ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url))
ipcMain.handle('shell:openTerminalAtHome', () => {
  if (process.platform === 'darwin') {
    return shell.openPath('/System/Applications/Utilities/Terminal.app')
  }
  return null
})

// Open Terminal, bring it to front, and run `claude login` in a fresh window.
ipcMain.handle('shell:runClaudeLogin', async () => {
  if (process.platform !== 'darwin') {
    return shell.openPath('/System/Applications/Utilities/Terminal.app')
  }
  const script = `
    tell application "Terminal"
      activate
      do script "clear; echo '── Sworde: signing you into Claude ──'; claude login; echo; echo 'Done. Switch back to Sworde and click \\"Recheck — I just signed in\\".'"
    end tell
  `
  return new Promise<void>((resolve, reject) => {
    execFile('/usr/bin/osascript', ['-e', script], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
})

// ─── AI news ticker (HackerNews source) ───────────────────────────────────
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

let newsCache: { fetchedAt: number; items: NewsItem[] } = { fetchedAt: 0, items: [] }
const NEWS_TTL_MS = 10 * 60 * 1000

async function fetchAiNews(): Promise<NewsItem[]> {
  // HN Algolia: stories from last 48h with AI-ish keywords, sorted by score
  const keywords = [
    'AI',
    'LLM',
    'GPT',
    'Claude',
    'Anthropic',
    'OpenAI',
    'Gemini',
    'agent',
    'AGI',
    'transformer'
  ]
  const since = Math.floor(Date.now() / 1000) - 48 * 3600
  const queries = keywords.map((q) =>
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&numericFilters=created_at_i>${since},points>30&hitsPerPage=15`
  )

  const results = await Promise.allSettled(
    queries.map((u) =>
      fetch(u, { signal: AbortSignal.timeout(8000) }).then((r) => r.json() as Promise<{
        hits: Array<{
          objectID: string
          title: string
          url?: string
          author?: string
          story_text?: string
          points: number
          num_comments: number
          created_at_i: number
        }>
      }>)
    )
  )

  const seen = new Set<string>()
  const items: NewsItem[] = []
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const h of r.value.hits || []) {
      if (!h.title || seen.has(h.objectID)) continue
      seen.add(h.objectID)
      const url = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`
      let domain = 'news.ycombinator.com'
      try {
        domain = new URL(url).hostname.replace(/^www\./, '')
      } catch {
        // keep default
      }
      const rawExcerpt = (h.story_text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      items.push({
        title: h.title,
        url,
        source: 'HN',
        domain,
        author: h.author || '',
        points: h.points || 0,
        comments: h.num_comments || 0,
        ageHours: Math.max(0, Math.round((Date.now() / 1000 - h.created_at_i) / 3600)),
        excerpt: rawExcerpt.slice(0, 180)
      })
    }
  }
  items.sort((a, b) => b.points - a.points)
  return items.slice(0, 25)
}

ipcMain.handle('news:latest', async () => {
  const now = Date.now()
  if (newsCache.items.length > 0 && now - newsCache.fetchedAt < NEWS_TTL_MS) {
    return newsCache.items
  }
  try {
    const items = await fetchAiNews()
    if (items.length > 0) {
      newsCache = { fetchedAt: now, items }
    }
    return newsCache.items
  } catch {
    return newsCache.items
  }
})
