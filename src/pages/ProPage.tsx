import { useState } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  GraduationCap,
  Palette,
  ShieldCheck,
  Sparkles,
  Users2,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { CommunityCard } from '../components/community/CommunityCard'
import { cn } from '../lib/utils'

const PRO_WAITLIST_STORAGE_KEY = 'sudoku-focus-pro-waitlist'

type PricingPlan = {
  name: string
  price: string
  cadence: string
  accent: string
  description: string
  features: string[]
  featured?: boolean
}

const plans: PricingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'Always available',
    accent: 'border-slate-200 bg-white/82 dark:border-white/10 dark:bg-white/6',
    description: 'A solid daily brain-training routine with the core game loop unlocked.',
    features: [
      '3 free hints per puzzle',
      'Basic AI Coach',
      'Daily Challenge',
      'Global leaderboard',
    ],
  },
  {
    name: 'Pro',
    price: '$4.99/month',
    cadence: 'Coming soon',
    featured: true,
    accent: 'border-cyan-300/35 bg-gradient-to-br from-cyan-100/88 via-white/86 to-amber-100/70 dark:border-cyan-300/20 dark:from-cyan-400/14 dark:via-white/6 dark:to-amber-300/10',
    description: 'Built for serious solvers who want fewer limits, richer insight, and a more premium ritual.',
    features: [
      'Unlimited hints',
      'No rewarded ads',
      'Advanced AI Coach explanations',
      'Premium themes',
      'Advanced statistics',
      'Custom puzzle packs',
      'Private online rooms',
      'Share result cards',
    ],
  },
  {
    name: 'Classroom / Team',
    price: 'Pilot access',
    cadence: 'For teachers and coaches',
    accent: 'border-fuchsia-200/70 bg-white/82 dark:border-fuchsia-300/20 dark:bg-white/6',
    description: 'A future expansion for learning groups, classrooms, and guided training programs.',
    features: [
      'Create rooms for students',
      'Track student progress',
      'Class leaderboard',
      'Learning analytics',
      'Group challenges',
    ],
  },
]

const faqs = [
  {
    question: 'Is payment enabled?',
    answer:
      'No. This page is a prototype monetization experiment, so there is no real billing or checkout yet.',
  },
  {
    question: 'What is rewarded hint unlock?',
    answer:
      'Free users can use the first three hints in a puzzle normally. After that, hints can be unlocked through the current sponsored flow.',
  },
  {
    question: 'Can I play for free?',
    answer:
      'Yes. The main game, Daily Challenge, and core AI Coach experience are still available in the free tier.',
  },
  {
    question: 'Will there be classroom mode?',
    answer:
      'That is the direction. The Classroom / Team plan is meant to show how Sudoku Focus could support teachers, coaches, and guided group learning.',
  },
] as const

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email)
}

function saveWaitlistEmail(email: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const stored = window.localStorage.getItem(PRO_WAITLIST_STORAGE_KEY)
    const existing = stored ? (JSON.parse(stored) as string[]) : []
    const normalizedEmail = email.trim().toLowerCase()
    const next = Array.from(new Set([...existing, normalizedEmail]))
    window.localStorage.setItem(PRO_WAITLIST_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage failures so the prototype page never hard-fails.
  }
}

export function ProPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleJoinWaitlist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setError('Enter your email to join the waitlist.')
      setSuccessMessage(null)
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.')
      setSuccessMessage(null)
      return
    }

    saveWaitlistEmail(normalizedEmail)
    setError(null)
    setSuccessMessage('You’re on the mock waitlist. We saved your interest on this device.')
    setEmail('')
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_80px_rgba(2,8,24,0.45)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(61,194,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,191,71,0.12),transparent_24%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_22rem] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/12 px-4 py-2 text-sm font-medium text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/8 dark:text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Prototype monetization experiment
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              Focus Pro
            </h1>
            <p className="mt-4 max-w-3xl text-xl font-medium text-slate-700 dark:text-slate-100">
              A realistic pricing preview for how Sudoku Focus can grow beyond a class project.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              The product stays generous for free players, while Pro and Classroom plans create a believable path toward premium coaching, better retention, and team-based learning.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-[color:#f8fbff] opacity-80 dark:bg-white dark:text-slate-950"
              >
                Upgrade coming soon
              </button>
              <Link
                to="/game"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/12 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
              >
                Try Pro demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/45 dark:shadow-none">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Monetization angle
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/6">
                <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-100">
                  <BrainCircuit className="h-4 w-4" />
                  <span className="text-sm font-semibold">Upgrade on value, not pressure</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Paid features deepen the learning and personalization loop instead of restricting the base game.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/6">
                <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-100">
                  <Palette className="h-4 w-4" />
                  <span className="text-sm font-semibold">Consumer + classroom expansion</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  The pricing story supports both solo subscriptions and a future B2B education layer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-900/10 bg-white/72 p-6 dark:border-white/10 dark:bg-white/4 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Pricing preview</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Plans that match different learning habits
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            The structure below is intentionally realistic enough to communicate product strategy, but still honest about being pre-launch.
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                'rounded-[1.8rem] border p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition dark:shadow-none',
                plan.accent,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-semibold text-slate-950 dark:text-white">{plan.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.description}</p>
                </div>
                {plan.featured ? (
                  <span className="rounded-full bg-cyan-400/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-900 dark:text-cyan-100">
                    Best future value
                  </span>
                ) : null}
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white/75 px-4 py-4 dark:border-white/10 dark:bg-slate-950/40">
                <p className="font-display text-3xl font-semibold text-slate-950 dark:text-white">{plan.price}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.cadence}</p>
              </div>

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/12 text-cyan-900 dark:text-cyan-100">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-sm leading-6 text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-8">
          <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-100">
            <Users2 className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.24em]">Why Pro can work</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-100">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-semibold">Consumer upgrade loop</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Power users pay to remove friction, go deeper with coaching, and personalize the product.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-100">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm font-semibold">Education expansion</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Classroom mode turns Sudoku Focus into a guided training tool for teachers and coaches.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-100">
                <BookOpenCheck className="h-4 w-4" />
                <span className="text-sm font-semibold">Better retention</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Achievements, streaks, and premium progression create stronger habit loops over time.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-100">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-semibold">Honest prototype framing</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                The page communicates business thinking without pretending billing or subscriptions are already live.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Waitlist mock</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
              Join the Pro waitlist
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              This stores your interest locally so the prototype feels interactive without pretending there’s a real CRM behind it yet.
            </p>

            <form className="mt-5 space-y-3" onSubmit={handleJoinWaitlist}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (error) {
                      setError(null)
                    }
                  }}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-300/40 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:placeholder:text-slate-500"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-100/85 px-4 py-3 text-sm text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-100/85 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-4 py-3 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-400/18 dark:text-cyan-100 dark:hover:bg-cyan-400/20"
              >
                Join waitlist
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200/90 bg-white/72 p-5 dark:border-white/10 dark:bg-white/4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Product note</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              This page is a prototype monetization experiment.
            </p>
          </section>

          <CommunityCard compact />
        </aside>
      </section>

      <section className="rounded-[2rem] border border-slate-900/10 bg-white/72 p-6 dark:border-white/10 dark:bg-white/4 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">FAQ</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Questions the pricing page should answer clearly
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[1.6rem] border border-slate-200 bg-white/88 p-5 dark:border-white/10 dark:bg-slate-950/45"
            >
              <h3 className="font-semibold text-slate-950 dark:text-white">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
