const DEFAULT_TIMEOUT_MESSAGE = 'Request took too long. Please check your connection and try again.'

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = DEFAULT_TIMEOUT_MESSAGE,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)

    promise
      .then((value) => {
        globalThis.clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        globalThis.clearTimeout(timeoutId)
        reject(error)
      })
  })
}
