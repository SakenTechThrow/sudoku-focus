import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  label: string
  to: string
}

export type FeatureItem = {
  title: string
  description: string
  icon: LucideIcon
  accent: string
  to: string
  actionLabel: string
}

export type LeaderboardEntry = {
  rank: number
  name: string
  city: string
  streak: string
}

export type ProgressMetric = {
  label: string
  value: string
  detail: string
}
