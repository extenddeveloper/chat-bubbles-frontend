import { useEffect, useMemo, useState } from "react"
import { Lock, Crown, Clock } from "lucide-react"
import { getSiteInfo } from "../lib/framer/project"
import "./ProfilePage.css"

export type ProfilePageProps = {
  onBack?: () => void
  onManageSubscription: () => void
  paymentEmail?: string | null
  authUser: any
  onLogout: () => void
  onSignUp: () => void
  onSignIn: () => void
  hasSubscription: boolean
  planDetails: any
  onRefreshSubscription?: () => Promise<boolean>
  onStartTrial?: () => Promise<any>
  theme?: string
  setTheme?: (t: string) => void
}

export function ProfilePage({
  onBack,
  onManageSubscription,
  paymentEmail,
  authUser,
  onLogout,
  onSignUp,
  onSignIn,
  hasSubscription,
  planDetails,
  onRefreshSubscription,
  onStartTrial,
}: ProfilePageProps) {
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [isStartingTrial, setIsStartingTrial] = useState<boolean>(false)
  const [avatarError, setAvatarError] = useState<boolean>(false)

  const hasAlreadyTakenTrial = !!planDetails?.isTrial

  const isProUser = hasSubscription && !planDetails?.isTrial
  const isTrialUser = hasSubscription && !!planDetails?.isTrial

  useEffect(() => {
    let isMounted = true

    const loadUserInfo = async () => {
      try {
        const siteInfo = await getSiteInfo()
        if (!isMounted) return
        setUserName(siteInfo.userName || "")
        setUserEmail(siteInfo.userEmail || "")
      } catch (error) {
        console.error("Error loading current user info:", error)
      }
    }

    void loadUserInfo()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    void onRefreshSubscription?.()
  }, [onRefreshSubscription])

  const displayName = authUser?.username || userName || "User"
  const displayEmail = authUser?.email || paymentEmail || userEmail || "-"
  
  const avatarInitials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }, [displayName])

  if (!authUser) {
    return (
      <div className="framefic-profile-page">
        {onBack && (
          <button
            type="button"
            className="framefic-subpage-back-button-wide"
            onClick={onBack}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </button>
        )}
        <div className="connections-panel--locked">
          <div className="pro-lock-card">
            <div className="pro-lock-icon-wrapper">
              <Lock className="pro-lock-icon" width={28} height={28} />
            </div>
            <h2>Unlock Profile</h2>
            <p>
              Sign in to check your subscription status, manage your account details, and review active sessions.
            </p>
            <button className="primary-cta pro-unlock-btn" type="button" onClick={onSignUp || onSignIn}>
              Sign Up to Unlock
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getPlanName = (plan: string | null | undefined): string => {
    switch (plan) {
      case "monthly":
        return "Pro Monthly"
      case "yearly":
        return "Pro Yearly"
      case "lifetime":
        return "Lifetime Deal"
      case "trial":
        return "Free Trial"
      default:
        return "Free"
    }
  }

  const getStatusLabel = (status: string | null | undefined): string => {
    if (!status) return hasSubscription ? "Active" : "Inactive"
    return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ")
  }

  const planName = getPlanName(planDetails?.plan)
  const planStatusLabel = getStatusLabel(planDetails?.status)
  const planStatusClass = hasSubscription
    ? "framefic-profile-plan-status framefic-profile-plan-status--active"
    : "framefic-profile-plan-status framefic-profile-plan-status--inactive"

  return (
    <div className="framefic-profile-page">
      {onBack && (
        <button
          type="button"
          className="framefic-subpage-back-button-wide"
          onClick={onBack}
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back</span>
        </button>
      )}

      <h3 className="framefic-subpage-title-left">Profile</h3>

      <div className="framefic-profile-hero">
        <div className="framefic-profile-avatar-container">
          {(isProUser || isTrialUser) && (
            <svg className="framefic-avatar-segmented-ring" viewBox="0 0 100 100" shapeRendering="geometricPrecision">
              <defs>
                <linearGradient id="crestbar-pro-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5271FF" />
                  <stop offset="50%" stopColor="#708AFF" />
                  <stop offset="100%" stopColor="#3B58FF" />
                </linearGradient>
                <linearGradient id="crestbar-trial-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d1a918" />
                  <stop offset="50%" stopColor="#a07801" />
                  <stop offset="100%" stopColor="#ebce2b" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="43"
                fill="none"
                stroke={isProUser ? "url(#crestbar-pro-ring-grad)" : "url(#crestbar-trial-ring-grad)"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="60 8"
                transform="rotate(-60 50 50)"
              />
            </svg>
          )}

          <div className="framefic-profile-avatar-circle">
            {authUser?.avatar_url && !avatarError ? (
              <img
                src={authUser.avatar_url}
                alt={displayName}
                className="framefic-profile-avatar-img"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
              />
            ) : (
              avatarInitials
            )}
          </div>

          {isProUser ? (
            <div className="framefic-avatar-badge framefic-avatar-badge--pro" title="Pro Member">
              <Crown fill="currentColor" width={13} height={13} />
              <span>PRO</span>
            </div>
          ) : isTrialUser ? (
            <div className="framefic-avatar-badge framefic-avatar-badge--trial" title="7-Day Free Trial Active">
              <Clock width={13} height={13} color="black" />
              <span>TRIAL</span>
            </div>
          ) : null}
        </div>
        <div className="framefic-profile-identity">
          <div className="framefic-profile-name">{displayName}</div>
          <div className="framefic-profile-email">{displayEmail}</div>
        </div>
      </div>

      <div className="framefic-profile-plan-card">
        <div className="framefic-profile-plan-top">
          <div className="framefic-profile-plan-info">
            <span className="framefic-profile-plan-label">Plan Type</span>
            <span className="framefic-profile-plan-name">{planName}</span>
          </div>
          <span className={planStatusClass}>{planStatusLabel}</span>
        </div>
        <div className="framefic-profile-plan-divider"></div>
        <button
          type="button"
          className="primary-cta"
          onClick={onManageSubscription}
        >
          Manage Subscription
        </button>
      </div>

      {!hasSubscription && (
        <div className="framefic-profile-trial-card">
          <h4 className="framefic-trial-heading">
            Start Your 7-Day Free Trial
          </h4>
          <p className="framefic-trial-desc">
            Get full access to all Pro features, multi-agent support teams, and premium bubble styles for 7 days. No credit card required.
          </p>
          {!hasAlreadyTakenTrial ? (
            <button
              type="button"
              className={`primary-cta trial-activate-btn${!authUser ? " trial-activate-btn--disabled" : ""}`}
              disabled={isStartingTrial || !authUser}
              title={!authUser ? "Sign in to start your free trial" : undefined}
              onClick={async () => {
                if (!authUser || !onStartTrial) return
                setIsStartingTrial(true)
                try {
                  await onStartTrial()
                } catch (err) {
                  console.error("Failed to start trial:", err)
                } finally {
                  setIsStartingTrial(false)
                }
              }}
            >
              {isStartingTrial
                ? "Starting Trial..."
                : authUser
                ? "Start Free Trial"
                : "Sign in to Start Trial"}
            </button>
          ) : (
            <button
              type="button"
              className="trial-activate-btn trial-activate-btn--claimed"
              disabled
            >
              Trial already claimed
            </button>
          )}
        </div>
      )}

      <div className="framefic-profile-section">
        <h4 className="framefic-profile-section-title">Personal Info</h4>
        <div className="framefic-profile-fields-card">
          <div className="framefic-profile-field">
            <label>Name</label>
            <div className="framefic-profile-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input type="text" value={displayName} readOnly />
            </div>
          </div>
          <div className="framefic-profile-field">
            <label>Email</label>
            <div className="framefic-profile-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input type="email" value={displayEmail} readOnly />
            </div>
          </div>
        </div>
      </div>

      {authUser && onLogout && (
        <button
          type="button"
          className="framefic-profile-logout-btn"
          onClick={onLogout}
        >
          Sign Out
          <svg className="framefic-logout-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="framefic-logout-door" d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path className="framefic-logout-arrow" d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path className="framefic-logout-arrow" d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default ProfilePage
