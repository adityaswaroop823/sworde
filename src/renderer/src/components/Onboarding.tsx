import { useEffect, useState } from 'react'
import { Loader2, ExternalLink, KeyRound, Terminal, RefreshCw, Check, ArrowRight } from 'lucide-react'
import BrandMark from './BrandMark'

type Step = 'probing' | 'login_required' | 'api_key_form' | 'success'

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('probing')
  const [apiKey, setApiKey] = useState('')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    probe()
  }, [])

  async function probe() {
    setStep('probing')
    setError(null)
    const result = await window.sworde.auth.probe()
    if (result.ok) {
      setStep('success')
      setTimeout(onComplete, 600)
    } else {
      setStep('login_required')
    }
  }

  async function handleApiKeySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim()) return
    setValidating(true)
    setError(null)
    await window.sworde.config.set('apiKey', apiKey.trim())
    const result = await window.sworde.auth.probe()
    setValidating(false)
    if (result.ok) {
      setStep('success')
      setTimeout(onComplete, 600)
    } else {
      await window.sworde.config.clearApiKey()
      setError('That key did not work. Double-check and try again.')
    }
  }

  return (
    <div className="h-full w-full bg-obsidian-400 flex flex-col surface-grid">
      <div className="titlebar-drag h-9 shrink-0" />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <BrandMark size={56} glow />
            <h1 className="display text-3xl text-bone-50 mt-6 mb-2">Sworde</h1>
            <p className="text-bone-400 text-[13px] tracking-wide uppercase">
              Forged for Claude · Local · Open
            </p>
          </div>

          {step === 'probing' && (
            <div className="rounded-plate bg-obsidian-200 border border-edge px-5 py-6 text-center shadow-plate">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-ember-400" />
              <div className="text-[14px] text-bone-100">Looking for your Claude session…</div>
              <div className="text-[12px] text-bone-400 mt-1">
                Probing <code className="font-mono text-ember-300">~/.claude</code>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="rounded-plate bg-obsidian-200 border border-ember-500/30 px-5 py-6 text-center shadow-ember">
              <div className="w-10 h-10 rounded-edge bg-ember-500 text-obsidian-500 flex items-center justify-center mx-auto mb-3">
                <Check className="w-5 h-5" strokeWidth={3} />
              </div>
              <div className="text-[14px] font-semibold text-bone-50">Connected</div>
              <div className="text-[12px] text-bone-400 mt-0.5">Opening workspace…</div>
            </div>
          )}

          {step === 'login_required' && (
            <div className="space-y-2">
              <button
                onClick={() => window.sworde.shell.runClaudeLogin()}
                className="w-full text-left rounded-plate bg-obsidian-200 border border-edge hover:border-ember-500/50 hover:bg-obsidian-100 px-4 py-3.5 transition group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-edge bg-obsidian-300 border border-edge text-ember-400 flex items-center justify-center shrink-0">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-bone-50 mb-0.5 flex items-center gap-1.5">
                      Sign in with Claude
                      <ArrowRight className="w-3.5 h-3.5 text-bone-400 group-hover:text-ember-400 transition group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-[12px] text-bone-400 leading-relaxed">
                      Use your Pro / Max subscription. Run{' '}
                      <code className="font-mono text-ember-300">claude login</code> in
                      Terminal, then come back.
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep('api_key_form')}
                className="w-full text-left rounded-plate bg-obsidian-200 border border-edge hover:border-ember-500/50 hover:bg-obsidian-100 px-4 py-3.5 transition group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-edge bg-obsidian-300 border border-edge text-bone-200 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-bone-50 mb-0.5 flex items-center gap-1.5">
                      Use an API key instead
                      <ArrowRight className="w-3.5 h-3.5 text-bone-400 group-hover:text-ember-400 transition group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-[12px] text-bone-400 leading-relaxed">
                      Pay-per-use via your Anthropic key.
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={probe}
                className="w-full mt-3 flex items-center justify-center gap-2 text-[12.5px] text-bone-400 hover:text-bone-100 transition py-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recheck — I just signed in
              </button>
            </div>
          )}

          {step === 'api_key_form' && (
            <form onSubmit={handleApiKeySubmit} className="space-y-3">
              <div>
                <label className="text-[11.5px] uppercase tracking-wider font-medium text-bone-400 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Anthropic API key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-…"
                  autoFocus
                  spellCheck={false}
                  className="w-full px-3.5 py-2.5 rounded-edge bg-obsidian-300 border border-edge focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-500/15 text-bone-100 placeholder:text-bone-400 text-[13.5px] font-mono shadow-plate transition"
                />
              </div>

              {error && (
                <div className="text-[12.5px] text-rust bg-rust/10 border border-rust/30 rounded-edge px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={validating || !apiKey.trim()}
                className="w-full bg-ember-500 hover:bg-ember-400 disabled:bg-obsidian-100 disabled:text-bone-400 text-obsidian-500 rounded-edge py-2.5 font-semibold text-[13.5px] transition flex items-center justify-center gap-2 shadow-plate"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Validating…
                  </>
                ) : (
                  'Continue'
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep('login_required')}
                  className="text-[12px] text-bone-400 hover:text-bone-100 transition"
                >
                  ← Back
                </button>
                <a
                  href="#"
                  className="flex items-center gap-1 text-[12px] text-bone-400 hover:text-ember-400 transition"
                  onClick={(e) => {
                    e.preventDefault()
                    window.sworde.shell.openExternal(
                      'https://console.anthropic.com/settings/keys'
                    )
                  }}
                >
                  Get a key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </form>
          )}

          <div className="mt-12 text-center text-[11px] text-bone-500 leading-relaxed tracking-wide">
            CREDENTIALS NEVER LEAVE YOUR MACHINE EXCEPT
            <br />
            FOR DIRECT REQUESTS TO ANTHROPIC.
          </div>
        </div>
      </div>
    </div>
  )
}
