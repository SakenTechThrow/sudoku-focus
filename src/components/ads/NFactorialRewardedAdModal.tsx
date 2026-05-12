import { ExternalLink, PlayCircle, X } from 'lucide-react'
import {
  FREE_HINT_LIMIT,
  NFACTORIAL_AD_URL,
  NFACTORIAL_SITE_URL,
} from '../../constants/ads'

type NFactorialRewardedAdModalProps = {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function NFactorialRewardedAdModal({
  isOpen,
  onConfirm,
  onCancel,
}: NFactorialRewardedAdModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_24px_100px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-slate-950 dark:shadow-[0_24px_100px_rgba(2,8,24,0.62)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/90 px-6 py-5 dark:border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">
              Sponsored hint unlock
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
              Watch a short nFactorial message to unlock your next hint
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              You have used your {FREE_HINT_LIMIT} free hints. Watch this quick learning break to continue getting hints.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close sponsored hint unlock"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.3fr)_18rem]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.16)] dark:border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3 text-slate-100">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-medium">nFactorial learning break</span>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                  Video
                </span>
              </div>

              <div className="aspect-video bg-slate-950">
                <iframe
                  src={NFACTORIAL_AD_URL}
                  title="nFactorial sponsored message"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/6">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                Want to go deeper on logic, coding, and product building? Explore courses and incubator opportunities after your next move.
              </p>
              <a
                href={NFACTORIAL_SITE_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100"
              >
                Explore nFactorial
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-white/6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Reward
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
              Unlock one more hint
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Continue to reveal the next valid hint and return straight to your board.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-[color:#f8fbff] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50"
              >
                Continue and reveal hint
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
