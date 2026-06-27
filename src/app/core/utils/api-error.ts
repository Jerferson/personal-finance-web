export function parseApiError(e: unknown, fallback: string): string {
  if (!e || typeof e !== 'object') return fallback;
  const err = e as { error?: { message?: string } | string; message?: string };

  if (err.error && typeof err.error === 'object') {
    const msg = (err.error as { message?: string }).message;
    if (msg) return Array.isArray(msg) ? msg[0] : msg;
  }

  if (typeof err.message === 'string' && err.message) return err.message;

  return fallback;
}
