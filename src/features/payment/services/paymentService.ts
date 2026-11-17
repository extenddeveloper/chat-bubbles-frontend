import { buildBackendUrl } from "../../../config/backend"
import { PLANS } from "../constants"

const parseApiResponse = async (response: Response, fallbackMessage: string): Promise<any> => {
    const contentType = response.headers.get("content-type") || ""
    const isJson = contentType.includes("application/json")
    const payload = isJson ? await response.json() : await response.text()

    if (!response.ok) {
        const error: any = new Error(
            isJson
                ? payload?.message || fallbackMessage
                : typeof payload === "string" && payload.trim()
                ? payload
                : fallbackMessage
        )
        error.status = response.status
        throw error
    }

    if (!isJson) {
        const error: any = new Error(fallbackMessage)
        error.status = response.status
        throw error
    }

    return payload
}

const requestApi = async (path: string, fallbackMessage: string, options: RequestInit = {}): Promise<any> => {
    const response = await fetch(buildBackendUrl(path), options)
    return await parseApiResponse(response, fallbackMessage)
}

export const getPlanPricing = (plan: string): any => {
    const typedPlans = PLANS as Record<string, any>
    return typedPlans[plan] ?? typedPlans.monthly
}

export const fetchPaymentConfig = async (): Promise<{ publishableKey: string }> => {
    return requestApi("/api/payment-config", "Failed to fetch payment config")
}

export const checkLifetimeAvailability = async (): Promise<{ available: boolean; remaining: number; soldOut: boolean }> => {
    return requestApi("/api/lifetime-availability", "Failed to check lifetime availability")
}

export const createPaymentIntent = async (
    plan: string,
    siteId: string,
    userName?: string | null,
    userEmail?: string | null,
    couponCode?: string | null
): Promise<{
    clientSecret?: string
    subscriptionId?: string | null
    url?: string
    publishableKey?: string
    finalAmount?: number
    originalAmount?: number
    couponApplied?: boolean
    couponCode?: string | null
}> => {
    return requestApi("/api/create-payment-intent", "Payment creation failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            plan,
            siteId,
            userName,
            userEmail,
            couponCode: couponCode || undefined,
        }),
    })
}

export const applyCouponToSubscription = async (subscriptionId: string, couponCode: string): Promise<any> => {
    return requestApi("/api/apply-coupon", "Failed to apply coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, couponCode }),
    })
}

export const verifyPayment = async ({
    paymentIntentId,
    siteId,
    email,
    plan,
    subscriptionId = null,
}: {
    paymentIntentId: string
    siteId: string
    email: string
    plan: string
    subscriptionId?: string | null
}): Promise<any> => {
    return requestApi("/api/verify-payment", "Payment verification failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId, siteId, email, plan, subscriptionId }),
    })
}

export const checkSubscriptionStatus = async (
    siteId: string,
    email?: string | null
): Promise<any> => {
    const params = new URLSearchParams({ siteId })
    if (email) params.append("email", email)
    return requestApi(`/api/subscription-status?${params.toString()}`, "Failed to check subscription status")
}

import { getAuthToken } from "../../auth/services/authService"

export const checkTrialEligibility = async (
    siteId: string,
    email?: string | null
): Promise<{ eligible: boolean; trialExpired?: boolean; daysRemaining?: number; secondsRemaining?: number }> => {
    const params = new URLSearchParams({ siteId })
    if (email) params.append("email", email)
    return requestApi(`/api/check-trial-eligibility?${params.toString()}`, "Failed to check trial eligibility")
}

export const startTrial = async (
    siteId: string
): Promise<{ success: boolean; message: string; trialStart?: string; trialEnd?: string }> => {
    const token = getAuthToken()
    return requestApi("/api/start-trial", "Failed to start free trial", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ siteId }),
    })
}

export const cancelSubscription = async (siteId: string, feedback?: string | null): Promise<any> => {
    return requestApi("/api/subscription/cancel", "Failed to cancel subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, feedback }),
    })
}

export const changeSubscriptionPlan = async (siteId: string, targetPlan: string): Promise<any> => {
    return requestApi("/api/subscription/change-plan", "Failed to change subscription plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, targetPlan }),
    })
}

export const createBillingPortalSession = async (siteId: string): Promise<{ url: string }> => {
    const query = `siteId=${encodeURIComponent(siteId)}`
    return requestApi(`/api/billing-portal-url?${query}`, "Failed to load billing portal")
}

export const trackPaymentCompletion = async (
    plan: string,
    sessionId: string,
    amount: number
): Promise<any> => {
    try {
        return await requestApi("/api/track-payment-completion", "Tracking deferred", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan, sessionId, amount }),
        })
    } catch {
        return null
    }
}

// ────────────────────────────────────────────────────────────
//  Dynamic Announcement Configuration
// ────────────────────────────────────────────────────────────
export interface AnnouncementConfig {
    enabled: boolean
    campaignId: string
    title: string
    subtitle: string
    buttonText: string
    couponCode?: string | null
    countdownEnabled: boolean
    durationMinutes: number
    countdownVisibleMinutes: number
    linkUrl: string
    action: "modal" | "link" | "upgrade" | "navigate"
    icon: string
    showTo: "free" | "all"
}

export const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
    enabled: true,
    campaignId: "bfcm26",
    title: "Black Friday Offer",
    subtitle: "Get 50% Off Plan.",
    buttonText: "Get Now",
    couponCode: "60LTDBFCM26",
    countdownEnabled: true,
    durationMinutes: 3,
    countdownVisibleMinutes: 3,
    linkUrl: "",
    action: "modal",
    icon: "bell-ring",
    showTo: "free",
}

let cachedAnnouncementConfig: AnnouncementConfig | null = null
let announcementFetchInFlight: Promise<AnnouncementConfig> | null = null

export const getCachedAnnouncementConfig = (): AnnouncementConfig | null => cachedAnnouncementConfig

export const fetchAnnouncementConfig = async (
    _apiUrl?: string,
    signal?: AbortSignal
): Promise<AnnouncementConfig> => {
    if (cachedAnnouncementConfig) return cachedAnnouncementConfig
    if (announcementFetchInFlight) return announcementFetchInFlight

    announcementFetchInFlight = (async () => {
        try {
            const data = await requestApi("/api/announcement", "Failed to load announcement", { signal })
            if (data && typeof data === "object") {
                cachedAnnouncementConfig = {
                    enabled: Boolean(data.enabled),
                    campaignId: String(data.campaignId || "bfcm26"),
                    title: String(data.title || "Black Friday Offer"),
                    subtitle: String(data.subtitle || "Get 50% Off Plan."),
                    buttonText: String(data.buttonText || "Get Now"),
                    couponCode: data.couponCode ? String(data.couponCode) : null,
                    countdownEnabled: Boolean(data.countdownEnabled),
                    durationMinutes: Number(data.durationMinutes) || 3,
                    countdownVisibleMinutes: Number(data.countdownVisibleMinutes) || 3,
                    linkUrl: String(data.linkUrl || ""),
                    action: (data.action as any) || "modal",
                    icon: String(data.icon || "bell-ring"),
                    showTo: (data.showTo as any) || "free",
                }
                return cachedAnnouncementConfig
            }
            return DEFAULT_ANNOUNCEMENT
        } catch {
            return DEFAULT_ANNOUNCEMENT
        } finally {
            announcementFetchInFlight = null
        }
    })()

    return announcementFetchInFlight
}

// ────────────────────────────────────────────────────────────
//  Dynamic Plans Catalog
// ────────────────────────────────────────────────────────────
export type PaidPlan = "monthly" | "yearly" | "lifetime"

export interface PlanDiscountInfo {
    code: string
    type: "percentage" | "flat"
    amount: number
    currencyCode?: string | null
    formattedDiscount: string
    discountedAmount: number
    discountedFormattedPrice: string
    couponId?: string | null
}

export interface StripePlan {
    key?: string
    configured: boolean
    enabled?: boolean
    amount: number
    currency: string
    label: string
    interval?: "month" | "year" | null
    formattedPrice: string
    discount?: PlanDiscountInfo | null
    formattedDiscountedPrice?: string | null
    defaultCouponCode?: string | null
}

export type StripePlans = Partial<Record<PaidPlan, StripePlan>>

export const DEFAULT_FALLBACK_PLANS: StripePlans = {
    monthly: {
        key: "monthly",
        configured: true,
        enabled: true,
        amount: 4.99,
        currency: "usd",
        label: "Monthly Pro",
        interval: "month",
        formattedPrice: "$4.99",
        discount: null,
    },
    yearly: {
        key: "yearly",
        configured: true,
        enabled: false,
        amount: 49.99,
        currency: "usd",
        label: "Yearly Pro",
        interval: "year",
        formattedPrice: "$49.99",
        discount: null,
    },
    lifetime: {
        key: "lifetime",
        configured: true,
        enabled: true,
        amount: 99.99,
        currency: "usd",
        label: "Lifetime Access",
        interval: null,
        formattedPrice: "$99.99",
        discount: {
            code: "60LTDBFCM26",
            type: "percentage",
            amount: 60,
            currencyCode: "usd",
            formattedDiscount: "60% OFF",
            discountedAmount: 39.99,
            discountedFormattedPrice: "$39.99",
            couponId: "Ylup0ipJ",
        },
        formattedDiscountedPrice: "$39.99",
        defaultCouponCode: "60LTDBFCM26",
    },
}

let cachedPlans: StripePlans | null = null
let plansFetchInFlight: Promise<StripePlans> | null = null

export const getCachedPlans = (): StripePlans => cachedPlans || DEFAULT_FALLBACK_PLANS

export const fetchPlanPrices = async (signal?: AbortSignal): Promise<StripePlans> => {
    if (cachedPlans) return cachedPlans
    if (plansFetchInFlight) return plansFetchInFlight

    plansFetchInFlight = (async () => {
        const candidatePaths = [
            "/api/plans",
            "/plans",
            "/chat-bubbles/api/plans",
            "/api/plan-availability",
        ]

        for (const path of candidatePaths) {
            try {
                const data = await requestApi(path, "Failed to fetch plans", { signal })
                const plans = (data?.plans || data) as StripePlans | undefined
                if (plans && typeof plans === "object" && (plans.monthly || plans.lifetime)) {
                    const validPlans: StripePlans = {}
                    for (const key of ["monthly", "yearly", "lifetime"] as const) {
                        const p = plans[key]
                        if (p && typeof p === "object") {
                            validPlans[key] = {
                                ...p,
                                key,
                                configured: p.configured !== false,
                                enabled: typeof p.enabled === "boolean" ? p.enabled : key !== "yearly",
                                formattedDiscountedPrice: p.formattedDiscountedPrice || p.discount?.discountedFormattedPrice || null,
                                defaultCouponCode: p.defaultCouponCode || p.discount?.code || null,
                            }
                        } else if (DEFAULT_FALLBACK_PLANS[key]) {
                            validPlans[key] = { ...DEFAULT_FALLBACK_PLANS[key] }
                        }
                    }
                    cachedPlans = validPlans
                    return validPlans
                }
            } catch {
                // Try next candidate
            }
        }

        return cachedPlans || DEFAULT_FALLBACK_PLANS
    })().finally(() => {
        plansFetchInFlight = null
    })

    return plansFetchInFlight
}

export const fetchPlans = async (signal?: AbortSignal): Promise<StripePlans> => {
    return fetchPlanPrices(signal)
}
