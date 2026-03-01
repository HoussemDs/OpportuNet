export function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'))
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function parseJsonField(str) {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

export function priorityClass(priority) {
  if (!priority) return ''
  return `border-${priority.toLowerCase()}`
}

export function PriorityBadge({ priority }) {
  if (!priority) return <span className="badge badge-pending">Pending</span>
  return <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}
