import {
  BarChart3,
  BrainCircuit,
  Building2,
  CalendarDays,
  Palette,
  Target,
} from 'lucide-react'
import type {
  FeatureItem,
  LeaderboardEntry,
  NavItem,
  ProgressMetric,
} from '../types/site'

export const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Play', to: '/game' },
  { label: 'Online', to: '/online' },
  { label: 'Daily', to: '/daily' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Pro', to: '/pro' },
]

export const homeFeatures: FeatureItem[] = [
  {
    title: 'AI Coach',
    description:
      'Translate missed patterns into practical, motivating next steps after every session.',
    icon: BrainCircuit,
    accent: 'from-cyan-400/30 via-cyan-300/10 to-transparent',
    to: '/game',
    actionLabel: 'Try in Play mode',
  },
  {
    title: 'Daily Challenge',
    description:
      'Build a lightweight ritual with a fresh five-minute puzzle that fits packed schedules.',
    icon: CalendarDays,
    accent: 'from-amber-300/30 via-amber-200/10 to-transparent',
    to: '/daily',
    actionLabel: 'Open today’s challenge',
  },
  {
    title: 'City Leaderboard',
    description:
      'Compare streaks with local players and turn focus into friendly public momentum.',
    icon: Building2,
    accent: 'from-fuchsia-400/25 via-fuchsia-300/10 to-transparent',
    to: '/leaderboard',
    actionLabel: 'View rankings',
  },
  {
    title: 'Focus Mode',
    description:
      'Reduce noise with a distraction-light interface designed for short, high-quality sessions.',
    icon: Target,
    accent: 'from-emerald-400/25 via-emerald-300/10 to-transparent',
    to: '/game',
    actionLabel: 'Launch a focus session',
  },
  {
    title: 'Progress Analytics',
    description:
      'Track speed, confidence, and consistency so improvement feels visible and concrete.',
    icon: BarChart3,
    accent: 'from-sky-500/25 via-sky-300/10 to-transparent',
    to: '/profile',
    actionLabel: 'See your profile',
  },
  {
    title: 'Pro Themes',
    description:
      'Unlock premium visual themes that make daily brain training feel polished and personal.',
    icon: Palette,
    accent: 'from-rose-400/25 via-orange-300/10 to-transparent',
    to: '/pro',
    actionLabel: 'Explore Pro preview',
  },
]

export const leaderboardPreview: LeaderboardEntry[] = [
  { rank: 1, name: 'Maya', city: 'Seattle', streak: '22 day streak' },
  { rank: 2, name: 'Jordan', city: 'Austin', streak: '19 day streak' },
  { rank: 3, name: 'Avery', city: 'Boston', streak: '17 day streak' },
]

export const progressMetrics: ProgressMetric[] = [
  { label: 'Focus score', value: '92%', detail: 'Strong consistency this week' },
  { label: 'Avg. solve time', value: '05:18', detail: 'Down 34 seconds from last month' },
  { label: 'Streak', value: '14 days', detail: 'Right on pace for your next badge' },
]
