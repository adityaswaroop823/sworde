import { useEffect, useState } from 'react'
import Onboarding from './components/Onboarding'
import ChatShell from './components/ChatShell'

export default function App() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    window.sworde.auth.probe().then((r) => {
      setAuthed(r.ok)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-obsidian-400">
        <div className="text-bone-400 text-[11px] uppercase tracking-[0.22em] font-semibold">
          Loading
        </div>
      </div>
    )
  }

  if (!authed) {
    return <Onboarding onComplete={() => setAuthed(true)} />
  }

  return <ChatShell />
}
