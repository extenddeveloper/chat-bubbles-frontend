import React, { useEffect, useRef, useState } from "react"
import "./AuthModal.css"
import {
  fetchSocialAuthStatus,
  verifySocialAuthCode,
  checkAccountExists,
  AuthUser,
} from "../services/authService"
import { BACKEND_BASE_URL } from "../../../config/backend"
import { getSiteInfo } from "../../../lib/framer/project"

export type AuthModalProps = {
  isOpen: boolean
  initialMode?: "register" | "login"
  onRegister: (data: any) => Promise<any>
  onVerifySignup: (email: string, code: string) => Promise<any>
  onLogin: (data: any) => Promise<any>
  onClose: () => void
  onSocialAuthSuccess: (data: { token: string; user: AuthUser }) => void
}

export function AuthModal({
  isOpen,
  initialMode = "register",
  onRegister,
  onVerifySignup,
  onLogin,
  onClose,
  onSocialAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<
    "register" | "login" | "code-verify" | "social-polling"
  >("register")

  const [previousMode, setPreviousMode] = useState<"register" | "login">("register")
  const [socialLoginUrl, setSocialLoginUrl] = useState<string>("")
  const [manualSocialCode, setManualSocialCode] = useState<string>("")
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false)
  const pollingIntervalRef = useRef<number | null>(null)

  const stopSocialPolling = (): void => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setMode(previousMode)
    initGoogleSession()
  }

  const handleVerifyManualCode = async (): Promise<void> => {
    if (manualSocialCode.length < 6) return
    setError(null)
    setIsVerifyingCode(true)
    try {
      const res = await verifySocialAuthCode(manualSocialCode)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (onSocialAuthSuccess) {
        onSocialAuthSuccess({ token: res.token, user: res.user })
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.")
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const [googleSessionId, setGoogleSessionId] = useState<string>("")
  const [googleLoginUrl, setGoogleLoginUrl] = useState<string>("")

  const initGoogleSession = (): void => {
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setGoogleSessionId(sessionId)
    setGoogleLoginUrl(`${BACKEND_BASE_URL.replace(/\/+$/, "")}/api/auth/google?sessionId=${sessionId}`)
    void getSiteInfo()
      .then((siteInfo) => {
        let extra = ""
        if (siteInfo?.siteName) extra += `&siteName=${encodeURIComponent(siteInfo.siteName)}`
        if (siteInfo?.siteUrl) extra += `&siteUrl=${encodeURIComponent(siteInfo.siteUrl)}`
        if (siteInfo?.siteId) extra += `&siteId=${encodeURIComponent(siteInfo.siteId)}`
        if (extra) {
          setGoogleLoginUrl(`${BACKEND_BASE_URL.replace(/\/+$/, "")}/api/auth/google?sessionId=${sessionId}${extra}`)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (isOpen) {
      initGoogleSession()
    }
  }, [isOpen])

  const handleStartSocialPolling = (_provider: string, sessionId: string, loginUrl: string): void => {
    setError(null)
    if (mode === "login" || mode === "register") {
      setPreviousMode(mode)
    }
    setManualSocialCode("")
    setIsVerifyingCode(false)
    setSocialLoginUrl(loginUrl)

    setMode("social-polling")

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const res = await fetchSocialAuthStatus(sessionId)
        if (res && res.status === "authenticated" && res.token && res.user) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          if (onSocialAuthSuccess) {
            onSocialAuthSuccess({ token: res.token, user: res.user })
          }
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }, 1500)
  }

  const [username, setUsername] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", "", "", ""])
  const [resendCountdown, setResendCountdown] = useState<number>(0)

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const usernameInputRef = useRef<HTMLInputElement | null>(null)
  const resendTimer = useRef<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      setManualSocialCode("")
      const targetMode = initialMode === "login" ? "login" : "register"
      setMode(targetMode)
      setPreviousMode(targetMode)
      setError(null)
      setUsername("")
      setEmail("")
      setOtpCode(["", "", "", "", "", ""])
      setResendCountdown(0)
      if (resendTimer.current) {
        clearInterval(resendTimer.current)
      }
    }
  }, [isOpen, initialMode])

  useEffect(() => {
    return () => {
      if (resendTimer.current) {
        clearInterval(resendTimer.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  const startResendCountdown = (): void => {
    setResendCountdown(60)
    if (resendTimer.current) {
      clearInterval(resendTimer.current)
    }
    resendTimer.current = window.setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          if (resendTimer.current) clearInterval(resendTimer.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleEmailBlur = async (): Promise<void> => {
    if (mode !== "login") return
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.split("@")[1]?.includes(".")) return
    try {
      const exists = await checkAccountExists(trimmedEmail)
      if (!exists && mode === "login") {
        setMode("register")
        setPreviousMode("register")
        setError("No account found with this email. Please enter your full name to sign up.")
        setTimeout(() => usernameInputRef.current?.focus(), 100)
      }
    } catch {
      // Ignore background errors on blur
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setError("Please enter your email.")
      return
    }

    const currentMode: "register" | "login" = mode === "register" ? "register" : "login"

    setIsSubmitting(true)
    try {
      if (currentMode === "register") {
        if (!username.trim()) {
          setError("Please enter your full name.")
          setIsSubmitting(false)
          usernameInputRef.current?.focus()
          return
        }
        await onRegister({ username: username.trim(), email: trimmedEmail })
      } else {
        try {
          const exists = await checkAccountExists(trimmedEmail)
          if (!exists) {
            setMode("register")
            setPreviousMode("register")
            setError("No account found with this email. Please enter your full name to sign up.")
            setIsSubmitting(false)
            setTimeout(() => usernameInputRef.current?.focus(), 100)
            return
          }
        } catch {
          // If checkAccountExists throws network error, proceed to onLogin
        }
        await onLogin({ email: trimmedEmail })
      }
      setPreviousMode(currentMode)
      setOtpCode(["", "", "", "", "", ""])
      setMode("code-verify")
      startResendCountdown()
    } catch (err: any) {
      if (
        err.notFound ||
        err.message?.toLowerCase().includes("no account found") ||
        err.message?.toLowerCase().includes("sign up first")
      ) {
        setMode("register")
        setPreviousMode("register")
        setError("No account found with this email. Please enter your full name to sign up.")
        setTimeout(() => usernameInputRef.current?.focus(), 100)
      } else {
        setError(err.message || "Something went wrong. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtpSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    const code = otpCode.join("")
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.")
      return
    }
    setIsSubmitting(true)
    try {
      await onVerifySignup(email.trim().toLowerCase(), code)
    } catch (err: any) {
      setError(err.message || "Invalid or expired code.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async (): Promise<void> => {
    if (resendCountdown > 0) return
    setError(null)
    setIsSubmitting(true)
    try {
      const trimmedEmail = email.trim().toLowerCase()
      if (previousMode === "register" && username.trim()) {
        await onRegister({ username: username.trim(), email: trimmedEmail })
      } else {
        await onLogin({ email: trimmedEmail })
      }
      setOtpCode(["", "", "", "", "", ""])
      startResendCountdown()
    } catch (err: any) {
      setError(err.message || "Failed to resend code.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCodeChange = (idx: number, val: string): void => {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...otpCode]
    next[idx] = digit
    setOtpCode(next)
    if (digit && idx < 5) {
      codeInputRefs.current[idx + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
      codeInputRefs.current[idx - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent<HTMLDivElement>): void => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtpCode(pasted.split(""))
      codeInputRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  const isRegister = mode === "register"

  return (
    <div className="framefic-auth-overlay" onClick={onClose}>
      <div className="framefic-auth-panel" onClick={(e) => e.stopPropagation()}>
        {(mode === "login" || mode === "register") && (
          <>
            <div className="framefic-auth-header">
              <h3>{isRegister ? "Sign up to your account" : "Sign in to your account"}</h3>
              {!isRegister && (
                <p className="framefic-auth-header-sub">
                  Enter your email to receive a passwordless sign-in code
                </p>
              )}
            </div>

            <form className="framefic-auth-form" onSubmit={handleSubmit}>
              {isRegister && (
                <div className="framefic-auth-trial-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12l4 6-10 13L2 9z" />
                    <path d="M11 3 8 9l4 13 4-13-3-6" />
                    <path d="M2 9h20" />
                  </svg>
                  <span>7-day free trial! No card required</span>
                </div>
              )}

              <div className="framefic-auth-field">
                <label htmlFor="framefic-auth-email">Email address</label>
                <div className="framefic-auth-input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    type="email"
                    id="framefic-auth-email"
                    placeholder="your@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    autoComplete="email"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
              </div>

              {isRegister && (
                <div className="framefic-auth-field">
                  <label htmlFor="framefic-auth-username">Full name</label>
                  <div className="framefic-auth-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      ref={usernameInputRef}
                      type="text"
                      id="framefic-auth-username"
                      placeholder="John doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="name"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div
                  className={
                    error.toLowerCase().includes("no account found")
                      ? "framefic-auth-info"
                      : "framefic-auth-error"
                  }
                >
                  {error}
                </div>
              )}

              <button type="submit" className="primary-cta" disabled={isSubmitting}>
                {isSubmitting
                  ? isRegister
                    ? "Sending code..."
                    : "Sending sign-in code..."
                  : isRegister
                  ? "Start Free Trial"
                  : "Send Sign-in Code"}
              </button>
            </form>

            <div className="framefic-auth-divider">
              <span>or</span>
            </div>

            <div className="framefic-auth-social-row">
              <a
                href={googleLoginUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="framefic-auth-social-btn framefic-auth-social-btn--google"
                onClick={() => handleStartSocialPolling("google", googleSessionId, googleLoginUrl)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Continue with Google
              </a>
            </div>

            <div className="framefic-auth-footer">
              <p>
                {isRegister ? "Already have an account? " : "Don't have an account? "}
                <a
                  onClick={(e) => {
                    e.preventDefault()
                    setError(null)
                    setMode(isRegister ? "login" : "register")
                    setPreviousMode(isRegister ? "login" : "register")
                  }}
                >
                  {isRegister ? "Sign in" : "Sign up"}
                </a>
              </p>
            </div>
          </>
        )}

        {mode === "code-verify" && (
          <>
            <div className="framefic-auth-header">
              <div className="framefic-auth-fp-icon framefic-auth-fp-icon--code">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Check your email</h3>
              <p className="framefic-auth-header-sub">
                We sent a 6-digit verification code to <strong>{email}</strong>
              </p>
            </div>

            <form className="framefic-auth-form" onSubmit={handleVerifyOtpSubmit}>
              <div className="framefic-auth-otp-row" onPaste={handleCodePaste}>
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (codeInputRefs.current[idx] = el)}
                    className={`framefic-auth-otp-input${digit ? " framefic-auth-otp-input--filled" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                    disabled={isSubmitting}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {error && <div className="framefic-auth-error">{error}</div>}

              <button
                type="submit"
                className="primary-cta"
                disabled={isSubmitting || otpCode.join("").length < 6}
              >
                {isSubmitting ? "Verifying..." : "Verify & Sign in"}
              </button>
            </form>

            <div className="framefic-auth-footer">
              <p>
                Didn't receive it?{" "}
                {resendCountdown > 0 ? (
                  <span className="framefic-auth-resend-disabled">Resend in {resendCountdown}s</span>
                ) : (
                  <a
                    onClick={(e) => {
                      e.preventDefault()
                      void handleResendCode()
                    }}
                  >
                    Resend code
                  </a>
                )}
              </p>
              <p className="framefic-auth-footer-nav">
                <a
                  onClick={(e) => {
                    e.preventDefault()
                    setError(null)
                    setMode(previousMode)
                  }}
                >
                  ← {previousMode === "register" ? "Edit sign-up details" : "Change email"}
                </a>
              </p>
            </div>
          </>
        )}

        {mode === "social-polling" && (
          <>
            <div className="framefic-auth-header">
              <div className="framefic-auth-fp-icon framefic-auth-fp-icon--code">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3>Syncing with browser</h3>
              <p className="framefic-auth-header-sub">
                Please complete sign-in in the newly opened browser tab.
              </p>
            </div>

            <div className="framefic-auth-form framefic-auth-social-form">
              <div className="framefic-auth-spinner-wrap">
                <div className="framefic-social-spinner"></div>
              </div>

              <div className="framefic-auth-field framefic-auth-manual-group">
                <label htmlFor="connectfic-manual-code">Enter 6-digit verification code</label>
                <p className="framefic-auth-header-sub framefic-auth-manual-hint">
                  If the browser did not automatically sync, please enter the 6-digit code shown in the browser window:
                </p>
                <div className="framefic-auth-manual-row">
                  <input
                    type="text"
                    id="connectfic-manual-code"
                    maxLength={6}
                    placeholder="123456"
                    value={manualSocialCode}
                    onChange={(e) => setManualSocialCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="framefic-auth-manual-input"
                    disabled={isVerifyingCode}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyManualCode}
                    disabled={manualSocialCode.length < 6 || isVerifyingCode}
                    className="primary-cta framefic-auth-manual-btn"
                  >
                    {isVerifyingCode ? "..." : "Verify"}
                  </button>
                </div>
              </div>

              {error && <div className="framefic-auth-error framefic-auth-error-mt12">{error}</div>}
            </div>

            <div className="framefic-auth-footer">
              <p>
                <a href={socialLoginUrl || "#"} target="_blank" rel="noopener noreferrer">Re-open tab</a>
                {" | "}
                <a onClick={(e) => { e.preventDefault(); stopSocialPolling(); }}>Cancel</a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
