/** Format a Date object using local calendar date (not UTC). */
export function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Add n days to an ISO date string, using local time. */
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return toDateStr(new Date(y, m - 1, d + n))
}

/** Today's date as an ISO string in local time. */
export function todayStr() {
  return toDateStr(new Date())
}
