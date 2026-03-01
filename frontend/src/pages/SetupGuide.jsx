import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const SITE_KEYS = [
  'kaggle','scholar','bluesky','upwork','dev',
  'ziprecruiter','simplyhired','glassdoor','fiverr','freelancer','linkedin'
]

const STORAGE_KEY = 'jia_connected_sites'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

export default function SetupGuide() {
  const [sites, setSites]       = useState({})
  const [connected, setConn]    = useState(loadSaved)
  const [expanded, setExp]      = useState({})

  useEffect(() => {
    axios.get(`${API}/sites/`).then((r) => setSites(r.data)).catch(() => {})
  }, [])

  function toggle(key) {
    const next = { ...connected, [key]: !connected[key] }
    setConn(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function toggleExpand(key) {
    setExp((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const connectedCount = SITE_KEYS.filter((k) => connected[k]).length
  const allConnected   = connectedCount === SITE_KEYS.length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Automation <em>Setup Guide</em></h1>
        <p className="page-subtitle">
          Check which sites you already monitor, and get step-by-step instructions for the rest
        </p>
      </div>

      {/* Checklist */}
      <div className="checklist-section">
        <div className="checklist-title">
          ✅ Which sites are you monitoring?
          <span className="checklist-progress">{connectedCount} / {SITE_KEYS.length} connected</span>
        </div>
        <p className="checklist-sub">Click to toggle — this is saved in your browser.</p>
        <div className="checklist-items">
          {SITE_KEYS.map((key) => {
            const site = sites[key]
            if (!site) return null
            return (
              <div
                key={key}
                className={`check-item${connected[key] ? ' checked' : ''}`}
                onClick={() => toggle(key)}
              >
                <span className="check-item-icon">{site.icon}</span>
                <span>{site.name}</span>
                {connected[key] && <span className="check-mark">✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Status notice */}
      {allConnected ? (
        <div className="alert-notice success">
          🎉 <strong>All 11 sites connected!</strong> Your automation pipeline is fully active.
        </div>
      ) : (
        <div className="alert-notice info">
          ⚡ <strong>{SITE_KEYS.length - connectedCount} site{SITE_KEYS.length - connectedCount !== 1 ? 's' : ''} not yet connected.</strong>{' '}
          Each one sends real-time alerts via Distill.io → this dashboard → Claude AI analysis.
        </div>
      )}

      {/* Distill.io webhook guide */}
      <div className="webhook-card">
        <h3>🔗 How to Connect Distill.io → This Dashboard</h3>
        <div className="action-steps" style={{ marginBottom: 0 }}>
          {[
            'Open Distill.io and click on any watch you have set up',
            'Go to Actions → Add Action → Webhook',
            'Set Method to POST and URL to: http://localhost:8000/messages/',
            'Set the body to JSON format (see below) and save',
          ].map((step, i) => (
            <div key={i} className="action-step">
              <div className="step-num">{i + 1}</div>
              <div className="step-text">{step}</div>
            </div>
          ))}
        </div>
        <div className="code-block">{`{
  "subject": "Distill.io: {{watchname}} updated",
  "content": "{{diff}}",
  "source": "LinkedIn",
  "sender_email": "alert@distill.io"
}`}</div>
      </div>

      {/* Site cards */}
      <div className="section-heading" style={{ marginBottom: 18 }}>
        <h2>All <em>11 Sites</em> — Setup Guides</h2>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--warm-mid)' }}>
          click a card to expand
        </span>
      </div>

      <div className="sites-grid">
        {SITE_KEYS.map((key) => {
          const site = sites[key]
          if (!site) return null
          const isConn = connected[key]
          const isOpen = expanded[key]

          return (
            <div key={key} className={`site-card${isConn ? ' connected' : ' not-connected'}`}>
              <div className="site-header">
                <span className="site-icon">{site.icon}</span>
                <div>
                  <div className="site-name">{site.name}</div>
                  <div className="site-purpose">{site.purpose}</div>
                </div>
                <div className="site-badge">
                  {isConn
                    ? <span className="badge badge-actioned">✓ Active</span>
                    : <span className="badge badge-pending">Not set</span>
                  }
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm btn-full"
                onClick={() => toggleExpand(key)}
              >
                {isOpen ? '▲ Hide Guide' : '▼ Show Setup Guide'}
              </button>

              {isOpen && (
                <div className="setup-box" style={{ marginTop: 12 }}>
                  <div className="setup-box-title">How to set up</div>
                  <div className="setup-steps-text">{site.how_to_setup}</div>
                  <div className="distill-tip">
                    <span>💡</span>
                    <span><strong>Distill tip:</strong> {site.distill_tip}</span>
                  </div>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 12, display: 'inline-flex' }}
                  >
                    Open {site.name} →
                  </a>
                </div>
              )}

              <div className="site-footer">
                <div className="toggle-row">
                  <span className="toggle-label">Connected</span>
                  <label className="toggle">
                    <input type="checkbox" checked={!!isConn} onChange={() => toggle(key)} />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
