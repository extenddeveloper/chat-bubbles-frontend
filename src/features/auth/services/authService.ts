import { buildBackendUrl } from "../../../config/backend"

export type AuthUser = {
    id: number
    username: string
    email: string
    avatar_url?: string | null
    plan?: string | null
    subscription_status?: string | null
    is_verified?: number
}

const AUTH_TOKEN_KEY = "chat_bubbles_auth_token"
const AUTH_USER_KEY = "chat_bubbles_auth_user"
const AUTH_HAS_ACCOUNT_KEY = "chat_bubbles_auth_has_account"
const KNOWN_SITE_KEY = "chat_bubbles_known_site_id"

export const markHasAccount = (): void => {
    try {
        localStorage.setItem(AUTH_HAS_ACCOUNT_KEY, "1")
    } catch {}
}

export const hasCreatedAccount = (): boolean => {
    try {
        return localStorage.getItem(AUTH_HAS_ACCOUNT_KEY) === "1"
    } catch {
        return false
    }
}

export const setAuthData = (token: string, user: AuthUser): void => {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    } catch {}
}

export const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY)
    } catch {
        return null
    }
}

export const getStoredUser = (): AuthUser | null => {
    try {
        const data = localStorage.getItem(AUTH_USER_KEY)
        return data ? JSON.parse(data) : null
    } catch {
        return null
    }
}

export const clearAuthData = (): void => {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
    } catch {}
}

export const isLoggedIn = (): boolean => !!getAuthToken()

export const getKnownSiteId = (): string | null => {
    try {
        return localStorage.getItem(KNOWN_SITE_KEY) || null
    } catch {
        return null
    }
}

export const setKnownSiteId = (siteId: string): void => {
    try {
        if (siteId) localStorage.setItem(KNOWN_SITE_KEY, siteId)
    } catch {}
}

export const clearKnownSiteId = (): void => {
    try {
        localStorage.removeItem(KNOWN_SITE_KEY)
    } catch {}
}

const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const token = getAuthToken()
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(buildBackendUrl(endpoint), {
        ...options,
        headers,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${response.status}`)
    }

    return data
}

export const sendAuthOtp = async ({
    email,
    username = null,
    siteId = null,
}: {
    email: string
    username?: string | null
    siteId?: string | null
}): Promise<any> => {
    return authFetch("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, username, siteId }),
    })
}

export const verifyAuthOtp = async ({
    email,
    code,
    username = null,
    siteId = null,
}: {
    email: string
    code: string
    username?: string | null
    siteId?: string | null
}): Promise<{ token: string; user: AuthUser }> => {
    const data = await authFetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code, username, siteId }),
    })
    if (data.token && data.user) {
        setAuthData(data.token, data.user)
        markHasAccount()
    }
    return data
}

export const register = async (userData: {
    username: string
    email: string
    password?: string | null
    siteId?: string | null
}): Promise<any> => {
    return authFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
    })
}

export const verifySignup = async (email: string, code: string): Promise<{ token: string; user: AuthUser }> => {
    const data = await authFetch("/api/auth/verify-signup", {
        method: "POST",
        body: JSON.stringify({ email, code }),
    })
    if (data.token && data.user) {
        setAuthData(data.token, data.user)
        markHasAccount()
    }
    return data
}

export const login = async (credentials: { email: string; password?: string | null }): Promise<{ token: string; user: AuthUser }> => {
    const data = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    })
    if (data.token && data.user) {
        setAuthData(data.token, data.user)
        markHasAccount()
    }
    return data
}

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
    try {
        const data = await authFetch("/api/auth/me")
        if (data.user) {
            const token = getAuthToken()
            if (token) setAuthData(token, data.user)
            return data.user
        }
        return null
    } catch (err: any) {
        if (err.message?.includes("401") || err.message?.includes("unauthorized") || err.message?.includes("token")) {
            clearAuthData()
        }
        return null
    }
}

export const forgotPassword = async (email: string): Promise<any> => {
    return authFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    })
}

export const verifyResetCode = async (email: string, code: string): Promise<any> => {
    return authFetch("/api/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ email, code }),
    })
}

export const resetPassword = async (credentials: { email: string; code: string; password: string }): Promise<any> => {
    return authFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(credentials),
    })
}

export const checkAccountExists = async (email: string): Promise<{ exists: boolean }> => {
    try {
        return await authFetch(`/api/auth/account-exists?email=${encodeURIComponent(email)}`)
    } catch {
        return { exists: false }
    }
}

export const fetchSocialAuthStatus = async (sessionId: string): Promise<{ status: string; token?: string; user?: AuthUser }> => {
    try {
        return await authFetch(`/api/auth/social-status?sessionId=${encodeURIComponent(sessionId)}`)
    } catch {
        return { status: "pending" }
    }
}

export const verifySocialAuthCode = async (code: string): Promise<{ token: string; user: AuthUser }> => {
    const data = await authFetch("/api/auth/social-verify-code", {
        method: "POST",
        body: JSON.stringify({ code }),
    })
    if (data.token && data.user) {
        setAuthData(data.token, data.user)
        markHasAccount()
    }
    return data
}
