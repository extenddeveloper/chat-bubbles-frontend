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
 *
 * @framer-review-justification
 * - projectInfo.id (siteId): Required strictly to scope widget configuration storage in Framer
 *   project metadata and bind Pro subscription/trial licenses to this specific Framer project.
 * - Designer personal details (name, email, user ID) and editor URLs are intentionally not extracted.
 * - Zero scraping of document.referrer, window.location, or editor ancestor origins.
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
