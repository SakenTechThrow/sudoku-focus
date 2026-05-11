import { difficultyConfig, difficultyOrder } from '../../constants/difficulty'
import { cn } from '../../lib/utils'
import type { Difficulty } from '../../types/sudoku'

type DifficultySelectorProps = {
  currentDifficulty: Difficulty
  onSelect: (difficulty: Difficulty) => void
}

export function DifficultySelector({
  currentDifficulty,
  onSelect,
}: DifficultySelectorProps) {
  const activeDifficulty = difficultyConfig[currentDifficulty]

  return (
    <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Difficulty</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Choose your session
          </h2>
        </div>

        <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Selected session
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
            {activeDifficulty.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {activeDifficulty.description}
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            {activeDifficulty.cellsToRemove} cells removed · {activeDifficulty.mistakeLimit} mistake limit
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {difficultyOrder.map((difficulty) => {
            const config = difficultyConfig[difficulty]
            const isActive = difficulty === currentDifficulty

            return (
              <button
                key={difficulty}
                type="button"
                onClick={() => onSelect(difficulty)}
                className={cn(
                  'min-h-[138px] rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
                  isActive
                    ? 'border-cyan-300/45 bg-cyan-100/85 shadow-[0_12px_30px_rgba(14,116,144,0.12)] dark:bg-cyan-400/14 dark:shadow-none'
                    : 'border-slate-200 bg-white/88 hover:border-cyan-300/35 hover:bg-cyan-50/80 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/80',
                )}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn(
                        'font-display text-lg font-semibold',
                        isActive ? 'text-cyan-950 dark:text-white' : 'text-slate-950 dark:text-white',
                      )}
                    >
                      {config.label}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        isActive
                          ? 'bg-white/85 text-cyan-900 dark:bg-white/10 dark:text-cyan-100'
                          : 'bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300',
                      )}
                    >
                      {isActive ? 'Selected' : 'Choose'}
                    </span>
                  </div>

                  <p
                    className={cn(
                      'mt-2 text-sm leading-5',
                      isActive ? 'text-cyan-900/85 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300',
                    )}
                  >
                    {config.description}
                  </p>

                  <p
                    className={cn(
                      'mt-auto pt-4 text-xs font-medium',
                      isActive ? 'text-cyan-900 dark:text-cyan-100' : 'text-slate-500 dark:text-slate-400',
                    )}
                  >
                    {config.cellsToRemove} removed · {config.mistakeLimit} mistakes
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
