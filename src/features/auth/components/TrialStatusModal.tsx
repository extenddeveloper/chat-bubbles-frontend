import "./TrialStatusModal.css"

export type TrialStatusModalProps = {
  isOpen: boolean
  status: "started" | "expired" | null
  onClose: () => void
  onUpgrade: () => void
  onLogout: () => void
}

export function TrialStatusModal({ isOpen, status, onClose, onUpgrade, onLogout }: TrialStatusModalProps) {
  if (!isOpen || !status) return null

  const isStarted = status === "started"

  return (
    <div className="framefic-trial-status-overlay" onClick={isStarted ? onClose : undefined}>
      <div className="framefic-trial-status-panel" onClick={(e) => e.stopPropagation()}>
        <div className="framefic-trial-status-header">
          {isStarted && (
            <button
              type="button"
              className="framefic-trial-status-close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="framefic-trial-status-content">
          {isStarted ? (
            <>
              <div className="framefic-trial-status-icon-bubble framefic-trial-status-icon-bubble--success">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <h3>You're all set!</h3>
              <p className="framefic-trial-status-description">Your 7-day free trial has started</p>

              <button className="framefic-trial-status-btn" onClick={onClose}>
                Start Exploring
              </button>

              <span className="framefic-trial-status-footnote">
                Trial ends in 7 days. Cancel anytime
              </span>
            </>
          ) : (
            <>
              <div className="framefic-trial-status-icon-bubble framefic-trial-status-icon-bubble--locked">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>

              <h3>Your trial has ended</h3>
              <p className="framefic-trial-status-description">
                Upgrade now to keep using. Your widgets are saved and waiting
              </p>

              <button className="framefic-trial-status-btn" onClick={onUpgrade}>
                Upgrade Now
              </button>

              <button className="framefic-trial-status-logout-link" onClick={onLogout}>
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
