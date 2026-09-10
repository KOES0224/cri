/** Only relative same-site routes can be used after authentication. */
export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/dashboard';
  try {
    const url = new URL(value, 'https://criglobal.org');
    if (url.origin !== 'https://criglobal.org') return '/dashboard';
    return url.pathname + url.search + url.hash;
  } catch { return '/dashboard'; }
}
