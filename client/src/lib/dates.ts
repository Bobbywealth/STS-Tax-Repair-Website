/**
 * Parse API date values safely and consistently across browsers.
 *
 * Why: Some endpoints return MySQL timestamp strings like "YYYY-MM-DD HH:mm:ss"
 * without a timezone. Browser Date parsing for that format is inconsistent and
 * can shift by hours. We parse it manually as a *local* datetime.
 */
export function parseApiDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value !== "string") return null;

  const s = value.trim();
  if (!s) return null;

  // Numeric epoch (seconds or ms)
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    const ms = n < 1_000_000_000_000 ? n * 1000 : n; // < 1e12 => seconds
    return new Date(ms);
  }

  // ISO strings (with timezone) are safe to hand to Date().
  if (s.includes("T") || /[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // MySQL formats without timezone: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD"
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (m) {
    const [, yy, mm, dd, hh = "00", mi = "00", ss = "00"] = m;
    const d = new Date(
      Number(yy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(mi),
      Number(ss),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Fallback to built-in parsing
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

