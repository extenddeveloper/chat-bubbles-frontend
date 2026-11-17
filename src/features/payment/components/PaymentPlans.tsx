import "./PaymentLoading.css"
import { useState, useEffect, type FC } from "react"
import { Check } from "lucide-react"
import { PLAN_FEATURES } from "../constants"
import { usePlanAvailability } from "../hooks/usePlanAvailability"
import type { StripePlans, PlanDiscountInfo } from "../services/paymentService"

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

export function PricingSkeleton() {
  return (
    <div
      className="framefic-plans-container pricing-skeleton beaf-plans-container beaf-plans-skeleton-wrapper"
      role="status"
      aria-label="Loading plans and pricing"
      aria-busy="true"
    >
      <div className="pricing-skeleton-toggle beaf-skeleton-toggle-container">
        <div className="beaf-skeleton-toggle-pill" />
        <div className="beaf-skeleton-toggle-pill" />
      </div>
      {[0, 1].map((index) => (
        <div
          key={index}
          className="framefic-plan-card beaf-plan-card pricing-skeleton-card beaf-skeleton-card"
          aria-hidden="true"
        >
          <div className="plan-header beaf-skeleton-header">
            <span className="pricing-skeleton-title beaf-skeleton-line beaf-skeleton-title" />
            <span className="pricing-skeleton-price beaf-skeleton-line beaf-skeleton-price" />
          </div>
          <div className="plan-features beaf-skeleton-features">
            {[0, 1, 2, 3].map((row) => (
              <span key={row} className="pricing-skeleton-line beaf-skeleton-line beaf-skeleton-text-long" />
            ))}
          </div>
          <span className="pricing-skeleton-button beaf-skeleton-btn" />
        </div>
      ))}
    </div>
  )
}
export const PaymentPlansSkeleton = PricingSkeleton

export type PaymentPlansProps = {
  isCreatingPayment: boolean
  payingPlan: string | null
  lifetimeAvailability: any
  onPay: (e: any, planKey: string, couponCode?: string | null) => void
  currentPlan: string | null
  plans?: StripePlans | null
}

export const PaymentPlans: FC<PaymentPlansProps> = ({
  isCreatingPayment,
  payingPlan,
  lifetimeAvailability,
  onPay,
  currentPlan,
  plans: propPlans = null,
}) => {
  const { enabled, plans, error, retry } = usePlanAvailability(propPlans)
  const [preferredInterval, setActiveInterval] = useState<"monthly" | "yearly">(
    currentPlan === "yearly" ? "yearly" : "monthly"
  )

  useEffect(() => {
    if (currentPlan === "yearly") {
      setActiveInterval("yearly")
    } else if (currentPlan === "monthly") {
      setActiveInterval("monthly")
    }
  }, [currentPlan])

  if (!enabled || !plans) {
    return error ? (
      <div role="alert" className="framefic-plans-empty">
        <p>{error}</p>
        <button type="button" className="plan-action-btn primary-cta" onClick={retry}>
          Retry
        </button>
      </div>
    ) : (
      <PricingSkeleton />
    )
  }

  const activeInterval = enabled[preferredInterval] ? preferredInterval : enabled.monthly ? "monthly" : "yearly"
  const savings =
    enabled.monthly && enabled.yearly && plans.monthly?.currency === plans.yearly?.currency && (plans.monthly?.amount || 0) > 0
      ? Math.round((1 - (plans.yearly?.amount || 0) / ((plans.monthly?.amount || 0) * 12)) * 100)
      : 17

  // Active subscription card details
  const subCard = activeInterval === "monthly" ? plans.monthly : plans.yearly
  const isSubProcessing = isCreatingPayment && payingPlan === subCard?.key
  const isSubCurrentPlan = Boolean(currentPlan && subCard?.key === currentPlan)
  const isSubDowngradeDisabled =
    (currentPlan === "yearly" && subCard?.key === "monthly") ||
    (currentPlan === "lifetime" && subCard?.key !== "lifetime")
  const isSubDisabled = isCreatingPayment || isSubCurrentPlan || isSubDowngradeDisabled

  const availability = plans.lifetime?.lifetimeAvailability ?? lifetimeAvailability
  const ltCard = plans.lifetime
  const isLtProcessing = isCreatingPayment && payingPlan === ltCard?.key
  const isLtSoldOut = Boolean(availability?.soldOut)
  const spotsRemaining =
    availability?.remaining !== undefined
      ? availability.remaining
      : availability?.spotsLeft !== undefined
        ? availability.spotsLeft
        : null
  const totalSpots = availability?.total || availability?.totalSpots || 20
  const isLtCurrentPlan = Boolean(currentPlan && ltCard?.key === currentPlan)
  const isLtDowngradeDisabled = currentPlan === "lifetime" && ltCard?.key !== "lifetime"
  const isLtDisabled = isCreatingPayment || isLtSoldOut || isLtCurrentPlan || isLtDowngradeDisabled

  const lifetimeDiscount = ltCard?.discount || null
  const lifetimeDiscountBadge =
    formatDiscountBadge(lifetimeDiscount) || (ltCard?.formattedDiscountedPrice ? "60% OFF" : "Best Deal")

  return (
    <div className="framefic-plans-container beaf-plans-container">
      {!enabled.monthly && !enabled.yearly && !enabled.lifetime && (
        <div className="framefic-plans-empty" role="status">
          <p>Paid plans are currently unavailable. Please try again later.</p>
        </div>
      )}

      {/* Lifetime Card (Crestbar layout: Lifetime first as hero offer) */}
      {enabled.lifetime && ltCard && (
        <div className={`framefic-plan-card beaf-plan-card lifetime${isLtCurrentPlan ? " current" : ""}`}>
          <div className="plan-header">
            <div className="lifetime-title-row">
              <span className="plan-name">Lifetime</span>
              <span className={lifetimeDiscount ? "lifetime-auto-discount-badge" : "lifetime-save-badge"}>
                {lifetimeDiscountBadge}
              </span>
            </div>
            <div className="plan-price">
              {ltCard.formattedDiscountedPrice ? (
                <div className="plan-discounted-price-container">
                  <del className="plan-original-price plan-original-price-strikethrough">{ltCard.formattedPrice}</del>
                  <span className="plan-discounted-price">{ltCard.formattedDiscountedPrice}</span>
                </div>
              ) : (
                ltCard.formattedPrice
              )}
            </div>
          </div>

          <div className="plan-features">
            {PLAN_FEATURES.map((feature) => (
              <div key={feature} className="feature-item">
                <Check className="checkmark" size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>{feature.replace(/\.$/, "")}</span>
              </div>
            ))}
            {spotsRemaining !== null && (
              <div className="feature-item spots-remaining">
                <Check className="checkmark" size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>
                  {isLtSoldOut ? "All spots taken!" : `${spotsRemaining}/${totalSpots} spots left`}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) =>
              !isLtDisabled && onPay(e, ltCard.key, ltCard.defaultCouponCode || ltCard.discount?.code || null)
            }
            disabled={isLtDisabled}
            aria-busy={isLtProcessing}
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

      {/* Divider */}
      {enabled.lifetime && (enabled.monthly || enabled.yearly) && (
        <div className="framefic-plans-divider beaf-plans-divider">or, subscribe recurring</div>
      )}

      {/* Interval Toggle - only shown when both monthly and yearly are enabled */}
      {enabled.monthly && enabled.yearly && (
        <div className="framefic-interval-toggle-container beaf-interval-toggle-container">
          <button
            type="button"
            className={`framefic-interval-btn beaf-interval-btn${activeInterval === "monthly" ? " active" : ""}`}
            onClick={() => setActiveInterval("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`framefic-interval-btn beaf-interval-btn${activeInterval === "yearly" ? " active" : ""}`}
            onClick={() => setActiveInterval("yearly")}
          >
            <span>Yearly</span>
            <span className="save-badge">Save {savings}%</span>
          </button>
        </div>
      )}

      {/* Subscription Card - rendered if monthly or yearly is available */}
      {(enabled.monthly || enabled.yearly) && subCard && (
        <div className={`framefic-plan-card beaf-plan-card${isSubCurrentPlan ? " current" : ""}`}>
          <div className="plan-header">
            <span className="plan-name">{activeInterval === "monthly" ? "Monthly" : "Yearly"}</span>
            <div className="plan-price">
              {subCard.formattedDiscountedPrice && (
                <del className="plan-original-price plan-original-price-strikethrough">{subCard.formattedPrice}</del>
              )}
              {subCard.formattedDiscountedPrice || subCard.formattedPrice}
              <span className="plan-suffix">{activeInterval === "monthly" ? "/mo" : "/yr"}</span>
            </div>
          </div>

          <div className="plan-features">
            {PLAN_FEATURES.map((feature) => (
              <div key={feature} className="feature-item">
                <Check className="checkmark" size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>{feature.replace(/\.$/, "")}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) =>
              !isSubDisabled && onPay(e, subCard.key, subCard.defaultCouponCode || subCard.discount?.code || null)
            }
            disabled={isSubDisabled}
            aria-busy={isSubProcessing}
            className={`plan-action-btn subscription-action-btn${isSubProcessing ? " loading" : ""}${isSubCurrentPlan ? " current" : ""}`}
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
    </div>
  )
}
