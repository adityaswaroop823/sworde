import { useEffect, useState } from 'react'

const VERBS = [
  'Pondering',
  'Cogitating',
  'Mulling',
  'Reflecting',
  'Contemplating',
  'Considering',
  'Brewing',
  'Forging',
  'Tempering',
  'Hammering',
  'Synthesizing',
  'Weaving',
  'Untangling',
  'Sketching',
  'Plotting',
  'Reasoning',
  'Investigating',
  'Tinkering',
  'Wrangling',
  'Composing',
  'Distilling',
  'Polishing',
  'Sleuthing',
  'Probing',
  'Smelting',
  'Sharpening'
]

type Props = {
  active: boolean
  activity?: string | null
  startedAt?: number | null
}

export default function StatusIndicator({ active, activity, startedAt }: Props) {
  const [verb, setVerb] = useState(() => randomVerb())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!active) return
    setVerb(randomVerb())
    const id = setInterval(() => {
      setVerb((prev) => {
        let next = prev
        while (next === prev) next = randomVerb()
        return next
      })
    }, 2500)
    return () => clearInterval(id)
  }, [active])

  useEffect(() => {
    if (!active || !startedAt) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [active, startedAt])

  if (!active) return null

  const seconds = startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0
  const display = activity || verb

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-edge bg-obsidian-200 border border-edge text-[11.5px] text-bone-200 w-fit shadow-plate">
      <Forge />
      <span className="font-semibold text-bone-50 uppercase tracking-[0.14em] text-[10.5px]">
        {display}
      </span>
      <span className="text-bone-500">·</span>
      <span className="font-mono tabular-nums text-ember-400 text-[10.5px]">{seconds}s</span>
      <span className="hidden">{tick}</span>
    </div>
  )
}

function Forge() {
  // Animated trio of "sparks" — three dots pulsing in sequence
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="w-1 h-1 rounded-full bg-ember-400 animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 rounded-full bg-ember-400 animate-pulse" style={{ animationDelay: '180ms' }} />
      <span className="w-1 h-1 rounded-full bg-ember-400 animate-pulse" style={{ animationDelay: '360ms' }} />
    </span>
  )
}

function randomVerb() {
  return VERBS[Math.floor(Math.random() * VERBS.length)]
}
