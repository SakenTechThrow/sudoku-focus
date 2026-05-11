import { Grid3x3, Timer } from 'lucide-react'
import { cn } from '../../lib/utils'

const previewBoard = [
  ['5', '3', '', '', '7', '', '', '', ''],
  ['6', '', '', '1', '9', '5', '', '', ''],
  ['', '9', '8', '', '', '', '', '6', ''],
  ['8', '', '', '', '6', '', '', '', '3'],
  ['4', '', '', '8', '', '3', '', '', '1'],
  ['7', '', '', '', '2', '', '', '', '6'],
  ['', '6', '', '', '', '', '2', '8', ''],
  ['', '', '', '4', '1', '9', '', '', '5'],
  ['', '', '', '', '8', '', '', '7', '9'],
]

export function BoardPreview() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white/82 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_24px_80px_rgba(2,8,24,0.45)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">
            Smart Session Preview
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Start fast, stay calm
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-900/10 bg-slate-950/6 text-cyan-700 dark:border-white/10 dark:bg-white/6 dark:text-cyan-200">
          <Grid3x3 className="h-5 w-5" />
        </div>
      </div>

      <div className="grid grid-cols-9 overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-slate-100/85 dark:border-white/10 dark:bg-slate-900/70">
        {previewBoard.flatMap((row, rowIndex) =>
          row.map((value, columnIndex) => (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className={cn(
                'flex aspect-square items-center justify-center border border-slate-900/8 text-sm font-semibold sm:text-base dark:border-white/6',
                rowIndex % 3 === 0 && 'border-t-2 border-t-slate-900/15 dark:border-t-white/18',
                columnIndex % 3 === 0 && 'border-l-2 border-l-slate-900/15 dark:border-l-white/18',
                rowIndex === 8 && 'border-b-2 border-b-slate-900/15 dark:border-b-white/18',
                columnIndex === 8 && 'border-r-2 border-r-slate-900/15 dark:border-r-white/18',
                value ? 'text-slate-700 dark:text-slate-100' : 'text-cyan-700/45 dark:text-cyan-200/50',
              )}
            >
              {value || <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/50" />}
            </div>
          )),
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-900/10 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Timer className="h-4 w-4 text-cyan-700 dark:text-cyan-200" />
            Focus mode ready
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Notes, timer, and soft coaching cues will live here in the playable version.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-900/10 bg-gradient-to-br from-brand-400/18 to-sun-400/10 p-4 dark:border-white/10">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-800 dark:text-cyan-100/80">
            Today&apos;s target
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-slate-950 dark:text-white">5 minute reset</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200/80">
            One puzzle, one clear mind, zero friction.
          </p>
        </div>
      </div>
    </section>
  )
}
