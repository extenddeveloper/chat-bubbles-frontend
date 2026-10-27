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
  setClientSecret,
  setShowAmount,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false)
  const [email, setEmail] = useState<string>(defaultEmail || "")
  const [showEmailError, setShowEmailError] = useState<boolean>(false)

  const [couponCode, setCouponCode] = useState<string>("")
  const [showCouponInput, setShowCouponInput] = useState<boolean>(false)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false)
  const [couponError, setCouponError] = useState<string>("")
  const [couponApplied, setCouponApplied] = useState<boolean>(false)

  useEffect(() => {
    if (showEmailError) {
      const timer = setTimeout(() => {
        setShowEmailError(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [showEmailError])

  const handleApplyCoupon = async (): Promise<void> => {
    if (!couponCode.trim()) return
    if (!subscriptionId) {
      setCouponError("Cannot apply coupon to this payment.")
      return
    }

    setIsApplyingCoupon(true)
    setCouponError("")

    try {
      const result = await applyCouponToSubscription(subscriptionId, couponCode.trim())

      if (result.discountedAmount !== undefined) {
        setShowAmount(result.discountedAmount / 100)
      }

      if (result.status === "active" || result.status === "trialing" || result.discountedAmount === 0) {
        setCouponApplied(true)
        void notify({ type: "Success", message: "Coupon applied! Subscription is now active." })
        await onSuccess(result.subscriptionId || subscriptionId)
        onClose()
        return
      }

      if (result.clientSecret) {
        setClientSecret(result.clientSecret)
      }

      setCouponApplied(true)
      void notify({ type: "Success", message: "Coupon applied successfully!" })
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon code")
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
      {plan === "monthly" && !couponApplied && (
        <div className="framefic-coupon-section">
          {!showCouponInput ? (
            <button type="button" className="framefic-coupon-toggle" onClick={() => setShowCouponInput(true)}>
              Have a coupon code?
            </button>
          ) : (
            <div>
              <div className="framefic-coupon-input-row">
                <input
                  type="text"
                  className="framefic-coupon-input"
                  placeholder="Enter coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={isApplyingCoupon}
                />
                <button
                  type="button"
                  className="framefic-coupon-btn"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                >
                  {isApplyingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>
              {couponError && <div className="framefic-coupon-error">{couponError}</div>}
            </div>
          )}
        </div>
      )}
      <div className="framefic-email-wrapper">
        <label className="framefic-email-label">Email</label>
        <input
          type="email"
          className="framefic-email-input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          disabled={!!defaultEmail}
          required
        />
      </div>
      <PaymentElement
        options={{
          fields: {
            billingDetails: "auto",
          },
          terms: { card: "never" },
          wallets: { applePay: "never", googlePay: "never" },
        }}
      />
      {showEmailError && (
        <div className="email-error-banner">
          <p>Please enter your email address to proceed with payment.</p>
        </div>
      )}
      <div className="framefic-payment-button">
        <button type="button" className="payment-cancel" onClick={onClose} disabled={isSubmittingPayment}>
          Cancel
        </button>

        <button type="submit" className="primary-cta buy-now-button" disabled={isSubmittingPayment}>
          {isSubmittingPayment ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  )
}
