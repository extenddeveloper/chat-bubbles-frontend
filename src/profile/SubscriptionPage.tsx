import "./SubscriptionPage.css"
import { useState, useEffect } from "react"
import { getSiteInfo } from "../lib/framer/project"
import { PaymentPlans } from "../features/payment/components/PaymentPlans"
import {
  cancelSubscription,
  createBillingPortalSession,
  changeSubscriptionPlan,
} from "../features/payment/services/paymentService"

export type SubscriptionPageProps = {
  onClose: () => void
  hasSubscription: boolean
  planDetails: any
  isCreatingPayment: boolean
  payingPlan: string | null
  lifetimeAvailability: any
  onPay: (e: any, planKey: string) => void
  onRefreshSubscription: () => Promise<boolean>
  notify: (payload: { type: "Success" | "Error"; message: string }) => void | Promise<void>
  defaultShowPlans?: number
}

export function SubscriptionPage({
  onClose,
  hasSubscription,
  planDetails,
  isCreatingPayment,
  payingPlan,
  lifetimeAvailability,
  onPay,
  onRefreshSubscription,
  notify,
  defaultShowPlans = 0,
}: SubscriptionPageProps) {
  const [isLoadingBillingPortal, setIsLoadingBillingPortal] = useState<boolean>(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState<boolean>(false)
  const [isChangingPlan, setIsChangingPlan] = useState<boolean>(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingPortalUrl, setBillingPortalUrl] = useState<string | null>(null)
  const [showPlans, setShowPlans] = useState<boolean>(defaultShowPlans > 0)
  const [upgradePreviewPlan, setUpgradePreviewPlan] = useState<string | null>(null)
  const [activeCancelStep, setActiveCancelStep] = useState<number | null>(null)
  const [cancelFeedback, setCancelFeedback] = useState<string>("")

  useEffect(() => {
    if (defaultShowPlans > 0) {
      setShowPlans(true)
    }
  }, [defaultShowPlans])

  const handleBack = (): void => {
    if (hasSubscription && showPlans) {
      setShowPlans(false)
    } else {
      onClose()
    }
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
        return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "-"
    }
  }

  const getStatus = (status: string | null | undefined): string => {
    if (!status) return ""
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (dateVal: any): string => {
    if (!dateVal) return "-"
    let date: Date
    if (typeof dateVal === "number") {
      date = new Date(dateVal > 1e11 ? dateVal : dateVal * 1000)
    } else if (typeof dateVal === "string" && !isNaN(Number(dateVal)) && dateVal.trim() !== "") {
      const num = Number(dateVal)
      date = new Date(num > 1e11 ? num : num * 1000)
    } else {
      date = new Date(dateVal)
    }
    if (isNaN(date.getTime())) return String(dateVal)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const isAutoRenew = (plan: string | null | undefined, status: string | null | undefined): string => {
    if (planDetails?.isTrial) return "No"
    if (plan === "lifetime") return "Never"
    if (status === "Scheduled to cancel" || status === "canceled" || status === "cancelled") return "No"
    if (status === "active" || status === "paid" || status === "trialing") return "Automatically"
    return "No"
  }

  const handleManageBilling = async (): Promise<void> => {
    try {
      setIsLoadingBillingPortal(true)
      setBillingError(null)
      setBillingPortalUrl(null)
      const siteInfo = await getSiteInfo()

      const data = await createBillingPortalSession(siteInfo.siteId)
      const newWindow = window.open(data.url, "_blank", "noopener,noreferrer")
      if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        setBillingPortalUrl(data.url)
      }
    } catch (error: any) {
      console.error("Error loading billing portal:", error)
      setBillingError(error.message || "Failed to open billing portal. Please try again.")
    } finally {
      setIsLoadingBillingPortal(false)
    }
  }

  const handleCancelSubscription = async (feedback: string | null = null): Promise<void> => {
    try {
      setIsCancellingSubscription(true)
      setBillingError(null)
      const siteInfo = await getSiteInfo()
      const result = await cancelSubscription(siteInfo.siteId, feedback)
      await onRefreshSubscription?.()
      void notify?.({
        type: "Success",
        message: result.currentPeriodEnd
          ? `Subscription will end on ${formatDate(result.currentPeriodEnd)}.`
          : "Subscription cancellation scheduled.",
      })
    } catch (error: any) {
      console.error("Error cancelling subscription:", error)
      setBillingError(error.message || "Failed to cancel subscription. Please try again.")
      void notify?.({
        type: "Error",
        message: error.message || "Failed to cancel subscription.",
      })
    } finally {
      setIsCancellingSubscription(false)
    }
  }

  const handleChangePlan = async (targetPlan: string): Promise<void> => {
    try {
      setIsChangingPlan(true)
      setBillingError(null)
      const siteInfo = await getSiteInfo()
      const result = await changeSubscriptionPlan(siteInfo.siteId, targetPlan)
      await onRefreshSubscription?.()
      void notify?.({
        type: "Success",
        message: result.message || `Plan changed to ${getPlanName(result.plan)}.`,
      })
    } catch (error: any) {
      console.error("Error changing subscription plan:", error)
      setBillingError(error.message || "Failed to change plan. Please try again.")
      void notify?.({
        type: "Error",
        message: error.message || "Failed to change plan.",
      })
    } finally {
      setIsChangingPlan(false)
    }
  }

  const currentPlan = planDetails?.plan
  const isAnyActionLoading = isLoadingBillingPortal || isCancellingSubscription || isChangingPlan

  return (
    <div className="framefic-subscription-page">
      <button type="button" className="framefic-subpage-back-button-wide" onClick={handleBack} aria-label="Back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Back</span>
      </button>

      <h3 className="framefic-subpage-title-left">Manage Subscription</h3>

      <div className="framefic-subscription-content">
        {!hasSubscription || showPlans ? (
          <PaymentPlans
            isCreatingPayment={isCreatingPayment}
            payingPlan={payingPlan}
            lifetimeAvailability={lifetimeAvailability}
            onPay={(e, planKey) => {
              if (hasSubscription && !planDetails?.isTrial && (planKey === "monthly" || planKey === "yearly" || planKey === "lifetime")) {
                setUpgradePreviewPlan(planKey)
              } else {
                onPay(e, planKey)
              }
            }}
            currentPlan={currentPlan}
          />
        ) : (
          <>
            <div className="framefic-subscription-card">
              <div className="framefic-subscription-detail-item">
                <span className="framefic-subscription-label">PLAN</span>
                <span className="framefic-subscription-value">{getPlanName(planDetails?.plan)}</span>
              </div>
              <div className="framefic-subscription-divider" />

              <div className="framefic-subscription-detail-item">
                <span className="framefic-subscription-label">STATUS</span>
                <span className="framefic-subscription-status">{getStatus(planDetails?.status)}</span>
              </div>
              <div className="framefic-subscription-divider" />

              <div className="framefic-subscription-detail-item">
                <span className="framefic-subscription-label">PURCHASE DATE</span>
                <span className="framefic-subscription-value">{formatDate(planDetails?.since)}</span>
              </div>
              <div className="framefic-subscription-divider" />

              <div className="framefic-subscription-detail-item">
                <span className="framefic-subscription-label">END DATE</span>
                <span className="framefic-subscription-value">{planDetails?.plan === "lifetime" ? "Never" : formatDate(planDetails?.expiresAt || planDetails?.trialEndsAt)}</span>
              </div>
              <div className="framefic-subscription-divider" />

              <div className="framefic-subscription-detail-item">
                <span className="framefic-subscription-label">RENEWS</span>
                <span className="framefic-subscription-value">{isAutoRenew(planDetails?.plan, planDetails?.status)}</span>
              </div>
            </div>
            {billingError && (
              <div className="billing-error-box">
                {billingError}
              </div>
            )}
            {planDetails?.isTrial ? (
              <div className="framefic-subscription-actions">
                <button
                  type="button"
                  className="primary-cta cancel-btn-full"
                  onClick={() => setShowPlans(true)}
                >
                  Upgrade to Pro Plan
                </button>
              </div>
            ) : (
              planDetails?.plan !== "lifetime" && (
                <div className="framefic-subscription-actions">
                  <button
                    type="button"
                    className="framefic-subscription-secondary-btn"
                    onClick={handleManageBilling}
                    disabled={isAnyActionLoading}
                  >
                    {isLoadingBillingPortal ? "Loading..." : "Manage Billing"}
                  </button>
                  <button
                    type="button"
                    className="framefic-subscription-cancel-btn"
                    onClick={() => setActiveCancelStep(1)}
                    disabled={isAnyActionLoading}
                  >
                    Cancel Subscription
                  </button>

                  <button
                    type="button"
                    className="framefic-subscription-upgrade-btn"
                    onClick={() => setShowPlans(true)}
                    disabled={isAnyActionLoading}
                  >
                    Upgrade Plan
                  </button>

                  {billingPortalUrl && (
                    <div className="billing-portal-blocked">
                      Pop-up was blocked. <a href={billingPortalUrl} target="_blank" rel="noopener noreferrer" className="billing-portal-link" onClick={() => setBillingPortalUrl(null)}>Click here to open billing portal</a>
                    </div>
                  )}
                </div>
              )
            )}
          </>
        )}
      </div>

      {upgradePreviewPlan && (
        <div className="payment-modal">
          <div className="payment-box payment-box-pad20">
            <h3>Confirm Plan Change</h3>
            <p>
              You are about to switch to the <strong>{getPlanName(upgradePreviewPlan)}</strong> plan.
              <br /><br />
              {upgradePreviewPlan === "yearly"
                ? "Your unused monthly time will be credited, and you'll be billed the prorated yearly amount today."
                : upgradePreviewPlan === "lifetime"
                ? "Your unused subscription time will be calculated as a discount, and you'll be billed the prorated lifetime amount today."
                : "Your unused yearly time will be credited to your account, and you will be switched to monthly immediately."}
            </p>
            <div className="plan-change-btn-row">
              <button
                type="button"
                onClick={() => setUpgradePreviewPlan(null)}
                className="secondary-cta plan-change-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (upgradePreviewPlan === "lifetime") {
                    setUpgradePreviewPlan(null)
                    setShowPlans(false)
                    onPay(null, "lifetime")
                  } else {
                    await handleChangePlan(upgradePreviewPlan)
                    setUpgradePreviewPlan(null)
                    setShowPlans(false)
                  }
                }}
                disabled={isChangingPlan}
                className="primary-cta plan-change-btn"
              >
                {isChangingPlan ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCancelStep && (
        <div className="payment-modal">
          <div className="payment-box payment-box-cancel">
            {activeCancelStep === 1 && (
              <div className="cancel-step-content">
                <h3 className="cancel-title">We're sorry to see you go</h3>
                <p className="cancel-intro">Mind telling us why? It helps us improve.</p>

                <div className="cancel-options">
                  {[
                    "It's too expensive",
                    "I'm not using it enough",
                    "Missing a feature I need",
                    "Switching to another tool",
                    "Other"
                  ].map((option) => (
                    <label key={option} className="cancel-option-label">
                      <input
                        type="radio"
                        name="cancelReason"
                        value={option}
                        checked={cancelFeedback === option}
                        onChange={(e) => setCancelFeedback(e.target.value)}
                        className="cancel-radio-input"
                      />
                      <span className={`cancel-radio-custom ${cancelFeedback === option ? "checked" : ""}`}>
                        {cancelFeedback === option && <span className="cancel-radio-dot" />}
                      </span>
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                <div className="cancel-actions-row">
                  <button
                    type="button"
                    className="primary-cta cancel-btn-full"
                    disabled={!cancelFeedback}
                    onClick={() => setActiveCancelStep(2)}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    className="cancel-skip-btn"
                    onClick={() => {
                      setCancelFeedback("Skipped")
                      setActiveCancelStep(2)
                    }}
                  >
                    Skip and cancel anyway
                  </button>
                </div>
              </div>
            )}

            {activeCancelStep === 2 && (
              <div className="cancel-step-content">
                <h3 className="cancel-title">Confirm cancellation</h3>
                <p className="cancel-intro">
                  You'll keep full access until your billing period ends on{" "}
                  <strong>{formatDate(planDetails?.expiresAt || planDetails?.trialEndsAt)}</strong>. After that:
                </p>

                <div className="cancel-warnings">
                  {[
                    "Your saved chat bubbles will be paused",
                    "No more priority support",
                    "Multi-agent routing turned off"
                  ].map((warn) => (
                    <div key={warn} className="cancel-warning-item">
                      <span className="cancel-warning-icon">✕</span>
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>

                <div className="cancel-actions-row-mt8">
                  <button
                    type="button"
                    className="primary-cta cancel-btn-full"
                    onClick={() => {
                      setActiveCancelStep(null)
                      setCancelFeedback("")
                    }}
                  >
                    Keep My Plan
                  </button>
                  <button
                    type="button"
                    className="framefic-subscription-cancel-btn cancel-btn-full"
                    disabled={isCancellingSubscription}
                    onClick={async () => {
                      await handleCancelSubscription(cancelFeedback)
                      setActiveCancelStep(3)
                    }}
                  >
                    {isCancellingSubscription ? "Cancelling..." : "Cancel My Subscription"}
                  </button>
                </div>
              </div>
            )}

            {activeCancelStep === 3 && (
              <div className="cancel-step-center">
                <div className="cancel-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                </div>
                <h3 className="cancel-title">Subscription canceled</h3>
                <p className="cancel-intro">
                  You'll have full access until{" "}
                  <strong>{formatDate(planDetails?.expiresAt || planDetails?.trialEndsAt)}</strong>. We'd love to have you back anytime.
                </p>

                <div className="cancel-actions-row-mt8">
                  <button
                    type="button"
                    className="primary-cta cancel-btn-h38"
                    onClick={async () => {
                      await onRefreshSubscription?.()
                      setActiveCancelStep(null)
                      setCancelFeedback("")
                    }}
                  >
                    Go to Dashboard
                  </button>
                  <span className="cancel-resubscribe-text">
                    Changed your mind? Resubscribe anytime
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default SubscriptionPage
