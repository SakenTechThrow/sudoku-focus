import type { TournamentRoundKey } from '../types/tournament'

export const tournamentRoundOrder: TournamentRoundKey[] = [
  'round_32',
  'round_16',
  'round_8',
  'quarter_final',
  'semi_final',
  'final',
]

export function isTournamentRoundKey(value: unknown): value is TournamentRoundKey {
  return typeof value === 'string' && tournamentRoundOrder.includes(value as TournamentRoundKey)
}

export function getTournamentRoundLabel(roundKey: TournamentRoundKey) {
  switch (roundKey) {
    case 'round_32':
      return 'Round of 32'
    case 'round_16':
      return 'Round of 16'
    case 'round_8':
      return 'Round of 8'
    case 'quarter_final':
      return 'Quarter-final'
    case 'semi_final':
      return 'Semi-final'
    case 'final':
      return 'Final'
    default:
      return 'Round'
  }
}

export function getTournamentRoundKeyForPlayerCount(playerCount: number): TournamentRoundKey | null {
  switch (playerCount) {
    case 32:
      return 'round_32'
    case 16:
      return 'round_16'
    case 8:
      return 'round_8'
    case 4:
      return 'semi_final'
    case 2:
      return 'final'
    default:
      return null
  }
}

export function getTournamentNextRoundKey(
  currentRound: TournamentRoundKey,
  winnersCount: number,
): TournamentRoundKey | null {
  const mappedRound = getTournamentRoundKeyForPlayerCount(winnersCount)

  if (mappedRound) {
    return mappedRound
  }

  if (currentRound === 'round_8' && winnersCount === 4) {
    return 'semi_final'
  }

  if (currentRound === 'quarter_final' && winnersCount === 4) {
    return 'semi_final'
  }

  if (currentRound === 'semi_final' && winnersCount === 2) {
    return 'final'
  }

  return null
}

export function getTournamentBracketRounds(maxPlayers: number): TournamentRoundKey[] {
  switch (maxPlayers) {
    case 32:
      return ['round_32', 'round_16', 'round_8', 'semi_final', 'final']
    case 16:
      return ['round_16', 'round_8', 'semi_final', 'final']
    case 8:
      return ['round_8', 'semi_final', 'final']
    case 4:
      return ['semi_final', 'final']
    default:
      return ['final']
  }
}
