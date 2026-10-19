import { framer } from "@framer/plugin"

export type SiteInfo = {
    siteId: string
    siteName: string
    siteUrl: string | null
    userId: string | null
    userName: string | null
    userEmail: string | null
}

/**
 * Retrieves Framer project and designer metadata for scoped storage and licensing.
 */
export const getSiteInfo = async (): Promise<SiteInfo> => {
    try {
        const [projectInfo, publishInfo, currentUser] = await Promise.all([
            framer.getProjectInfo().catch(() => null),
            framer.getPublishInfo().catch(() => null),
            (framer as any).getCurrentUser?.().catch(() => null) as Promise<any>,
        ])

        const siteId = projectInfo?.id ?? "chat_bubbles_local_site"
        const siteName = projectInfo?.name ?? (projectInfo as any)?.title ?? "Chat Bubbles Project"

        const rawUrl =
            publishInfo?.production?.url ||
            publishInfo?.staging?.url ||
            (projectInfo as any)?.url ||
            (projectInfo as any)?.publishedUrl ||
            (projectInfo as any)?.domain ||
            null

        let siteUrl: string | null = null
        if (rawUrl && typeof rawUrl === "string") {
            siteUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
        }

        if (!siteUrl && typeof window !== "undefined") {
            if (document.referrer && (document.referrer.includes(".framer.app") || document.referrer.includes(".framer.website"))) {
                try {
                    const refUrl = new URL(document.referrer)
                    if (refUrl.origin) siteUrl = refUrl.origin
                } catch {}
            }
        }

        if (!siteUrl && projectInfo?.id) {
            siteUrl = `https://${projectInfo.id}.framer.app`
        }

        return {
            siteId,
            siteName,
            siteUrl: siteUrl || "https://framer.app",
            userId: currentUser?.id ?? null,
            userName: currentUser?.name ?? currentUser?.displayName ?? null,
            userEmail: currentUser?.email ?? null,
        }
    } catch {
        return {
            siteId: "chat_bubbles_local_site",
            siteName: "Chat Bubbles Project",
            siteUrl: "https://framer.app",
            userId: null,
            userName: null,
            userEmail: null,
        }
    }
}
