import { useState, useEffect, type FC } from "react"
import { Check } from "lucide-react"
import { PLAN_FEATURES } from "../constants"
import type { StripePlans, PaidPlan, PlanDiscountInfo } from "../services/paymentService"

export function formatDiscountBadge(discount?: PlanDiscountInfo | string | null): string {
  if (!discount) return ""
  const text = typeof discount === "string" ? discount : discount.formattedDiscount || ""
  return text
    .replace(/\bUSD\s*/gi, "$")
    .replace(/\bEUR\s*/gi, "€")
    .replace(/\bGBP\s*/gi, "£")
    .replace(/\bCAD\s*/gi, "CA$")
    .replace(/\bAUD\s*/gi, "AU$")
}

export type PaymentPlansProps = {
  isCreatingPayment: boolean
  payingPlan: string | null
  lifetimeAvailability: any
  onPay: (e: any, planKey: string, couponCode?: string | null) => void
  currentPlan: string | null
  plans?: StripePlans | null
}

export function PaymentPlansSkeleton() {
  return (
    <div className="framefic-plans-container beaf-plans-container beaf-plans-skeleton-wrapper" role="status" aria-label="Loading plans">
      <div className="beaf-skeleton-toggle-container">
        <div className="beaf-skeleton-toggle-pill" />
        <div className="beaf-skeleton-toggle-pill" />
      </div>

      <div className="framefic-plan-card beaf-plan-card beaf-skeleton-card">
        <div className="plan-header beaf-skeleton-header">
          <div className="beaf-skeleton-line beaf-skeleton-title" />
          <div className="beaf-skeleton-line beaf-skeleton-price" />
        </div>

        <div className="plan-features beaf-skeleton-features">
          <div className="beaf-skeleton-feature-item">
            <div className="beaf-skeleton-check" />
            <div className="beaf-skeleton-line beaf-skeleton-text-long" />
          </div>
          <div className="beaf-skeleton-feature-item">
            <div className="beaf-skeleton-check" />
            <div className="beaf-skeleton-line beaf-skeleton-text-medium" />
          </div>
          <div className="beaf-skeleton-feature-item">
            <div className="beaf-skeleton-check" />
            <div className="beaf-skeleton-line beaf-skeleton-text-long" />
          </div>
        </div>

        <div className="beaf-skeleton-btn" />
      </div>

      <div className="beaf-skeleton-divider">
        <div className="beaf-skeleton-line beaf-skeleton-divider-pill" />
      </div>

      <div className="framefic-plan-card beaf-plan-card lifetime beaf-skeleton-card">
        <div className="plan-header beaf-skeleton-header">
          <div className="beaf-skeleton-title-group">
            <div className="beaf-skeleton-line beaf-skeleton-title" />
            <div className="beaf-skeleton-line beaf-skeleton-badge" />
          </div>
          <div className="beaf-skeleton-line beaf-skeleton-price" />
        </div>

        <div className="plan-features beaf-skeleton-features">
          <div className="beaf-skeleton-feature-item">
            <div className="beaf-skeleton-check" />
            <div className="beaf-skeleton-line beaf-skeleton-text-short" />
          </div>
          <div className="beaf-skeleton-feature-item">
            <div className="beaf-skeleton-check" />
            <div className="beaf-skeleton-line beaf-skeleton-text-medium" />
          </div>
        </div>

        <div className="beaf-skeleton-btn" />
      </div>
    </div>
  )
}

export const PaymentPlans: FC<PaymentPlansProps> = ({
  isCreatingPayment,
  payingPlan,
  lifetimeAvailability,
  onPay,
  currentPlan,
  plans = null,
}) => {
  // Plan availability dynamically synced from backend
  const isMonthlyAvailable = plans ? Boolean(plans.monthly?.configured && plans.monthly.enabled !== false) : true
  const isYearlyAvailable = plans ? Boolean(plans.yearly?.configured && plans.yearly.enabled !== false) : true
  const isLifetimeAvailable = plans ? Boolean(plans.lifetime?.configured && plans.lifetime.enabled !== false) : true

  const hasRecurring = isMonthlyAvailable || isYearlyAvailable
  const hasLifetime = isLifetimeAvailable
  const showIntervalToggle = isMonthlyAvailable && isYearlyAvailable
  const showDivider = hasRecurring && hasLifetime

  const [activeInterval, setActiveInterval] = useState<"monthly" | "yearly">(() => {
    if (!isMonthlyAvailable && isYearlyAvailable) return "yearly"
    if (isMonthlyAvailable && !isYearlyAvailable) return "monthly"
    return currentPlan === "yearly" ? "yearly" : "monthly"
  })

  useEffect(() => {
    if (!isMonthlyAvailable && isYearlyAvailable) {
      setActiveInterval("yearly")
      return
    }
    if (isMonthlyAvailable && !isYearlyAvailable) {
      setActiveInterval("monthly")
      return
    }
    if (currentPlan === "yearly" && isYearlyAvailable) {
      setActiveInterval("yearly")
    } else if (currentPlan === "monthly" && isMonthlyAvailable) {
      setActiveInterval("monthly")
    }
  }, [currentPlan, isMonthlyAvailable, isYearlyAvailable])

  // If plans prop is explicitly null (still loading), show skeleton
  if (plans === null) {
    return <PaymentPlansSkeleton />
  }

  const monthlyPlan = {
    id: "monthly" as PaidPlan,
    name: "Monthly Pro",
    price: plans.monthly?.formattedPrice || "$4.99",
    features: PLAN_FEATURES,
  }

  const yearlyPlan = {
    id: "yearly" as PaidPlan,
    name: "Yearly Pro",
    price: plans.yearly?.formattedPrice || "$49.99",
    features: [
      ...PLAN_FEATURES,
      "Save 17% with annual commitment",
      "Priority feature requests",
    ],
  }

  const lifetimePlan = {
    id: "lifetime" as PaidPlan,
    name: "Lifetime Access",
    price: plans.lifetime?.formattedPrice || "$99.99",
    features: [
      "Pay once, chat forever",
      ...PLAN_FEATURES,
      "Lifetime updates for this project",
      "Direct founder support",
    ],
  }

  const resolvedInterval: "monthly" | "yearly" =
    (!isMonthlyAvailable && isYearlyAvailable)
      ? "yearly"
      : (isMonthlyAvailable && !isYearlyAvailable)
        ? "monthly"
        : activeInterval

  const subCard = resolvedInterval === "monthly" ? monthlyPlan : yearlyPlan
  const isSubProcessing = isCreatingPayment && payingPlan === subCard.id
  const isSubCurrentPlan = Boolean(currentPlan && subCard.id === currentPlan)
  const isSubDowngradeDisabled =
    (currentPlan === "yearly" && subCard.id === "monthly") ||
    (currentPlan === "lifetime" && subCard.id !== "lifetime")
  const isSubDisabled = !plans[subCard.id]?.configured || isCreatingPayment || isSubCurrentPlan || isSubDowngradeDisabled

  const isLtProcessing = isCreatingPayment && payingPlan === lifetimePlan.id
  const spotsRemaining =
    lifetimeAvailability?.remaining !== undefined
      ? lifetimeAvailability.remaining
      : lifetimeAvailability?.spotsLeft !== undefined
        ? lifetimeAvailability.spotsLeft
        : null
  const totalSpots = lifetimeAvailability?.total || lifetimeAvailability?.totalSpots || 20
  const isLtSoldOut = spotsRemaining === 0 || Boolean(lifetimeAvailability?.soldOut)
  const isLtCurrentPlan = Boolean(currentPlan && lifetimePlan.id === currentPlan)
  const isLtDowngradeDisabled = currentPlan === "lifetime" && lifetimePlan.id !== "lifetime"
  const isLtDisabled = !plans.lifetime?.configured || isCreatingPayment || isLtSoldOut || isLtCurrentPlan || isLtDowngradeDisabled

  const lifetimeDiscount = plans.lifetime?.discount || null

  return (
    <div className="framefic-plans-container beaf-plans-container">
      {/* Interval Toggle - only shown when both monthly and yearly are enabled */}
      {showIntervalToggle && (
        <div className="framefic-interval-toggle-container beaf-interval-toggle-container">
          <button
            type="button"
            className={`framefic-interval-btn beaf-interval-btn${resolvedInterval === "monthly" ? " active" : ""}`}
            onClick={() => setActiveInterval("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`framefic-interval-btn beaf-interval-btn${resolvedInterval === "yearly" ? " active" : ""}`}
            onClick={() => setActiveInterval("yearly")}
          >
            <span>Yearly</span>
            <span className="save-badge">Save 17%</span>
          </button>
        </div>
      )}

      {/* Subscription Card - rendered if monthly or yearly is available */}
      {hasRecurring && (
        <div className={`framefic-plan-card beaf-plan-card${isSubCurrentPlan ? " current" : ""}`}>
          <div className="plan-header">
            <span className="plan-name">
              {subCard.id === "monthly" ? "Monthly" : "Yearly"}
            </span>
            <div className={`plan-price${!plans[subCard.id]?.formattedPrice ? " is-unavailable" : ""}`}>
              {subCard.price}
              {plans[subCard.id]?.formattedPrice && (
                <span className="plan-suffix">/{subCard.id === "monthly" ? "mo" : "yr"}</span>
              )}
            </div>
          </div>

          <div className="plan-features">
            {subCard.features.map((feature) => (
              <div key={feature} className="feature-item">
                <Check className="checkmark" size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>{feature.replace(/\.$/, "")}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => !isSubDisabled && onPay(e, subCard.id)}
            disabled={isSubDisabled}
            className={`plan-action-btn primary-cta${isSubProcessing ? " loading" : ""}${isSubCurrentPlan ? " current" : ""}`}
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
      )}

      {/* Divider */}
      {showDivider && <div className="framefic-plans-divider beaf-plans-divider">or, pay once</div>}

      {/* Lifetime Card - rendered if lifetime plan is available */}
      {hasLifetime && (
        <div className={`framefic-plan-card beaf-plan-card lifetime${isLtCurrentPlan ? " current" : ""}`}>
          <div className="plan-header">
            <div className="lifetime-title-row">
              <span className="plan-name">Lifetime</span>
              {lifetimeDiscount ? (
                <span className="lifetime-auto-discount-badge">
                  {formatDiscountBadge(lifetimeDiscount)}
                </span>
              ) : (
                <span className="lifetime-save-badge">Best Deal</span>
              )}
            </div>
            <div className={`plan-price${!plans.lifetime?.formattedPrice ? " is-unavailable" : ""}`}>
              {lifetimeDiscount ? (
                <div className="plan-discounted-price-container">
                  <span className="plan-original-price-strikethrough">{lifetimePlan.price}</span>
                  <span className="plan-discounted-price">{lifetimeDiscount.discountedFormattedPrice}</span>
                </div>
              ) : (
                lifetimePlan.price
              )}
            </div>
          </div>

          <div className="plan-features">
            {lifetimePlan.features.map((feature) => (
              <div key={feature} className="feature-item">
                <Check className="checkmark" size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>{feature.replace(/\.$/, "")}</span>
              </div>
            ))}
            {spotsRemaining !== null && (
              <div className="feature-item spots-remaining">
                <Check className="checkmark" size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>
                  {isLtSoldOut
                    ? "All spots taken!"
                    : `${spotsRemaining}/${totalSpots} spots left`}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => !isLtDisabled && onPay(e, lifetimePlan.id, lifetimeDiscount?.code || null)}
            disabled={isLtDisabled}
            className={`plan-action-btn primary-cta${isLtProcessing ? " loading" : ""}${isLtCurrentPlan ? " current" : ""}`}
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
      )}

      {/* Empty State when no plans are enabled */}
      {!hasRecurring && !hasLifetime && (
        <div className="framefic-plans-empty">
          <p>Paid plans are currently unavailable. Please try again later.</p>
        </div>
      )}
    </div>
  )
}
