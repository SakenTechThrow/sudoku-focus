import { useState } from 'react'
import { ArrowRight, Globe2, TimerReset, Users2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { difficultyConfig, difficultyOrder } from '../constants/difficulty'
import { useAuth } from '../hooks/useAuth'
import { useOnlineRoom } from '../hooks/useOnlineRoom'
import { cn } from '../lib/utils'
import type { Difficulty } from '../types/sudoku'
import type { OnlineMode } from '../types/online'

const modeCards: Array<{
  value: OnlineMode
  title: string
  description: string
  icon: typeof Users2
}> = [
  {
    value: 'collaborative',
    title: 'Collaborative',
    description: 'Solve one shared board together.',
    icon: Users2,
  },
  {
    value: 'race',
    title: 'Race',
    description: 'Everyone solves the same puzzle separately. Fastest accurate solve wins.',
    icon: TimerReset,
  },
]

export function OnlinePage() {
  const navigate = useNavigate()
  const { isAuthenticated, profile } = useAuth()
  const { actionLoading, createRoom, joinRoom } = useOnlineRoom()
  const [mode, setMode] = useState<OnlineMode>('collaborative')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [roomCode, setRoomCode] = useState('')
  const [createFeedback, setCreateFeedback] = useState<string | null>(null)
  const [joinFeedback, setJoinFeedback] = useState<string | null>(null)

  async function handleCreateRoom() {
    setCreateFeedback(null)

    const result = await createRoom({ mode, difficulty })

    if (!result.ok) {
      setCreateFeedback(result.message)
      return
    }

    navigate(`/online/${result.roomCode}`)
  }

  async function handleJoinRoom() {
    setJoinFeedback(null)

    const result = await joinRoom(roomCode)

    if (!result.ok) {
      setJoinFeedback(result.message)
      return
    }

    navigate(`/online/${result.roomCode}`)
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200/75">Online</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Play Online
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
              Create a shared Sudoku room and play with friends in real time.
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center gap-3 text-cyan-800 dark:text-cyan-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-cyan-400/10">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Realtime rooms</p>
                <p className="mt-1 font-medium text-slate-950 dark:text-white">
                  Invite friends with one room code
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Collaborative mode shares one live board. Race mode gives everyone the same puzzle with their own timer and score.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Create room</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
            Set the session
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Pick a mode, choose the puzzle difficulty, and share the room with friends.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Mode</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {modeCards.map((modeCard) => {
                  const Icon = modeCard.icon
                  const isActive = mode === modeCard.value

                  return (
                    <button
                      key={modeCard.value}
                      type="button"
                      onClick={() => setMode(modeCard.value)}
                      className={cn(
                        'rounded-[1.6rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
                        isActive
                          ? 'border-cyan-300/45 bg-cyan-100/85 dark:bg-cyan-400/14'
                          : 'border-slate-200 bg-white/90 hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/75',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-cyan-800 dark:border-white/10 dark:bg-white/8 dark:text-cyan-100">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                          isActive
                            ? 'bg-white/85 text-cyan-900 dark:bg-white/10 dark:text-cyan-100'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300',
                        )}
                        >
                          {isActive ? 'Selected' : 'Choose'}
                        </span>
                      </div>
                      <p className="mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">
                        {modeCard.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {modeCard.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Difficulty</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {difficultyOrder.map((level) => {
                  const config = difficultyConfig[level]
                  const isActive = difficulty === level

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={cn(
                        'rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
                        isActive
                          ? 'border-cyan-300/45 bg-cyan-100/85 dark:bg-cyan-400/14'
                          : 'border-slate-200 bg-white/90 hover:border-cyan-300/35 hover:bg-cyan-50/70 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-slate-900/75',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display text-lg font-semibold text-slate-950 dark:text-white">
                          {config.label}
                        </p>
                        {isActive ? (
                          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-cyan-900 dark:bg-white/10 dark:text-cyan-100">
                            Ready
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                        {config.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Selected room</p>
              <p className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                {mode === 'collaborative' ? 'Collaborative' : 'Race'} · {difficultyConfig[difficulty].label}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {mode === 'collaborative'
                  ? 'One shared board with live edits from everyone in the room.'
                  : 'The same puzzle for every player, with live standings and a clear winner.'}
              </p>
            </div>

            {isAuthenticated ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Creating as <span className="font-semibold text-slate-950 dark:text-white">{profile?.username ?? userLabelFallback(profile?.email)}</span>.
              </p>
            ) : (
              <div className="rounded-[1.6rem] border border-amber-200 bg-amber-100/80 p-4 text-sm text-amber-950 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-50">
                Sign in to create an online room.
                <Link to="/auth" className="ml-2 font-semibold underline underline-offset-4">
                  Go to login
                </Link>
              </div>
            )}

            {createFeedback ? (
              <div className="rounded-[1.4rem] border border-rose-200 bg-rose-100/85 px-4 py-3 text-sm text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
                {createFeedback}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleCreateRoom()}
              disabled={actionLoading || !isAuthenticated}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-[color:#f8fbff] shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-50"
            >
              Create Room
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/90 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_60px_rgba(2,8,24,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Join room</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950 dark:text-white">
            Enter a room code
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Paste a friend’s 6-character room code and jump into the live puzzle room.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Room code</span>
              <input
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="AB12CD"
                maxLength={6}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-base tracking-[0.3em] text-slate-950 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-cyan-300/45 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-50 dark:placeholder:text-slate-500"
              />
            </label>

            {joinFeedback ? (
              <div className="rounded-[1.4rem] border border-rose-200 bg-rose-100/85 px-4 py-3 text-sm text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
                {joinFeedback}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleJoinRoom()}
              disabled={actionLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:border-cyan-300/35 hover:bg-cyan-50/75 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-slate-900/80"
            >
              Join Room
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function userLabelFallback(email: string | null | undefined) {
  return email?.split('@')[0] ?? 'your account'
}
