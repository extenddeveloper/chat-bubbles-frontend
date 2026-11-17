import { useEffect, useState } from "react"
import { Elements } from "@stripe/react-stripe-js"
import { ArrowLeft, LockKeyhole } from "lucide-react"
import { CheckoutForm, type CheckoutDraft } from "./CheckoutForm"
import "./StripeCheckout.css"

export type PaymentModalProps = {
  isOpen: boolean
  clientSecret: string | null
  showPaymentSuccessModal: boolean
  showCurrency?: string
  originalAmount?: number | null
  showAmount: number | null
  showType: string | null
  plan: string | null
  stripePromise: any
  onClose: () => void
  onSuccess: (id: string) => void | Promise<void>
  notify: (payload: { type: "Success" | "Error"; message: string }) => void | Promise<void>
  defaultCouponCode?: string
  defaultEmail?: string | null
  subscriptionId?: string | null
  setClientSecret: (secret: string | null) => void
  setShowAmount: (amount: number | null) => void
  paymentError?: string | null
  onRetry?: () => void
}

export function PaymentModal({
  isOpen,
  clientSecret,
  showPaymentSuccessModal,
  showAmount,
  originalAmount,
  showCurrency = "usd",
  showType,
  plan,
  stripePromise,
  onClose,
  onSuccess,
  notify,
  defaultEmail,
  defaultCouponCode = "",
  subscriptionId,
  setClientSecret,
  setShowAmount,
  paymentError,
  onRetry,
}: PaymentModalProps) {
  const [framerTheme, setFramerTheme] = useState<string | null>(() =>
    typeof document !== "undefined" ? document.body.dataset.framerTheme ?? null : null
  )
  const [stripeLoadError, setStripeLoadError] = useState<boolean>(false)
  const [initError, setInitError] = useState<string>("")
  const [draft, setDraft] = useState<CheckoutDraft>(() => ({
    email: defaultEmail || "",
    couponCode: defaultCouponCode,
    appliedCode: defaultCouponCode,
    originalAmount: originalAmount ?? showAmount ?? 0,
    subscriptionId: subscriptionId ?? null,
  }))

  useEffect(() => {
    if (typeof document === "undefined") return

    const body = document.body
    const observer = new MutationObserver(() => {
      setFramerTheme(body.dataset.framerTheme ?? null)
    })

    observer.observe(body, {
      attributes: true,
      attributeFilter: ["data-framer-theme"],
    })

    setFramerTheme(body.dataset.framerTheme ?? null)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isOpen) {
      setDraft({
        email: defaultEmail || "",
        couponCode: defaultCouponCode,
        appliedCode: defaultCouponCode,
        originalAmount: originalAmount ?? showAmount ?? 0,
        subscriptionId: subscriptionId ?? null,
      })
    }
  }, [isOpen, defaultEmail, defaultCouponCode, originalAmount, showAmount, subscriptionId])

  // Detect Stripe loading failure or timeout
  useEffect(() => {
    setInitError("")
    setStripeLoadError(false)
    if (!isOpen) return

    let cancelled = false
    const timer = setTimeout(() => {
      if (!cancelled && (!clientSecret || !stripePromise)) {
        setInitError("Payment could not initialize. Close and try again.")
      }
    }, 20000)

    if (stripePromise) {
      Promise.resolve(stripePromise)
        .then((stripe: any) => {
          if (!cancelled && !stripe) {
            setStripeLoadError(true)
          }
        })
        .catch(() => {
          if (!cancelled) setStripeLoadError(true)
        })
    }

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, clientSecret, stripePromise])

  const isLightTheme = framerTheme === "light"

  if (!isOpen || showPaymentSuccessModal) {
    return null
  }

  const paymentElementOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: (isLightTheme ? "stripe" : "night") as "stripe" | "night",
      variables: {
        colorPrimary: "#5271FF",
        colorBackground: isLightTheme ? "#FFFFFF" : "#1a1a1a",
        colorText: isLightTheme ? "#101828" : "#FCFCFD",
        colorTextSecondary: isLightTheme ? "#5F6B7A" : "#BFBFBF",
        colorDanger: "#F97066",
        colorIcon: isLightTheme ? "#5F6B7A" : "#BFBFBF",
        borderRadius: "6px",
        spacingUnit: "4px",
        fontSizeBase: "13px",
        fontFamily: "Inter, sans-serif",
      },
    },
  }

  const activeError =
    paymentError ||
    initError ||
    (stripeLoadError ? "Stripe could not load. Check your internet connection and try again." : "")

  return (
    <section className="crestbar-checkout-page" aria-labelledby="crestbar-payment-title">
      <header className="crestbar-checkout-header">
        <button type="button" className="crestbar-checkout-back" onClick={onClose}>
          <ArrowLeft size={14} /> Back to plans
        </button>
        <span>
          <LockKeyhole size={12} /> Secure checkout
        </span>
      </header>

      <div className="stripe-checkout-box">
        {activeError ? (
          <div>
            <p role="alert" className="framefic-coupon-error checkout-error-mb">
              {activeError}
            </p>
            {onRetry && (
              <button
                type="button"
                className="primary-cta buy-now-button checkout-btn-full"
                onClick={() => {
                  setInitError("")
                  setStripeLoadError(false)
                  setDraft({
                    email: defaultEmail || "",
                    couponCode: defaultCouponCode,
                    appliedCode: defaultCouponCode,
                    originalAmount: originalAmount ?? showAmount ?? 0,
                    subscriptionId: subscriptionId ?? null,
                  })
                  onRetry()
                }}
              >
                Retry checkout
              </button>
            )}
            <button
              type="button"
              className="payment-cancel checkout-btn-close"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : clientSecret && stripePromise ? (
          <Elements key={clientSecret} stripe={stripePromise} options={paymentElementOptions}>
            <CheckoutForm
              draft={draft}
              setDraft={setDraft}
              onClose={onClose}
              onSuccess={onSuccess}
              notify={notify}
              plan={plan}
              defaultEmail={defaultEmail}
              subscriptionId={subscriptionId}
              clientSecret={clientSecret}
              setClientSecret={setClientSecret}
              setShowAmount={setShowAmount}
              showAmount={showAmount}
              showCurrency={showCurrency}
              showType={showType}
            />
          </Elements>
        ) : (
          <div>
            <div className="stripe-checkout-skeleton">
              <span />
              <span />
              <span />
            </div>
            <button
              type="button"
              className="payment-cancel checkout-btn-cancel-skeleton"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
