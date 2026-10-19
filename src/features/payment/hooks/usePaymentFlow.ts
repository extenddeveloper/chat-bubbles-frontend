import { useCallback, useEffect, useState } from "react"
import { framer } from "@framer/plugin"
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
    userEmail?: string | null
    userName?: string | null
}

const STORAGE_OVERRIDE_KEY = "chat_bubbles_subscription_override"

export function usePaymentFlow({ notify, userEmail: authUserEmail, userName: authUserName }: UsePaymentFlowProps) {
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

    const refreshSubscriptionStatus = useCallback(
        async (overrideEmail?: string | null): Promise<boolean> => {
            try {
                const siteInfo = await getSiteInfo()
                const resolvedEmail = overrideEmail || authUserEmail || siteInfo.userEmail

                let componentsCount: number | null = null
                try {
                    const files = await (framer as any).getCodeFiles?.()
                    if (Array.isArray(files)) {
                        componentsCount = files.filter((f: any) => f.name?.startsWith("ChatBubbles") || f.name?.startsWith("Framefic")).length
                    }
                } catch {}

                // 1. Temporary local cache
                let hasLocalOverride = false
                const localOverride = localStorage.getItem(STORAGE_OVERRIDE_KEY)
                if (localOverride) {
                    try {
                        const parsed = JSON.parse(localOverride)
                        const expiry = parsed.expiresAt ? new Date(parsed.expiresAt) : null
                        if (!expiry || expiry > new Date()) {
                            setIsPaid(true)
                            setCurrentPlan(parsed.plan)
                            setPlanDetails(parsed)
                            hasLocalOverride = true
                        } else {
                            localStorage.removeItem(STORAGE_OVERRIDE_KEY)
                        }
                    } catch {
                        localStorage.removeItem(STORAGE_OVERRIDE_KEY)
                    }
                }

                // 2. Query backend for real status
                const subStatus = await checkSubscriptionStatus(
                    siteInfo.siteId,
                    siteInfo.userId,
                    resolvedEmail,
                    componentsCount,
                    siteInfo.siteName,
                    siteInfo.siteUrl
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
                    if (hasLocalOverride) {
                        localStorage.removeItem(STORAGE_OVERRIDE_KEY)
                    }
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
                    if (hasLocalOverride) {
                        localStorage.removeItem(STORAGE_OVERRIDE_KEY)
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
            try {
                localStorage.setItem(STORAGE_OVERRIDE_KEY, JSON.stringify(details))
            } catch {}

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
        async (event: any, plan: string) => {
            if (event && event.preventDefault) {
                event.preventDefault()
            }

            setIsCreatingPayment(true)
            setPayingPlan(plan)

            const planInfo = getPlanPricing(plan)
            setShowAmount(planInfo.amount)
            setShowType(planInfo.label)

            try {
                const siteInfo = await getSiteInfo()
                const resolvedEmail = authUserEmail || siteInfo.userEmail
                const resolvedUserName = authUserName || siteInfo.userName

                const result = await createPaymentIntent(
                    plan,
                    siteInfo.siteId,
                    siteInfo.userId,
                    resolvedUserName,
                    resolvedEmail
                )

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
                await notify({ type: "Error", message })
            } finally {
                setIsCreatingPayment(false)
            }
        },
        [notify, authUserEmail, authUserName, handlePaymentSuccess]
    )

    const handleStartTrial = useCallback(async (): Promise<any> => {
        try {
            const siteInfo = await getSiteInfo()
            let componentsCount: number | null = null
            try {
                const files = await (framer as any).getCodeFiles?.()
                if (Array.isArray(files)) {
                    componentsCount = files.filter((f: any) => f.name?.startsWith("ChatBubbles") || f.name?.startsWith("Framefic")).length
                }
            } catch {}

            const result = await startTrial(
                siteInfo.siteId,
                siteInfo.userId,
                componentsCount,
                siteInfo.siteName,
                siteInfo.siteUrl
            )
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
        showType,
        isPaid,
        isCheckingPayment,
        showPaymentSuccessModal,
        isCreatingPayment,
        payingPlan,
        currentPlan,
        planDetails,
        lifetimeAvailability,
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
