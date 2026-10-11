export function formatDateTime(v) {
  if (!v) return '-'
  return new Date(v).toLocaleString('id-ID')
}
export function toISODate(d) { return d.toISOString().slice(0, 10) }
