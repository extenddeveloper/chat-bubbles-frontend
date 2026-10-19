import { useState, useEffect } from "react"
import { PLANS, PLAN_FEATURES } from "../constants"

export type PaymentPlansProps = {
  isCreatingPayment: boolean
  payingPlan: string | null
  lifetimeAvailability: any
  onPay: (e: any, planKey: string) => void
  currentPlan: string | null
}

export function PaymentPlans({
  isCreatingPayment,
  payingPlan,
  lifetimeAvailability,
  onPay,
  currentPlan,
}: PaymentPlansProps) {
  const [activeInterval, setActiveInterval] = useState<"monthly" | "yearly">(
    currentPlan === "yearly" ? "yearly" : "monthly"
  )

  useEffect(() => {
    if (currentPlan === "yearly") {
      setActiveInterval("yearly")
    } else if (currentPlan === "monthly") {
      setActiveInterval("monthly")
    }
  }, [currentPlan])

  const subCard = activeInterval === "monthly" ? PLANS.monthly : PLANS.yearly
  const isSubProcessing = isCreatingPayment && payingPlan === subCard.key
  const isSubCurrentPlan = currentPlan && subCard.key === currentPlan
  const isSubDowngradeDisabled =
    (currentPlan === "yearly" && subCard.key === "monthly") ||
    (currentPlan === "lifetime" && subCard.key !== "lifetime")
  const isSubDisabled = isCreatingPayment || isSubCurrentPlan || isSubDowngradeDisabled

  const ltCard = PLANS.lifetime
  const isLtProcessing = isCreatingPayment && payingPlan === ltCard.key
  const isLtSoldOut = lifetimeAvailability?.soldOut
  const spotsRemaining = lifetimeAvailability ? lifetimeAvailability.remaining : null
  const isLtCurrentPlan = currentPlan && ltCard.key === currentPlan
  const isLtDowngradeDisabled = currentPlan === "lifetime" && ltCard.key !== "lifetime"
  const isLtDisabled = isCreatingPayment || isLtSoldOut || isLtCurrentPlan || isLtDowngradeDisabled

  return (
    <div className="framefic-plans-container">
      <div className="framefic-interval-toggle-container">
        <button
          type="button"
          className={`framefic-interval-btn ${activeInterval === "monthly" ? "active" : ""}`}
          onClick={() => setActiveInterval("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`framefic-interval-btn ${activeInterval === "yearly" ? "active" : ""}`}
          onClick={() => setActiveInterval("yearly")}
        >
          Yearly <span className="save-badge">Save 17%</span>
        </button>
      </div>

      <div className={`framefic-plan-card ${isSubCurrentPlan ? "current" : ""}`}>
        <div className="plan-header">
          <span className="plan-name">{activeInterval === "monthly" ? "Monthly" : "Yearly"}</span>
          <span className="plan-price">
            {activeInterval === "monthly" ? "$4.99" : "$49.99"}
            <span className="plan-suffix">{activeInterval === "monthly" ? "/m" : "/yr"}</span>
          </span>
        </div>

        <div className="plan-features">
          {PLAN_FEATURES.map((feature) => (
            <div key={feature} className="feature-item">
              <svg
                className="checkmark"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{feature.replace(/\.$/, "")}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => !isSubDisabled && onPay(e, subCard.key)}
          disabled={isSubDisabled}
          className={`plan-action-btn ${isSubProcessing ? "loading" : ""} ${isSubCurrentPlan ? "current" : ""}`}
        >
          {isSubCurrentPlan
            ? "Current Plan"
            : isSubDowngradeDisabled
            ? "Not Available"
            : isSubProcessing
            ? "Loading..."
            : "Upgrade Subscription"}
        </button>
      </div>

      <div className="framefic-plans-divider">or, pay once</div>

      <div className={`framefic-plan-card lifetime ${isLtCurrentPlan ? "current" : ""}`}>
        <div className="plan-header">
          <div className="lifetime-title-row">
            <span className="plan-name">Lifetime</span>
            <span className="lifetime-save-badge">Best Deal</span>
          </div>
          <span className="plan-price">$99.99</span>
        </div>

        <div className="plan-features">
          {PLAN_FEATURES.map((feature) => (
            <div key={feature} className="feature-item">
              <svg
                className="checkmark"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{feature.replace(/\.$/, "")}</span>
            </div>
          ))}
          {spotsRemaining !== null && (
            <div className="feature-item spots-remaining">
              <svg
                className="checkmark"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                {isLtSoldOut ? "All spots taken!" : `${spotsRemaining}/${lifetimeAvailability?.total || 100} spots left`}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => !isLtDisabled && onPay(e, ltCard.key)}
          disabled={isLtDisabled}
          className={`plan-action-btn ${isLtProcessing ? "loading" : ""} ${isLtCurrentPlan ? "current" : ""}`}
        >
          {isLtCurrentPlan
            ? "Current Plan"
            : isLtDowngradeDisabled
            ? "Not Available"
            : isLtSoldOut
            ? "Sold Out"
            : isLtProcessing
            ? "Loading..."
            : "Get Lifetime Access"}
        </button>
      </div>
    </div>
  )
}
