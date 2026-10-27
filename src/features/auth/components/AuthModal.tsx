import { useCallback, useEffect, useRef, useState } from "react"
import "./AuthModal.css"
import {
  fetchSocialAuthStatus,
  AuthUser,
} from "../services/authService"
import { buildBackendUrl } from "../../../config/backend"
import { getSiteInfo } from "../../../lib/framer/project"

export type AuthModalProps = {
  isOpen: boolean
  initialMode?: "register" | "login"
  onRegister?: (data: any) => Promise<any>
  onVerifySignup?: (email: string, code: string) => Promise<any>
  onLogin?: (data: any) => Promise<any>
  onClose: () => void
  onSocialAuthSuccess: (data: { token: string; user: AuthUser; trial?: any }) => void
}

const TRIAL_FEATURES: string[] = [
  "Get Unlimited Chat Bubbles",
  "Get Premium Customization Options",
  "Get 19+ Social Channels (WhatsApp, Messenger, etc.)",
  "Get Custom Triggers & Display Rules",
  "Get Agent Profiles & Welcome Messages",
  "Get Free Support",
  "7 Days Free Trial",
]

export function AuthModal({
  isOpen,
  initialMode = "register",
  onClose,
  onSocialAuthSuccess,
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"register" | "login">(
    initialMode === "login" ? "login" : "register"
  )
  const [step, setStep] = useState<"features" | "waiting">("features")
  const [sessionId, setSessionId] = useState<string>("")
  const [authUrl, setAuthUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const pollingIntervalRef = useRef<number | null>(null)
  const authCompletedRef = useRef<boolean>(false)

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setStep("features")
    setError(null)
  }, [])

  // Reset modal state on open/close or initialMode change
  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode === "login" ? "login" : "register")
      setStep("features")
      setError(null)
      authCompletedRef.current = false
    } else {
      stopPolling()
    }
  }, [isOpen, initialMode, stopPolling])

  // Listen for escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // PostMessage listener from popup / external tab
  useEffect(() => {
    if (!isOpen || step !== "waiting") return

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== "social-auth-success") return
      const { token, user, trial } = event.data
      if (token && user) {
        authCompletedRef.current = true
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        onSocialAuthSuccess({ token, user, trial })
        onClose()
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [isOpen, step, onSocialAuthSuccess, onClose])

  // Polling logic when step === "waiting"
  useEffect(() => {
    if (!isOpen || step !== "waiting" || !sessionId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    authCompletedRef.current = false
    let attempts = 0
    const MAX_ATTEMPTS = 60 // ~120s
    let consecutiveErrors = 0

    const checkStatus = async () => {
      if (authCompletedRef.current) return
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return

      try {
        const res = await fetchSocialAuthStatus(sessionId)
        consecutiveErrors = 0
        if (res && res.status === "authenticated" && res.token && res.user) {
          authCompletedRef.current = true
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          onSocialAuthSuccess({ token: res.token, user: res.user, trial: (res as any).trial })
          onClose()
        }
      } catch {
        consecutiveErrors++
        if (consecutiveErrors >= 6 && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }

    // Trigger immediate check when user focuses window or returns to Framer
    const handleFocusOrVisible = () => {
      if (!authCompletedRef.current && typeof document !== "undefined" && document.visibilityState === "visible") {
        void checkStatus()
      }
    }

    window.addEventListener("focus", handleFocusOrVisible)
    document.addEventListener("visibilitychange", handleFocusOrVisible)

    const initialTimer = setTimeout(() => {
      void checkStatus()
    }, 400)

    pollingIntervalRef.current = window.setInterval(() => {
      attempts++
      if (attempts >= MAX_ATTEMPTS) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }
      void checkStatus()
    }, 2000)

    return () => {
      clearTimeout(initialTimer)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      window.removeEventListener("focus", handleFocusOrVisible)
      document.removeEventListener("visibilitychange", handleFocusOrVisible)
    }
  }, [isOpen, step, sessionId, onSocialAuthSuccess, onClose])

  // Launch browser auth in new tab
  const handleOpenBrowserAuth = async () => {
    setError(null)
    authCompletedRef.current = false

    const newSessionId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    setSessionId(newSessionId)

    let siteId = ""
    try {
        const info = await getSiteInfo()
        siteId = info?.siteId || ""
    } catch {}

    let currentTheme = "dark"
    if (typeof document !== "undefined") {
      const t =
        document.documentElement.getAttribute("data-framer-theme") ||
        document.body.getAttribute("data-framer-theme") ||
        document.documentElement.getAttribute("data-theme") ||
        document.body.getAttribute("data-theme")
      if (t === "light") currentTheme = "light"
    }

    const authBase = buildBackendUrl("/auth")
    const params = new URLSearchParams()
    params.set("mode", authMode)
    params.set("sessionId", newSessionId)
    params.set("theme", currentTheme)
    if (siteId) params.set("siteId", siteId)

    const fullUrl = `${authBase}?${params.toString()}`
    setAuthUrl(fullUrl)
    setStep("waiting")

    window.open(fullUrl, "_blank", "noopener,noreferrer")
  }

  const handleReopenBrowserAuth = () => {
    if (authUrl) {
      window.open(authUrl, "_blank", "noopener,noreferrer")
    } else {
      void handleOpenBrowserAuth()
    }
  }

  if (!isOpen) return null

  return (
    <div className="cb-auth-overlay" onClick={onClose}>
      <div
        className="cb-auth-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="cb-auth-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="cb-auth-icon-wrap">
          <div className="cb-auth-pulse-ring" />
          <div className="cb-auth-icon-box">
            <svg
              width="30"
              height="30"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="cb-auth-app-icon"
            >
              <path
                d="M28.4323 13C39.5865 13 48.6295 19.1933 48.6295 26.833C48.6295 34.4725 39.5865 40.666 28.4323 40.666C27.1413 40.666 25.8786 40.5825 24.6549 40.4238L26.2535 35.6826L21.984 39.9453L14.9196 47L14.484 36.8369C10.6343 34.318 8.23599 30.7672 8.23596 26.833C8.23596 19.1933 17.2781 13.0001 28.4323 13ZM24.1481 22.0088C23.5916 22.0088 23.0605 22.0945 22.5758 22.251C23.1643 22.5375 23.557 23.0498 23.5573 23.6338C23.5573 24.5317 22.6306 25.2597 21.4879 25.2598C20.9295 25.2598 20.4226 25.0861 20.0504 24.8037C20.0238 24.9527 20.0094 25.1049 20.0094 25.2598C20.0094 27.0556 21.8626 28.5117 24.1481 28.5117C26.4336 28.5117 28.2867 27.0556 28.2867 25.2598C28.2866 23.4643 26.4335 22.0088 24.1481 22.0088ZM37.0475 22.0127C37.1898 22.2332 37.27 22.4829 37.2701 22.7471C37.2701 23.6449 36.3434 24.3729 35.2008 24.373C34.5509 24.373 33.9708 24.1377 33.5914 23.7695C33.2978 24.216 33.1315 24.7225 33.1315 25.2598C33.1315 27.0556 34.9847 28.5117 37.2701 28.5117C39.5555 28.5115 41.4078 27.0555 41.4078 25.2598C41.4077 23.4644 39.5554 22.009 37.2701 22.0088C37.1956 22.0088 37.121 22.0097 37.0475 22.0127Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        <div className="cb-auth-header">
          <h3 className="cb-auth-title">
            {authMode === "register"
              ? "You Get Free Trial"
              : "Sign in to your account"}
          </h3>
          <p className="cb-auth-desc">
            {authMode === "register"
              ? "This plugin is full PRO. Start your free trial to unlock chat bubbles and all customizations."
              : "Sign in with your email, password, or Google in your browser to continue."}
          </p>
        </div>

        {authMode === "register" && (
          <div className="cb-auth-features-list">
            {TRIAL_FEATURES.map((feature, idx) => (
              <div key={idx} className="cb-auth-feature-row">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cb-auth-feature-check"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="cb-auth-feature-text">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {step === "waiting" && (
          <div className="cb-auth-waiting-card">
            <div className="cb-auth-waiting-spinner" />
            <div className="cb-auth-waiting-info">
              <div className="cb-auth-waiting-title">Waiting for browser completion...</div>
              <div className="cb-auth-waiting-desc">
                {authMode === "register"
                  ? "Complete your sign-up in the opened browser tab. Your plugin will automatically connect once finished."
                  : "Complete your sign-in in the opened browser tab. Your plugin will automatically connect once finished."}
              </div>
            </div>
          </div>
        )}

        {error && <div className="cb-auth-error">{error}</div>}

        <div className="cb-auth-actions-stack">
          {step === "features" ? (
            <button
              type="button"
              className="cb-auth-primary-btn primary-cta"
              onClick={handleOpenBrowserAuth}
            >
              {authMode === "register"
                ? "Start Free Trial"
                : "Sign In with Browser"}
            </button>
          ) : (
            <button
              type="button"
              className="cb-auth-primary-btn primary-cta"
              onClick={handleReopenBrowserAuth}
            >
              Re-open Browser Window
            </button>
          )}

          <button
            type="button"
            className="cb-auth-cancel-btn"
            onClick={step === "waiting" ? stopPolling : onClose}
          >
            Cancel
          </button>
        </div>

        <div className="cb-auth-footer">
          <span className="cb-auth-footer-text">
            {authMode === "register"
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>
          <button
            type="button"
            className="cb-auth-link-btn"
            onClick={() => {
              setError(null)
              stopPolling()
              setAuthMode(authMode === "register" ? "login" : "register")
            }}
          >
            {authMode === "register" ? "Sign in" : "Start Free Trial"}
          </button>
        </div>
      </div>
    </div>
  )
}
