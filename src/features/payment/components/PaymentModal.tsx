import { useEffect, useState } from "react"
import { Elements } from "@stripe/react-stripe-js"
import { CheckoutForm } from "./CheckoutForm"
import "./PaymentModal.css"

export type PaymentModalProps = {
  isOpen: boolean
  clientSecret: string | null
  showPaymentSuccessModal: boolean
  showAmount: number | null
  showType: string | null
  plan: string | null
  stripePromise: any
  onClose: () => void
  onSuccess: (id: string) => void | Promise<void>
  notify: (payload: { type: "Success" | "Error"; message: string }) => void | Promise<void>
  defaultEmail?: string | null
  subscriptionId?: string | null
  setClientSecret: (secret: string | null) => void
  setShowAmount: (amount: number | null) => void
}

export function PaymentModal({
  isOpen,
  clientSecret,
  showPaymentSuccessModal,
  showAmount,
  showType,
  plan,
  stripePromise,
  onClose,
  onSuccess,
  notify,
  defaultEmail,
  subscriptionId,
  setClientSecret,
  setShowAmount,
}: PaymentModalProps) {
  const [framerTheme, setFramerTheme] = useState<string | null>(() =>
    typeof document !== "undefined" ? document.body.dataset.framerTheme ?? null : null
  )
  const [stripeLoadError, setStripeLoadError] = useState<boolean>(false)

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

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
    if (!stripePromise) {
      setStripeLoadError(false)
      return
    }
    let cancelled = false
    stripePromise.then((stripe: any) => {
      if (!cancelled && !stripe) {
        setStripeLoadError(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [stripePromise])

  const isLightTheme = framerTheme === "light"

  if (!isOpen || !clientSecret || showPaymentSuccessModal) {
    return null
  }

  if (stripeLoadError || !stripePromise) {
    return (
      <div className="payment-modal">
        <div className="payment-box">
          <h3>Payment Unavailable</h3>
          <p className="payment-error-desc">
            The payment service could not be initialized. This may be caused by a network issue or a browser extension blocking external scripts.
          </p>
          <p className="payment-error-hint">
            Please check your internet connection and try again. If the problem persists, disable any ad-blockers or privacy extensions and reload the plugin.
          </p>
          <div className="framefic-payment-button payment-cancel-btn-wrap">
            <button type="button" className="payment-cancel primary-cta payment-cancel-full" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const paymentElementOptions = {
    clientSecret,
    appearance: {
      theme: (isLightTheme ? "stripe" : "night") as "stripe" | "night",
      variables: {
        colorPrimary: "#5271FF",
        colorBackground: isLightTheme ? "#FFFFFF" : "#201F1F",
        colorText: isLightTheme ? "#101828" : "#FCFCFD",
        colorTextSecondary: isLightTheme ? "#5F6B7A" : "#BFBFBF",
        colorDanger: "#F97066",
        colorIcon: isLightTheme ? "#5F6B7A" : "#BFBFBF",
        borderRadius: "4px",
        spacingUnit: "4px",
        fontSizeBase: "13px",
        fontFamily: "Mulish, Inter, sans-serif",
      },
      rules: {
        ".Tab": {
          border: isLightTheme ? "1px solid #CFD7E3" : "1px solid #323131",
          backgroundColor: isLightTheme ? "#F3F6FB" : "#242323",
          padding: "10px 12px",
        },
        ".TabLabel": {
          fontSize: "13px",
          fontWeight: "600",
        },
        ".Tab--selected": {
          borderColor: "#5271FF",
          backgroundColor: isLightTheme ? "#E7ECF4" : "#323131",
          color: isLightTheme ? "#101828" : "#FCFCFD",
        },
        ".Label": {
          fontSize: "13px",
        },
        ".Input": {
          border: isLightTheme ? "1px solid #CFD7E3" : "1px solid #323131",
          backgroundColor: isLightTheme ? "#FFFFFF" : "#242323",
          boxShadow: "none",
          fontSize: "13px",
        },
        ".Input:focus": {
          borderColor: "#5271FF",
          boxShadow: "0 0 0 1px #5271FF",
        },
        ".Text": {
          fontSize: "12px",
        },
      },
    },
  }

  return (
    <div className="payment-modal">
      <div className="payment-box">
        <h3>Complete Payment</h3>
        <p>
          Total Amount is: ${showAmount} ({showType})
        </p>
        <Elements key={clientSecret} stripe={stripePromise} options={paymentElementOptions}>
          <CheckoutForm
            onClose={onClose}
            onSuccess={onSuccess}
            notify={notify}
            plan={plan}
            defaultEmail={defaultEmail}
            subscriptionId={subscriptionId}
            setClientSecret={setClientSecret}
            setShowAmount={setShowAmount}
          />
        </Elements>
      </div>
    </div>
  )
}
