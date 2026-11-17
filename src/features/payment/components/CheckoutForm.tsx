import "./PaymentLoading.css"
import React, { useState, useEffect, useRef } from "react"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { LockKeyhole } from "lucide-react"
import { verifyPayment, applyCouponToSubscription } from "../services/paymentService"
import { getSiteInfo } from "../../../lib/framer/project"

export type CheckoutDraft = {
  email: string
  couponCode: string
  appliedCode: string
  originalAmount: number
  subscriptionId: string | null
}

export type CheckoutFormProps = {
  draft: CheckoutDraft
  setDraft: React.Dispatch<React.SetStateAction<CheckoutDraft>>
  onClose: () => void
  onSuccess: (id: string) => void | Promise<void>
  notify: (payload: { type: "Success" | "Error"; message: string }) => void | Promise<void>
  plan: string | null
  defaultEmail?: string | null
  subscriptionId?: string | null
  clientSecret?: string | null
  setClientSecret: (secret: string | null) => void
  setShowAmount: (amount: number | null) => void
  showCurrency?: string
  showAmount: number | null
  showType: string | null
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return "Payment failed"
}

export function CheckoutForm({
  draft,
  setDraft,
  onClose,
  onSuccess,
  notify,
  plan,
  clientSecret,
  setClientSecret,
  setShowAmount,
  showAmount,
  showCurrency = "usd",
  showType,
}: CheckoutFormProps) {
  const [paymentReady, setPaymentReady] = useState(false)
  const [paymentLoadError, setPaymentLoadError] = useState("")
  useEffect(() => {
    if (paymentReady || paymentLoadError) return
    const timer = setTimeout(
      () => setPaymentLoadError("Payment fields could not load. Close checkout and try again."),
      20000
    )
    return () => clearTimeout(timer)
  }, [paymentReady, paymentLoadError])

  const stripe = useStripe()
  const elements = useElements()
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false)
  const { email, couponCode, appliedCode, originalAmount: initialAmount, subscriptionId } = draft
  const busy = useRef(false)
  const [showEmailError, setShowEmailError] = useState<boolean>(false)

  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false)
  const [couponError, setCouponError] = useState<string>("")
  const money = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: showCurrency }).format(amount)
  const divisor =
    10 **
    (new Intl.NumberFormat("en", { style: "currency", currency: showCurrency }).resolvedOptions()
      .maximumFractionDigits ?? 2)
  const currentAmount = showAmount ?? initialAmount
  const discountAmount = Math.max(0, initialAmount - currentAmount)
  const couponApplied = Boolean(appliedCode) && couponCode.trim() === appliedCode && !couponError

  useEffect(() => {
    if (showEmailError) {
      const timer = setTimeout(() => {
        setShowEmailError(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [showEmailError])

  const planLabel =
    plan === "monthly"
      ? "Billed monthly"
      : plan === "yearly"
      ? "Billed yearly"
      : plan === "lifetime"
      ? "Lifetime access · one-time payment"
      : showType || "Pro Plan"

  const handleApplyCoupon = async (): Promise<void> => {
    const trimmed = couponCode.trim()
    if (!trimmed || busy.current || (trimmed === appliedCode && !couponError)) return

    busy.current = true
    setIsApplyingCoupon(true)
    setCouponError("")

    try {
      const piId = clientSecret ? clientSecret.split("_secret_")[0] : null
      const targetSubId = plan === "lifetime" ? piId : subscriptionId || piId
      if (!targetSubId) {
        setCouponError("Cannot apply coupon to this payment session.")
        return
      }

      const result = await applyCouponToSubscription(targetSubId, trimmed, piId)
      const originalAmount =
        typeof result?.originalAmount === "number" ? result.originalAmount / divisor : initialAmount
      if (
        result?.success === false ||
        typeof result?.discountedAmount !== "number" ||
        !Number.isFinite(result.discountedAmount) ||
        result.discountedAmount < 0 ||
        result.discountedAmount / divisor >= originalAmount
      ) {
        throw new Error("This coupon is not valid for the selected plan. Please try another code.")
      }
      const activatesAccess =
        result.isPaid === true ||
        result.status === "paid" ||
        result.status === "active" ||
        result.status === "trialing"

      if (!activatesAccess && !result.clientSecret) {
        throw new Error("Unable to apply this coupon. Please try again.")
      }
      if (!activatesAccess && result.clientSecret === clientSecret && elements) {
        const { error } = await elements.fetchUpdates()
        if (error) throw new Error(error.message)
      }

      setShowAmount(result.discountedAmount / divisor)
      setDraft((previous) => ({
        ...previous,
        appliedCode: trimmed,
        originalAmount:
          typeof result.originalAmount === "number" ? result.originalAmount / divisor : previous.originalAmount,
        subscriptionId: result.subscriptionId || targetSubId,
      }))

      if (activatesAccess) {
        void notify({
          type: "Success",
          message:
            plan === "lifetime"
              ? "Coupon applied! Lifetime access is now active."
              : "Coupon applied! Subscription is now active.",
        })
        await onSuccess(result.subscriptionId || targetSubId)
        onClose()
        return
      }

      if (result.clientSecret && result.clientSecret !== clientSecret) {
        setClientSecret(result.clientSecret)
      }

      void notify({ type: "Success", message: "Coupon applied successfully!" })
    } catch (err: any) {
      setCouponError(
        /prior transactions|first.time/i.test(err.message || "")
          ? "This coupon is not valid for this account. It is limited to first-time customers; previous trials or payment attempts can affect eligibility."
          : err.message || "Invalid or expired coupon code. Please try another code."
      )
    } finally {
      busy.current = false
      setIsApplyingCoupon(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!stripe || !elements || busy.current) return

    if (!email) {
      setShowEmailError(true)
      return
    }

    busy.current = true
    setIsSubmittingPayment(true)
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email,
          payment_method_data: {
            billing_details: {
              email: email,
            },
          },
        },
        redirect: "if_required",
      })

      if (error) {
        void notify({
          type: "Error",
          message: error.message || "Payment failed",
        })
        return
      }

      if (paymentIntent?.status === "succeeded") {
        try {
          const siteInfo = await getSiteInfo()
          await verifyPayment({
            paymentIntentId: paymentIntent.id,
            siteId: siteInfo.siteId,
            email: email,
            plan: plan || "lifetime",
            subscriptionId: plan === "lifetime" ? null : subscriptionId || null,
          })
        } catch (verifyErr) {
          console.error("Backend verification error (non-blocking):", verifyErr)
        }

        void notify({
          type: "Success",
          message: "Your Payment Has Been Successful!",
        })

        await onSuccess(paymentIntent.id)
        onClose()
      }
    } catch (error) {
      void notify({
        type: "Error",
        message: getErrorMessage(error),
      })
    } finally {
      busy.current = false
      setIsSubmittingPayment(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="crestbar-card-form payment-form" translate="no">
      {/* ── Summary Card (Connectfic Style) ── */}
      <div className="crestbar-payment-summary">
        <h1 id="crestbar-payment-title">Complete payment</h1>
        <span className="crestbar-checkout-plan">{planLabel}</span>
        <div className="crestbar-checkout-total" aria-live="polite">
          {initialAmount > currentAmount && (
            <del className="checkout-original-price">{money(initialAmount)}</del>
          )}
          <strong>{money(currentAmount)}</strong>
          {plan === "monthly" && <span>/ month</span>}
          {plan === "yearly" && <span>/ year</span>}
        </div>
        {discountAmount > 0 && (
          <div>
            <div className="crestbar-checkout-breakdown">
              <span>Subtotal</span>
              <span>{money(initialAmount)}</span>
            </div>
            <div className="crestbar-checkout-discount">
              <span>Coupon discount ({appliedCode})</span>
              <span>−{money(discountAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Email Field ── */}
      <div className="framefic-email-wrapper">
        <label className="framefic-email-label" htmlFor="crestbar-payment-email">
          Email
        </label>
        <input
          id="crestbar-payment-email"
          type="email"
          autoComplete="email"
          className="framefic-email-input-field"
          value={email}
          onChange={(e) => {
            const val = e.target.value
            setDraft((previous) => ({ ...previous, email: val }))
          }}
          placeholder="email@example.com"
          disabled={isSubmittingPayment}
          required
        />
      </div>

      {/* ── Coupon Code Apply Section (Always Visible) ── */}
      <div className="framefic-coupon-section">
        <label className="framefic-email-label" htmlFor="crestbar-coupon">
          Coupon code
        </label>
        <div className="framefic-coupon-input-row">
          <input
            id="crestbar-coupon"
            type="text"
            className="framefic-coupon-input"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => {
              const val = e.target.value.toUpperCase()
              setDraft((previous) => ({ ...previous, couponCode: val }))
              setCouponError("")
            }}
            disabled={isApplyingCoupon || isSubmittingPayment}
          />
          <button
            type="button"
            className="framefic-coupon-btn"
            onClick={handleApplyCoupon}
            disabled={
              isApplyingCoupon ||
              isSubmittingPayment ||
              !couponCode.trim() ||
              (couponCode.trim() === appliedCode && !couponError)
            }
          >
            {isApplyingCoupon ? "Applying..." : "Apply"}
          </button>
        </div>
        {couponApplied && (
          <div className="framefic-coupon-success">✓ Coupon applied successfully!</div>
        )}
        {couponError && (
          <div className="framefic-coupon-error" role="alert">
            {couponError}
          </div>
        )}
      </div>

      {/* ── Stripe Payment Element (Link & Wallet disabled to prevent cluttered popup) ── */}
      {paymentLoadError && <p role="alert">{paymentLoadError}</p>}
      <PaymentElement
        onReady={() => {
          setPaymentReady(true)
          setPaymentLoadError("")
        }}
        onLoadError={() => setPaymentLoadError("Payment fields could not load. Close checkout and try again.")}
        options={{
          fields: {
            billingDetails: {
              name: "auto",
              email: "never",
              phone: "never",
              address: "auto",
            },
          },
          terms: { card: "never" },
          wallets: { applePay: "never", googlePay: "never", link: "never" },
        }}
      />

      {showEmailError && (
        <div className="email-error-banner">
          <p>Please enter your email address to proceed with payment.</p>
        </div>
      )}

      {/* ── Stripe Security Badge (Bottom) ── */}
      <div className="crestbar-stripe-branding">
        <LockKeyhole size={12} aria-hidden="true" />
        <span>Payments processed by</span>
        <strong>Stripe</strong>
      </div>

      {/* ── Action Buttons ── */}
      <div className="framefic-payment-button">
        <button
          type="button"
          className="payment-cancel"
          onClick={onClose}
          disabled={isSubmittingPayment || isApplyingCoupon}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-cta buy-now-button"
          disabled={
            !stripe ||
            !elements ||
            !paymentReady ||
            Boolean(paymentLoadError) ||
            isSubmittingPayment ||
            isApplyingCoupon
          }
          aria-busy={isSubmittingPayment || (!paymentReady && !paymentLoadError)}
        >
          <LockKeyhole size={14} aria-hidden="true" />
          {isSubmittingPayment ? "Processing..." : `Pay ${money(currentAmount)}`}
        </button>
      </div>
    </form>
  )
}
