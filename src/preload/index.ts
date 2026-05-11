import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

type AuthProbeResult =
  | { ok: true; source: 'apiKey' | 'claudeLogin' }
  | { ok: false; reason: 'unauthenticated' | 'no_response' | 'error'; message?: string }

export type AssistantBlock = {
  type: string
  text?: string
  id?: string
  name?: string
  input?: unknown
}

export type ToolResultBlock = {
  type: 'tool_result'
  tool_use_id: string
  content: unknown
  is_error?: boolean
}

export type AgentResult = {
  subtype: string
  durationMs: number
  numTurns: number
  totalCostUsd: number
  isError: boolean
  sessionId?: string
}

export type ConfigSnapshot = {
  workingDir?: string
  model?: string
  systemMode?: 'chat' | 'agent'
  permissionMode?: 'acceptEdits' | 'bypassPermissions' | 'default'
  hasApiKey: boolean
}

export type SkillEntry = { name: string; path: string; source: string }
export type McpEntry = { name: string; config: unknown; source: string }

function listen<T>(channel: string, cb: (data: T) => void): () => void {
  const handler = (_e: IpcRendererEvent, data: T) => cb(data)
  ipcRenderer.on(channel, handler)
  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

const api = {
  config: {
    get: <T = unknown>(key: string) => ipcRenderer.invoke('config:get', key) as Promise<T>,
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    hasApiKey: () => ipcRenderer.invoke('config:hasApiKey') as Promise<boolean>,
    clearApiKey: () => ipcRenderer.invoke('config:clearApiKey'),
    all: () => ipcRenderer.invoke('config:all') as Promise<ConfigSnapshot>
  },
  conversations: {
    load: () => ipcRenderer.invoke('conversations:load') as Promise<unknown[]>,
    save: (list: unknown[]) => ipcRenderer.invoke('conversations:save', list)
  },
  auth: {
    probe: () => ipcRenderer.invoke('auth:probe') as Promise<AuthProbeResult>
  },
  agent: {
    sendMessage: (payload: {
      streamId: string
      prompt: string
      cwd?: string
      model?: string
      mode?: 'chat' | 'agent'
      resumeSessionId?: string
    }) => ipcRenderer.invoke('agent:sendMessage', payload),
    abort: (streamId: string) => ipcRenderer.invoke('agent:abort', streamId) as Promise<boolean>,

    onDelta: (cb: (data: { streamId: string; text: string }) => void) =>
      listen('agent:delta', cb),
    onAssistant: (cb: (data: { streamId: string; blocks: AssistantBlock[] }) => void) =>
      listen('agent:assistant', cb),
    onToolResult: (cb: (data: { streamId: string; results: ToolResultBlock[] }) => void) =>
      listen('agent:toolResult', cb),
    onEnd: (cb: (data: { streamId: string; result: AgentResult }) => void) =>
      listen('agent:end', cb),
    onError: (cb: (data: { streamId: string; error: string }) => void) =>
      listen('agent:error', cb)
  },
  discovery: {
    skills: () => ipcRenderer.invoke('discovery:skills') as Promise<SkillEntry[]>,
    mcp: () => ipcRenderer.invoke('discovery:mcp') as Promise<McpEntry[]>
  },
  dialog: {
    pickDirectory: () => ipcRenderer.invoke('dialog:pickDirectory') as Promise<string | null>
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    openTerminalAtHome: () => ipcRenderer.invoke('shell:openTerminalAtHome'),
    runClaudeLogin: () => ipcRenderer.invoke('shell:runClaudeLogin')
  }
}

contextBridge.exposeInMainWorld('sworde', api)

export type SwordeAPI = typeof api
