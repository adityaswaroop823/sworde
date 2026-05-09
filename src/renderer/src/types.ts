export type Role = 'user' | 'assistant'

export type TextBlock = { type: 'text'; text: string }
export type ThinkingBlock = { type: 'thinking'; text: string }
export type ToolUseBlock = {
  type: 'tool_use'
  id: string
  name: string
  input: unknown
  result?: unknown
  isError?: boolean
}

export type Block = TextBlock | ThinkingBlock | ToolUseBlock

export type Message = {
  id: string
  role: Role
  blocks: Block[]
  createdAt: number
}

export type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  cwd?: string
  sessionId?: string
  messages: Message[]
}

export function plainText(blocks: Block[]): string {
  return blocks
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n\n')
}
