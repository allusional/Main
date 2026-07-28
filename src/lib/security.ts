// Security headers, applied to every response from `next.config.ts`.

/** Origin of the Supabase project the browser talks to directly, if configured. */
function supabaseOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * `script-src` keeps `'unsafe-inline'` because pages are prerendered at build
 * time: a per-request nonce (which needs dynamic rendering) would not match the
 * inline bootstrap script Next.js bakes into the static HTML. The remaining
 * directives still block the high-value targets — exfiltration to third-party
 * origins, `<base>` and form-action hijacking, plugins, and framing.
 */
export function contentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = supabaseOrigin();

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    `connect-src 'self'${supabase ? ` ${supabase} ${supabase.replace(/^https:/, "wss:")}` : ""}`,
    // The building map is an OpenStreetMap embed.
    "frame-src https://www.openstreetmap.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaders(): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(self)",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}

/**
 * Only allow redirects to a path on this site. Anything else — absolute URLs,
 * protocol-relative `//evil.com`, backslash tricks — falls back to `fallback`.
 */
export function safeRedirectPath(next: string | null, fallback: string): string {
  if (!next) return fallback;
  const normalized = next.replaceAll("\\", "/");
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return fallback;
  return normalized;
}
