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
    userEmail?: string | null
): Promise<{ clientSecret?: string; subscriptionId?: string | null; url?: string; publishableKey?: string }> => {
    return requestApi("/api/create-payment-intent", "Payment creation failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, siteId, userName, userEmail }),
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
