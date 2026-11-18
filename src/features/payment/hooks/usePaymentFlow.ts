import { useCallback, useEffect, useState } from "react"
import { getSiteInfo } from "../../../lib/framer/project"
import {
    createPaymentIntent,
    checkSubscriptionStatus,
    getPlanPricing,
    trackPaymentCompletion,
    checkLifetimeAvailability,
    startTrial,
    fetchPaymentConfig,
} from "../services/paymentService"

export type NotifyPayload = {
    type: "Success" | "Error"
    message: string
}

export type PlanDetails = {
    plan: string | null
    status: string
    expiresAt?: string | null
    since?: string | null
    email?: string | null
    isTrial?: boolean
    trialEndsAt?: string | null
    trialSecondsRemaining?: number
    trialDaysRemaining?: number
    fetchTimestamp?: number
} | null

export type UsePaymentFlowProps = {
    notify: (payload: NotifyPayload) => void | Promise<void>
    authEmail?: string | null
}

export function usePaymentFlow({ notify, authEmail: authUserEmail }: UsePaymentFlowProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
    const [showAmount, setShowAmount] = useState<number | null>(null)
    const [showType, setShowType] = useState<string | null>(null)
    const [isPaid, setIsPaid] = useState<boolean>(false)
    const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(true)
    const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState<boolean>(false)
    const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false)
    const [payingPlan, setPayingPlan] = useState<string | null>(null)
    const [currentPlan, setCurrentPlan] = useState<string | null>(null)
    const [planDetails, setPlanDetails] = useState<PlanDetails>(null)
    const [lifetimeAvailability, setLifetimeAvailability] = useState<any>(null)
    const [activeSubscriptionId, setActiveSubscriptionId] = useState<string | null>(null)
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null)
    const [originalAmount, setOriginalAmount] = useState<number | null>(null)
    const [showCurrency, setShowCurrency] = useState<string>("usd")
    const [paymentError, setPaymentError] = useState<string | null>(null)
    const [publishableKey, setPublishableKey] = useState<string | null>(null)

    // Fetch publishable key on mount
    useEffect(() => {
        let isMounted = true
        const loadConfig = async () => {
            try {
                const config = await fetchPaymentConfig()
                if (isMounted && config?.publishableKey) {
                    setPublishableKey(config.publishableKey)
                }
            } catch {
                // Non-blocking in dev mode
            }
        }
        void loadConfig()
        return () => {
            isMounted = false
        }
    }, [])

    // When logged out (no authUserEmail), reset all paid plan states immediately
    useEffect(() => {
        if (!authUserEmail) {
            setIsPaid(false)
            setCurrentPlan(null)
            setPlanDetails(null)
            setIsCheckingPayment(false)
        }
    }, [authUserEmail])

    const refreshSubscriptionStatus = useCallback(
        async (overrideEmail?: string | null): Promise<boolean> => {
            try {
                const siteInfo = await getSiteInfo()
                const resolvedEmail = overrideEmail || authUserEmail || null

                if (!resolvedEmail) {
                    setIsPaid(false)
                    setCurrentPlan(null)
                    setPlanDetails(null)
                    setIsCheckingPayment(false)
                    try {
                        const availability = await checkLifetimeAvailability()
                        setLifetimeAvailability(availability)
                    } catch {}
                    return false
                }

                // 2. Query backend for real status
                const subStatus = await checkSubscriptionStatus(
                    siteInfo.siteId,
                    resolvedEmail
                )

                const isPlanExpired = subStatus.expiresAt
                    ? new Date(subStatus.expiresAt) <= new Date() && subStatus.plan !== "lifetime"
                    : false

                const hasActivePaidPlan =
                    subStatus.isPaid &&
                    !isPlanExpired &&
                    ["monthly", "yearly", "lifetime", "trial"].includes(subStatus.plan) &&
                    ["active", "trialing", "paid", "Scheduled to cancel"].includes(subStatus.status)

                if (hasActivePaidPlan) {
                    setIsPaid(true)
                    setCurrentPlan(subStatus.plan)
                    setPlanDetails({
                        plan: subStatus.plan,
                        status: subStatus.status,
                        expiresAt: subStatus.expiresAt,
                        since: subStatus.since,
                        email: subStatus.email ?? null,
                        isTrial: subStatus.isTrial ?? false,
                        trialEndsAt: subStatus.trialEndsAt ?? null,
                        trialSecondsRemaining: subStatus.trialSecondsRemaining ?? 0,
                        trialDaysRemaining: subStatus.trialDaysRemaining ?? 0,
                        fetchTimestamp: Date.now(),
                    })
                } else {
                    setIsPaid(false)
                    setCurrentPlan(null)
                    if (subStatus.isTrial) {
                        setPlanDetails({
                            plan: null,
                            status: "expired",
                            isTrial: true,
                            trialEndsAt: subStatus.trialEndsAt,
                            trialSecondsRemaining: 0,
                            trialDaysRemaining: 0,
                            email: subStatus.email ?? null,
                            fetchTimestamp: Date.now(),
                        })
                    } else {
                        setPlanDetails(null)
                    }
                }

                try {
                    const availability = await checkLifetimeAvailability()
                    setLifetimeAvailability(availability)
                } catch {}

                return hasActivePaidPlan
            } catch {
                setIsPaid(false)
                setCurrentPlan(null)
                setPlanDetails(null)
                return false
            }
        },
        [authUserEmail]
    )

    useEffect(() => {
        let isMounted = true
        const initialize = async () => {
            try {
                await refreshSubscriptionStatus()
            } finally {
                if (isMounted) setIsCheckingPayment(false)
            }
        }
        void initialize()
        return () => {
            isMounted = false
        }
    }, [refreshSubscriptionStatus])

    const closePaymentModal = useCallback(() => {
        setShowPaymentModal(false)
        setClientSecret(null)
        setPayingPlan(null)
        setActiveSubscriptionId(null)
        setAppliedCouponCode(null)
        setPaymentError(null)
    }, [])

    const handlePaymentSuccess = useCallback(
        (onFinish?: () => void) => {
            setIsPaid(true)
            setCurrentPlan(payingPlan)

            const now = new Date()
            const expiresAt = new Date(now)
            if (payingPlan === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1)
            else if (payingPlan === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + 1)

            const details = {
                plan: payingPlan,
                status: "active",
                since: now.toISOString(),
                expiresAt: payingPlan === "lifetime" ? null : expiresAt.toISOString(),
                email: authUserEmail || null,
            }

            setPlanDetails(details)
            setShowPaymentModal(false)
            onFinish?.()

            setShowPaymentSuccessModal(true)
            setTimeout(() => {
                setShowPaymentSuccessModal(false)
            }, 2500)

            setTimeout(() => {
                refreshSubscriptionStatus().catch(() => {})
            }, 1500)

            getSiteInfo()
                .then((siteInfo) => {
                    if (payingPlan) {
                        const { amount } = getPlanPricing(payingPlan)
                        return trackPaymentCompletion(payingPlan, `${siteInfo.siteId}-${Date.now()}`, amount)
                    }
                })
                .catch(() => {})
        },
        [payingPlan, refreshSubscriptionStatus, authUserEmail]
    )

    const makePayment = useCallback(
        async (event: any, plan: string, couponCode?: string | null) => {
            if (event && event.preventDefault) {
                event.preventDefault()
            }

            setIsCreatingPayment(true)
            setPayingPlan(plan)
            setPaymentError(null)

            const planInfo = getPlanPricing(plan)
            setOriginalAmount(planInfo.amount)
            setShowAmount(planInfo.amount)
            setShowType(planInfo.label)
            setShowCurrency(planInfo.currency || "usd")

            try {
                const siteInfo = await getSiteInfo()

                const result = await createPaymentIntent(
                    plan,
                    siteInfo.siteId,
                    couponCode
                )

                if (result.originalAmount != null) {
                    setOriginalAmount(result.originalAmount / 100)
                }
                if (result.finalAmount != null) {
                    setShowAmount(result.finalAmount / 100)
                }

                if (result.couponCode) {
                    setAppliedCouponCode(result.couponCode)
                } else if (couponCode) {
                    setAppliedCouponCode(couponCode)
                } else {
                    setAppliedCouponCode(null)
                }

                if (
                    result.isPaid === true ||
                    result.status === "paid" ||
                    result.status === "active" ||
                    result.status === "trialing" ||
                    (result.finalAmount === 0 && !result.clientSecret)
                ) {
                    void notify({
                        type: "Success",
                        message: plan === "lifetime" ? "Lifetime access is now active!" : "Subscription is now active!",
                    })
                    await handlePaymentSuccess()
                    return
                }

                if (result.clientSecret) {
                    setClientSecret(result.clientSecret)
                    if (result.publishableKey) setPublishableKey(result.publishableKey)
                    if (result.subscriptionId) setActiveSubscriptionId(result.subscriptionId)
                    setShowPaymentModal(true)
                } else if (result.url) {
                    window.open(result.url, "_blank")
                } else if (result.subscriptionId) {
                    await handlePaymentSuccess()
                } else {
                    throw new Error("No client secret returned from payment server.")
                }
            } catch (error: any) {
                const message = error instanceof Error ? error.message : "Payment failed"
                setPaymentError(message)
                await notify({ type: "Error", message })
            } finally {
                setIsCreatingPayment(false)
            }
        },
        [notify, authUserEmail, handlePaymentSuccess]
    )

    const handleStartTrial = useCallback(async (): Promise<any> => {
        try {
            const siteInfo = await getSiteInfo()
            const result = await startTrial(siteInfo.siteId)
            await refreshSubscriptionStatus()
            return result
        } catch (error) {
            console.error("Error starting trial:", error)
            throw error
        }
    }, [refreshSubscriptionStatus])

    // Live countdown timer for active trial
    useEffect(() => {
        if (!planDetails?.isTrial || !isPaid || !planDetails?.trialEndsAt) return

        const initialSeconds = planDetails.trialSecondsRemaining ?? 0
        const initialFetchTime = planDetails.fetchTimestamp ?? Date.now()

        const calculateSecondsLeft = () => {
            const elapsedMs = Date.now() - initialFetchTime
            const elapsedSec = Math.floor(elapsedMs / 1000)
            return Math.max(0, initialSeconds - elapsedSec)
        }

        const secondsLeft = calculateSecondsLeft()
        if (secondsLeft <= 0) {
            setIsPaid(false)
            setCurrentPlan(null)
            setPlanDetails((prev) =>
                prev
                    ? {
                          ...prev,
                          status: "expired",
                          trialSecondsRemaining: 0,
                          trialDaysRemaining: 0,
                      }
                    : null
            )
            return
        }

        const interval = setInterval(() => {
            const remaining = calculateSecondsLeft()
            if (remaining <= 0) {
                clearInterval(interval)
                setIsPaid(false)
                setCurrentPlan(null)
                setPlanDetails((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: "expired",
                              trialSecondsRemaining: 0,
                              trialDaysRemaining: 0,
                          }
                        : null
                )
            } else {
                setPlanDetails((prev) =>
                    prev
                        ? {
                              ...prev,
                              trialSecondsRemaining: remaining,
                              trialDaysRemaining: Math.ceil(remaining / 86400),
                          }
                        : null
                )
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [planDetails?.isTrial, planDetails?.trialEndsAt, isPaid, planDetails?.fetchTimestamp])

    return {
        clientSecret,
        publishableKey,
        showPaymentModal,
        showAmount,
        originalAmount,
        showCurrency,
        paymentError,
        showType,
        isPaid,
        isCheckingPayment,
        showPaymentSuccessModal,
        isCreatingPayment,
        payingPlan,
        currentPlan,
        planDetails,
        lifetimeAvailability,
        appliedCouponCode,
        closePaymentModal,
        handlePaymentSuccess,
        makePayment,
        refreshSubscriptionStatus,
        activeSubscriptionId,
        setClientSecret,
        setShowAmount,
        handleStartTrial,
    }
}
