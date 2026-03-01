import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { parseJsonField, PriorityBadge, StatusBadge } from '../utils.jsx'

const API = 'http://localhost:8000'

function ScoreCircle({ score }) {
  const s = score || 0
  const r = 34
  const circ = 2 * Math.PI * r
  const filled = (s / 10) * circ
  return (
    <div className="score-wrapper">
      <div className="score-circle" style={{ width: 80, height: 80 }}>
        <svg className="score-svg" width="80" height="80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--sand)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r={r}
            fill="none"
            stroke="var(--terracotta)"
            strokeWidth="6"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="score-num">{s}</span>
      </div>
      <span className="score-label">out of 10</span>
    </div>
  )
}

export default function MessageDetail() {
  const { id } = useParams()
  const [msg, setMsg]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [reanalyzing, setRA]    = useState(false)
  const [toast, setToast]       = useState('')
  const [copied, setCopied]     = useState(false)

  useEffect(() => { fetchMsg() }, [id])

  async function fetchMsg() {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/messages/${id}`)
      setMsg(res.data)
    } catch (_) {}
    setLoading(false)
  }

  async function reanalyze() {
    setRA(true)
    try {
      const res = await axios.post(`${API}/messages/${id}/reanalyze`)
      setMsg(res.data)
      showToast('✓ Re-analyzed with Claude AI')
    } catch (_) {
      showToast('Re-analysis failed')
    }
    setRA(false)
  }

  async function updateStatus(newStatus) {
    try {
      await axios.patch(`${API}/messages/${id}/status?status=${newStatus}`)
      setMsg((prev) => ({ ...prev, status: newStatus }))
      showToast(`✓ Marked as ${newStatus}`)
    } catch (_) {
      showToast('Update failed')
    }
  }

  function copyReply() {
    if (!msg?.suggested_reply || msg.suggested_reply === 'null') return
    navigator.clipboard.writeText(msg.suggested_reply)
    setCopied(true)
    showToast('✓ Reply copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  function showToast(m) {
    setToast(m)
    setTimeout(() => setToast(''), 2800)
  }

  if (loading) return <div className="loading"><span className="spinner" />Loading…</div>
  if (!msg) return (
    <div className="empty-state">
      <div className="empty-icon">❌</div>
      <div className="empty-title">Message not found</div>
      <Link to="/messages" className="btn btn-secondary" style={{ marginTop: 16 }}>← Back to Inbox</Link>
    </div>
  )

  const steps = parseJsonField(msg.action_steps)
  const flags = parseJsonField(msg.red_flags).filter(Boolean)
  const hasReply = msg.suggested_reply && msg.suggested_reply !== 'null'

  return (
    <div>
      <Link to="/messages" className="back-link">← Back to Inbox</Link>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <PriorityBadge priority={msg.priority} />
          <StatusBadge status={msg.status} />
          <span className="msg-source">{msg.source}</span>
        </div>
        <h1 className="page-title" style={{ fontSize: 26 }}>{msg.subject}</h1>
        <p className="page-subtitle" style={{ marginTop: 6 }}>
          From {msg.sender_email} · {new Date(msg.received_at + 'Z').toLocaleString()}
        </p>
      </div>

      {/* Top actions */}
      <div style={{ display: 'flex', gap: 9, marginBottom: 28, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={reanalyze} disabled={reanalyzing}>
          {reanalyzing ? <><span className="spinner" style={{ borderTopColor: '#fff' }} />Analyzing…</> : '🔄 Re-analyze'}
        </button>
        {msg.status !== 'actioned' && (
          <button className="btn btn-secondary btn-sm" onClick={() => updateStatus('actioned')}>✓ Mark Actioned</button>
        )}
        {msg.status !== 'dismissed' && (
          <button className="btn btn-danger btn-sm" onClick={() => updateStatus('dismissed')}>✕ Dismiss</button>
        )}
      </div>

      <div className="detail-grid">
        {/* LEFT COLUMN */}
        <div>
          {/* AI Summary */}
          {msg.ai_summary && (
            <div className="detail-card">
              <h3>🧠 AI Analysis</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>{msg.ai_summary}</p>
              {msg.priority_reason && (
                <p style={{ fontSize: 13, color: 'var(--umber)', marginTop: 10, fontStyle: 'italic' }}>
                  Priority reason: {msg.priority_reason}
                </p>
              )}
            </div>
          )}

          {/* Action Steps */}
          {steps.length > 0 && (
            <div className="detail-card">
              <h3>📋 Exact Steps to Take</h3>
              <ul className="action-steps">
                {steps.map((step, i) => (
                  <li key={i} className="action-step">
                    <div className="step-num">{i + 1}</div>
                    <div className="step-text">{step}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Reply */}
          {hasReply && (
            <div className="detail-card">
              <h3>✉️ Suggested Reply</h3>
              <div className="reply-box">
                {msg.suggested_reply}
                <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copyReply}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Readiness Check */}
          {msg.readiness_check && (
            <div className="detail-card readiness-card">
              <h3>🚀 Readiness Check</h3>
              <div className="readiness-box">
                <div className="readiness-icon">📋</div>
                <div className="readiness-text">{msg.readiness_check}</div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {msg.timeline && (
            <div className="detail-card">
              <h3>⏱ Timeline</h3>
              <div className="timeline-box">
                <div className="timeline-icon">🕐</div>
                <div>
                  <div className="timeline-text">{msg.timeline}</div>
                  {msg.deadline && <div className="timeline-deadline">Deadline: {msg.deadline}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Red Flags */}
          {flags.length > 0 && (
            <div className="detail-card">
              <h3>⚠️ Red Flags</h3>
              <div className="red-flags">
                {flags.map((flag, i) => (
                  <div key={i} className="red-flag"><span>⚠</span>{flag}</div>
                ))}
              </div>
            </div>
          )}

          {/* Original Alert */}
          <div className="detail-card">
            <h3>📨 Original Alert</h3>
            <div className="original-content">{msg.content}</div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          {/* Score */}
          {msg.opportunity_score != null && (
            <div className="detail-card">
              <h3>Opportunity Score</h3>
              <ScoreCircle score={msg.opportunity_score} />
              {msg.estimated_value && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <span className="badge badge-analyzed">{msg.estimated_value}</span>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="detail-card">
            <h3>Details</h3>
            <div className="info-row">
              <span className="info-key">Source</span>
              <span className="info-val">{msg.source}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Received</span>
              <span className="info-val">{new Date(msg.received_at + 'Z').toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Status</span>
              <span className="info-val" style={{ textTransform: 'capitalize' }}>{msg.status}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Priority</span>
              <span className="info-val">{msg.priority || '—'}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="detail-card">
            <h3>Quick Actions</h3>
            <div className="action-stack">
              {hasReply && (
                <button className="btn btn-primary btn-full" onClick={copyReply}>
                  📋 Copy Reply
                </button>
              )}
              <button className="btn btn-secondary btn-full" onClick={() => updateStatus('actioned')}>
                ✓ Mark Done
              </button>
              <button className="btn btn-ghost btn-full" onClick={reanalyze} disabled={reanalyzing}>
                🔄 Re-analyze
              </button>
              <button className="btn btn-danger btn-full" onClick={() => updateStatus('dismissed')}>
                ✕ Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
