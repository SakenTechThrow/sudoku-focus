type PageIntroProps = {
  eyebrow: string
  title: string
  description: string
  highlights: string[]
}

export function PageIntro({
  description,
  eyebrow,
  highlights,
  title,
}: PageIntroProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">{description}</p>
        </div>

        <div className="grid gap-3">
          {highlights.map((highlight) => (
            <div
              key={highlight}
              className="rounded-2xl border border-slate-900/10 bg-slate-950/6 px-4 py-4 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-200"
            >
              {highlight}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
