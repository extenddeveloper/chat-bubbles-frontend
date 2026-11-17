import React, { useState, useEffect } from "react"
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { verifyPayment, applyCouponToSubscription } from "../services/paymentService"
import { getSiteInfo } from "../../../lib/framer/project"

export type CheckoutFormProps = {
  onClose: () => void
  onSuccess: (id: string) => void | Promise<void>
  notify: (payload: { type: "Success" | "Error"; message: string }) => void | Promise<void>
  plan: string | null
  defaultEmail?: string | null
  subscriptionId?: string | null
  clientSecret?: string | null
  initialCouponCode?: string | null
  setClientSecret: (secret: string | null) => void
  setShowAmount: (amount: number | null) => void
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return "Payment failed"
}

export function CheckoutForm({
  onClose,
  onSuccess,
  notify,
  plan,
  defaultEmail,
  subscriptionId,
  clientSecret,
  initialCouponCode,
  setClientSecret,
  setShowAmount,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false)
  const [paymentReady, setPaymentReady] = useState(false)
  const [paymentLoadError, setPaymentLoadError] = useState("")
  const [email, setEmail] = useState<string>(defaultEmail || "")
  const [showEmailError, setShowEmailError] = useState<boolean>(false)

  const [couponCode, setCouponCode] = useState<string>(initialCouponCode || "")
  const [appliedCode, setAppliedCode] = useState<string>(initialCouponCode || "")
  const [couponApplied, setCouponApplied] = useState<boolean>(Boolean(initialCouponCode))
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false)
  const [couponError, setCouponError] = useState<string>("")

  useEffect(() => {
    if (initialCouponCode) {
      setCouponCode(initialCouponCode)
      setAppliedCode(initialCouponCode)
      setCouponApplied(true)
    }
  }, [initialCouponCode])

  useEffect(() => {
    if (showEmailError) {
      const timer = setTimeout(() => {
        setShowEmailError(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [showEmailError])

  const handleApplyCoupon = async (): Promise<void> => {
    const trimmed = couponCode.trim()
    if (!trimmed || isApplyingCoupon) return

    setIsApplyingCoupon(true)
    setCouponError("")

    try {
      const piId = clientSecret ? clientSecret.split("_secret_")[0] : null
      const targetSubId = plan === "lifetime" ? piId : subscriptionId || piId
      if (!targetSubId) {
        setCouponError("Cannot apply coupon to this payment.")
        return
      }

      const result = await applyCouponToSubscription(targetSubId, trimmed, piId)

      if (result.discountedAmount !== undefined) {
        setShowAmount(result.discountedAmount / 100)
      }

      const activatesAccess =
        result.isPaid === true ||
        result.status === "active" ||
        result.status === "trialing" ||
        result.discountedAmount === 0

      if (activatesAccess) {
        setCouponApplied(true)
        setAppliedCode(trimmed)
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
      } else if (elements) {
        try {
          await elements.fetchUpdates()
        } catch {
          // ignore non-critical fetchUpdates
        }
      }

      setCouponApplied(true)
      setAppliedCode(trimmed)
      void notify({ type: "Success", message: "Coupon applied successfully!" })
    } catch (err: any) {
      setCouponError(err.message || "Invalid or expired coupon code")
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!stripe || !elements) return

    if (!email) {
      setShowEmailError(true)
      return
    }

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
            subscriptionId: subscriptionId || null,
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
      setIsSubmittingPayment(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="framefic-email-wrapper">
        <label className="framefic-email-label" htmlFor="chat-bubbles-payment-email">
          Email
        </label>
        <input
          id="chat-bubbles-payment-email"
          type="email"
          className="framefic-email-input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          disabled={!!defaultEmail || isSubmittingPayment}
          required
        />
      </div>

      {/* ── Coupon Code Section (Always Visible for both Lifetime & Monthly) ── */}
      <div className="framefic-coupon-section">
        <label className="framefic-email-label" htmlFor="chat-bubbles-coupon">
          Coupon code
        </label>
        <div className="framefic-coupon-input-row">
          <input
            id="chat-bubbles-coupon"
            type="text"
            className="framefic-coupon-input"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => {
              const val = e.target.value.toUpperCase()
              setCouponCode(val)
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
              (couponApplied && couponCode.trim() === appliedCode && !couponError)
            }
          >
            {isApplyingCoupon ? "Applying..." : "Apply"}
          </button>
        </div>
        {couponApplied && couponCode.trim() === appliedCode && !couponError && (
          <div className="framefic-coupon-success">✓ Coupon applied successfully!</div>
        )}
        {couponError && (
          <div className="framefic-coupon-error" role="alert">
            {couponError}
          </div>
        )}
      </div>

      {paymentLoadError && <p className="payment-error-hint">{paymentLoadError}</p>}

      {/* ── Stripe Payment Element (wallets & extra billing fields disabled to prevent cluttered Link popup) ── */}
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
        >
          {isSubmittingPayment ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  )
}
