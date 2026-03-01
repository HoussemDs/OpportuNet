import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { timeAgo, PriorityBadge, StatusBadge, priorityClass } from '../utils.jsx'

const API = 'http://localhost:8000'

const PRIORITIES = ['', 'High', 'Medium', 'Low']
const STATUSES   = ['', 'pending', 'analyzed', 'actioned', 'dismissed']

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [priority, setPriority] = useState('')
  const [status, setStatus]     = useState('')

  useEffect(() => {
    fetchMessages()
  }, [priority, status])

  async function fetchMessages() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 50 })
      if (priority) params.append('priority', priority)
      if (status)   params.append('status', status)
      const res = await axios.get(`${API}/messages/?${params}`)
      setMessages(res.data)
    } catch (_) {}
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alert <em>Inbox</em></h1>
        <p className="page-subtitle">All Distill.io alerts — automatically analyzed by Claude AI</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <span className="filter-label">Priority</span>
        {PRIORITIES.map((p) => (
          <button
            key={p || 'all-p'}
            className={`filter-chip${priority === p ? ' active' : ''}`}
            onClick={() => setPriority(p)}
          >
            {p || 'All'}
          </button>
        ))}
        <div className="filter-divider" />
        <span className="filter-label">Status</span>
        {STATUSES.map((s) => (
          <button
            key={s || 'all-s'}
            className={`filter-chip${status === s ? ' active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><span className="spinner" />Loading alerts…</div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No messages found</div>
          <p className="empty-sub">Try adjusting your filters or simulate an alert from the dashboard.</p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((msg) => (
            <Link
              key={msg.id}
              to={`/messages/${msg.id}`}
              className={`message-card ${priorityClass(msg.priority)}`}
            >
              <div>
                <div className="msg-subject">{msg.subject}</div>
                <div className="msg-summary">
                  {msg.ai_summary || msg.content.slice(0, 130) + '…'}
                </div>
                <div className="msg-meta">
                  <span className="msg-source">{msg.source}</span>
                  <span className="msg-time">{timeAgo(msg.received_at)}</span>
                  {msg.opportunity_score != null && (
                    <span className="msg-score">Score {msg.opportunity_score}/10</span>
                  )}
                  {msg.estimated_value && (
                    <span className="msg-value">{msg.estimated_value}</span>
                  )}
                </div>
              </div>
              <div className="msg-right">
                <PriorityBadge priority={msg.priority} />
                <StatusBadge status={msg.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
