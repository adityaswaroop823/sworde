import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '../lib/cn'
import type { Block, Role } from '../types'
import ToolBlock from './ToolBlock'
import BrandMark from './BrandMark'

type Props = {
  role: Role
  blocks?: Block[]
  text?: string
  streaming?: boolean
}

export default function MessageBubble({ role, blocks, text, streaming }: Props) {
  const isUser = role === 'user'

  if (isUser) {
    const userText = text ?? blocks?.find((b) => b.type === 'text')?.text ?? ''
    return (
      <div className="flex gap-3 justify-end">
        <div className="rounded-plate px-4 py-3 text-[14px] leading-relaxed bg-ember-500 text-obsidian-500 max-w-[72%] whitespace-pre-wrap font-medium shadow-plate">
          {userText}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="shrink-0 mt-1">
        <BrandMark size={28} />
      </div>
      <div className="flex-1 min-w-0 max-w-[88%] space-y-2">
        {/* Streaming preview when no blocks yet */}
        {streaming && (!blocks || blocks.length === 0) && (
          <div className="rounded-plate px-4 py-3 bg-obsidian-200 text-bone-100 border border-edge shadow-plate">
            <div className="prose-sworde">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text || ' '}</ReactMarkdown>
              <Cursor />
            </div>
          </div>
        )}

        {blocks?.map((b, i) => {
          if (b.type === 'text') {
            return (
              <div
                key={i}
                className="rounded-plate px-4 py-3 bg-obsidian-200 text-bone-100 border border-edge shadow-plate"
              >
                <div className="prose-sworde text-[14px] leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.text || ''}</ReactMarkdown>
                  {streaming && i === blocks.length - 1 && <Cursor />}
                </div>
              </div>
            )
          }
          if (b.type === 'tool_use') {
            return <ToolBlock key={i} block={b} />
          }
          return null
        })}

        {streaming && blocks && blocks.length > 0 && text && (
          <div className="rounded-plate px-4 py-3 bg-obsidian-200 text-bone-100 border border-edge shadow-plate">
            <div className="prose-sworde text-[14px] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              <Cursor />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Cursor() {
  return (
    <span
      className={cn(
        'inline-block w-1.5 h-4 ml-0.5 bg-ember-400 rounded-sharp align-middle animate-pulse'
      )}
    />
  )
}
