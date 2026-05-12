const AUTH_ROUTE = '/auth'

export function isSafeReturnToPath(value: string | null | undefined): value is string {
  if (!value || !value.startsWith('/')) {
    return false
  }

  if (value.startsWith('//') || value.includes('://')) {
    return false
  }

  const pathOnly = value.split('?')[0]

  if (pathOnly === AUTH_ROUTE) {
    return false
  }

  return true
}

export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback = '/profile',
): string {
  return isSafeReturnToPath(value) ? value : fallback
}

export function buildAuthRedirectPath(returnTo: string, fallback = '/profile'): string {
  const safeReturnTo = sanitizeReturnTo(returnTo, fallback)
  const searchParams = new URLSearchParams({
    returnTo: safeReturnTo,
  })

  return `${AUTH_ROUTE}?${searchParams.toString()}`
}
