import { useCallback, useEffect, useState } from "react"
import {
    isLoggedIn as checkIsLoggedIn,
    getStoredUser,
    fetchCurrentUser,
    sendAuthOtp,
    verifyAuthOtp,
    updateSiteInfo,
    clearAuthData,
    setAuthData,
    setKnownSiteId,
    clearKnownSiteId,
    type AuthUser,
} from "../services/authService"
import { getSiteInfo } from "../../../lib/framer/project"

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true)
    const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
    const [authModalMode, setAuthModalMode] = useState<"register" | "login">("register")

    useEffect(() => {
        let isMounted = true

        const initialize = async () => {
            try {
                // 1. Restore local session immediately
                if (checkIsLoggedIn()) {
                    const cachedUser = getStoredUser()
                    if (cachedUser && isMounted) {
                        setUser(cachedUser)
                        setIsLoggedIn(true)
                    }
                }

                // 2. Fetch site info
                let currentSiteId: string | null = null
                try {
                    const info = await getSiteInfo()
                    currentSiteId = info.siteId || null
                    if (currentSiteId) {
                        setKnownSiteId(currentSiteId)
                    }
                } catch {}

                // 3. Refresh user session from backend
                if (checkIsLoggedIn()) {
                    const freshUser = await fetchCurrentUser()
                    if (isMounted) {
                        if (freshUser) {
                            setUser(freshUser)
                            setIsLoggedIn(true)
                        } else if (!checkIsLoggedIn()) {
                            setUser(null)
                            setIsLoggedIn(false)
                        }
                    }
                }
            } catch {
            } finally {
                if (isMounted) setIsCheckingAuth(false)
            }
        }

        void initialize()
        return () => {
            isMounted = false
        }
    }, [])

    const register = useCallback(
        async ({
            username,
            email,
            password: _password = null,
            siteId = null,
            framerUserId = null,
            framerSiteUrl = null,
        }: {
            username: string
            email: string
            password?: string | null
            siteId?: string | null
            framerUserId?: string | null
            framerSiteUrl?: string | null
        }) => {
            void _password
            const siteInfo = await getSiteInfo().catch(() => null)
            const resolvedSiteUrl = framerSiteUrl || siteInfo?.siteUrl || null
            const result = await sendAuthOtp({
                username,
                email,
                siteId: siteId || siteInfo?.siteId || null,
                framerUserId: framerUserId || siteInfo?.userId || null,
                framerSiteUrl: resolvedSiteUrl,
            })
            return result
        },
        []
    )

    const verifySignup = useCallback(async ({ email, code }: { email: string; code: string }) => {
        const result = await verifyAuthOtp({ email, code })
        setUser(result.user)
        setIsLoggedIn(true)
        setShowAuthModal(false)
        getSiteInfo()
            .then((info) => {
                if (info.siteId) setKnownSiteId(info.siteId)
                void updateSiteInfo({
                    siteId: info.siteId,
                    siteUrl: info.siteUrl,
                    framerUserId: info.userId,
                })
            })
            .catch(() => {})
        return result
    }, [])

    const login = useCallback(
        async ({
            email,
            code = null,
            password: _password = null,
        }: {
            email: string
            code?: string | null
            password?: string | null
        }) => {
            void _password
            if (code) {
                return await verifySignup({ email, code })
            }
            const siteInfo = await getSiteInfo().catch(() => null)
            const result = await sendAuthOtp({
                email,
                siteId: siteInfo?.siteId || null,
                framerUserId: siteInfo?.userId || null,
                framerSiteUrl: siteInfo?.siteUrl || null,
            })
            return result
        },
        [verifySignup]
    )

    const logout = useCallback(() => {
        clearAuthData()
        clearKnownSiteId()
        setUser(null)
        setIsLoggedIn(false)
        try {
            localStorage.removeItem("chat_bubbles_subscription_override")
        } catch {}
    }, [])

    const openAuthModal = useCallback((mode: "login" | "register" = "register") => {
        setAuthModalMode(mode === "login" ? "login" : "register")
        setShowAuthModal(true)
    }, [])

    const closeAuthModal = useCallback(() => {
        setShowAuthModal(false)
    }, [])

    const socialLogin = useCallback((token: string, user: AuthUser) => {
        setAuthData(token, user)
        setUser(user)
        setIsLoggedIn(true)
        setShowAuthModal(false)
        getSiteInfo()
            .then((info) => {
                if (info.siteId) setKnownSiteId(info.siteId)
                void updateSiteInfo({
                    siteId: info.siteId,
                    siteUrl: info.siteUrl,
                    framerUserId: info.userId,
                })
            })
            .catch(() => {})
    }, [])

    return {
        user,
        isLoggedIn,
        isCheckingAuth,
        showAuthModal,
        authModalMode,
        register,
        verifySignup,
        login,
        logout,
        openAuthModal,
        closeAuthModal,
        socialLogin,
    }
}
