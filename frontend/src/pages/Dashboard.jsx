import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { timeAgo, PriorityBadge, StatusBadge, priorityClass } from '../utils.jsx'

const API = 'http://localhost:8000'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [toast, setToast] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        axios.get(`${API}/stats/`),
        axios.get(`${API}/messages/?limit=5`),
      ])
      setStats(s.data)
      setRecent(m.data)
    } catch (_) {}
  }, [])

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 12000)
    return () => clearInterval(iv)
  }, [fetchData])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Good morning, <em>Raef</em></h1>
        <p className="page-subtitle">AI-powered command center for your Distill.io job alerts</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Alerts</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High Priority</div>
            <div className="stat-value red">{stats.high_priority}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Medium</div>
            <div className="stat-value amber">{stats.medium_priority}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low</div>
            <div className="stat-value green">{stats.low_priority}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Actioned</div>
            <div className="stat-value green">{stats.actioned}</div>
          </div>
        </div>
      )}

      {/* Recent alerts */}
      <div className="section-heading">
        <h2>Recent <em>Alerts</em></h2>
        <Link to="/messages" className="btn btn-ghost btn-sm">View all →</Link>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No alerts yet</div>
          <p className="empty-sub">Configure your Distill.io webhook in Setup Guide to receive and analyze job alerts here.</p>
        </div>
      ) : (
        <div className="messages-list">
          {recent.map((msg) => (
            <Link
              key={msg.id}
              to={`/messages/${msg.id}`}
              className={`message-card ${priorityClass(msg.priority)}`}
            >
              <div>
                <div className="msg-subject">{msg.subject}</div>
                <div className="msg-summary">
                  {msg.ai_summary || msg.content.slice(0, 120) + '…'}
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
