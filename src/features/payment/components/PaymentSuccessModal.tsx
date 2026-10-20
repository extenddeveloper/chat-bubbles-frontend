import "./PaymentModal.css"

export type PaymentSuccessModalProps = {
  isOpen: boolean
}

export function PaymentSuccessModal({ isOpen }: PaymentSuccessModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="payment-modal success-modal">
      <div className="payment-box success-box">
        <div className="success-icon-container">
          <div className="success-icon-glow" />
          <svg className="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h3>Payment Completed</h3>
        <p>Your payment was successful. The watermark has been removed!</p>
        <div className="success-loader-container">
          <div className="success-loader-spinner" />
          <span>Updating your subscription...</span>
        </div>
      </div>
    </div>
  )
}
