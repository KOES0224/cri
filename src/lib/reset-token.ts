/**
 * The password-reset link carries a one-time token. It must never reach analytics or ad requests (GA4, Google Ads,
 * Meta, Kakao, Naver), which report the page address. The root layout runs MOVE_RESET_TOKEN as a beforeInteractive
 * script, so it executes before any Next.js code, hydration, GTM or the Meta Pixel. On /auth/recovery only, it moves the
 * token from the address (`#token=` in current emails, `?token=` in older ones) into this tab's sessionStorage and
 * cleans the address. (A script inside the page would run too late: the layout, with GTM, hydrates first.)
 */
export const RESET_TOKEN_KEY = "cri_reset_token";

export const MOVE_RESET_TOKEN = `(function(){try{if(!/^\\/auth\\/recovery\\/?$/.test(location.pathname))return;var u=new URL(location.href);var h=new URLSearchParams(u.hash.slice(1));var t=h.get('token')||u.searchParams.get('token');if(!t)return;sessionStorage.setItem('${RESET_TOKEN_KEY}',t);u.searchParams.delete('token');h.delete('token');var r=h.toString();history.replaceState(null,'',u.pathname+u.search+(r?'#'+r:''));}catch(e){}})();`;

/** The token for this tab: from sessionStorage, or from the address if storage was unavailable to the early script. */
export function readResetToken(): string | null {
  try {
    const stored = sessionStorage.getItem(RESET_TOKEN_KEY);
    if (stored) return stored;
  } catch {}
  try {
    return new URLSearchParams(location.search).get("token") || new URLSearchParams(location.hash.slice(1)).get("token");
  } catch {
    return null;
  }
}

export function forgetResetToken() {
  try { sessionStorage.removeItem(RESET_TOKEN_KEY); } catch {}
}
