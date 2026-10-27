import { framer } from "@framer/plugin"

export type SiteInfo = {
    siteId: string
    siteUrl: string | null
    userId: string | null
    userName: string | null
    userEmail: string | null
}

/**
 * Retrieves Framer project identity strictly for project-level license scoping.
 * Designer personal details (name, email, user ID) and editor URLs are intentionally not extracted.
 */
export const getSiteInfo = async (): Promise<SiteInfo> => {
    try {
        const projectInfo = await framer.getProjectInfo().catch(() => null)
        const siteId = projectInfo?.id ?? "chat_bubbles_local_site"

        return {
            siteId,
            siteUrl: null,
            userId: null,
            userName: null,
            userEmail: null,
        }
    } catch {
        return {
            siteId: "chat_bubbles_local_site",
            siteUrl: null,
            userId: null,
            userName: null,
            userEmail: null,
        }
    }
}

