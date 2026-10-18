import type { ChannelId, ChatChannel, ChatConfig } from "../types"

export type AnalyticsPeriod = "Last 7 days" | "Last 30 days" | "Last 6 months"

export interface AnalyticsBar {
    label: string
    value: number
    percentage: number
    highlight: boolean
}

export interface ChannelStat {
    id: ChannelId
    label: string
    color: string
    clicks: number
    percentage: number
}

export interface AnalyticsData {
    views: number
    clicks: number
    convRate: string
    bars: AnalyticsBar[]
    channelStats: ChannelStat[]
    maxY: number
    midY: number
    isRealData: boolean
}

export interface DailyInteractionRecord {
    views: number
    clicks: number
    channels: Record<string, number>
}

export interface StoredAnalytics {
    days: Record<string, DailyInteractionRecord>
    totalViews: number
    totalClicks: number
}

export const BACKEND_ANALYTICS_URL = "https://app.framefic.com/crestbar"
const STORAGE_KEY = "chat_bubbles_analytics_data_v1"

export function getStoredWidgetId(config?: Partial<ChatConfig>): string {
    if (config?.widgetId && config.widgetId.trim() !== "") {
        return config.widgetId.trim()
    }
    if (typeof window === "undefined") return "cb_default"
    try {
        const saved = localStorage.getItem("chat_bubbles_widget_id")
        if (saved && saved.trim() !== "") return saved.trim()
        const newId = "cb_" + Math.random().toString(36).slice(2, 10)
        localStorage.setItem("chat_bubbles_widget_id", newId)
        return newId
    } catch {
        return "cb_default"
    }
}

export function getTodayKey(d: Date = new Date()): string {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function getStoredAnalytics(): StoredAnalytics {
    if (typeof window === "undefined") {
        return { days: {}, totalViews: 0, totalClicks: 0 }
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { days: {}, totalViews: 0, totalClicks: 0 }
        const parsed = JSON.parse(raw)
        return {
            days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
            totalViews: Number(parsed.totalViews) || 0,
            totalClicks: Number(parsed.totalClicks) || 0,
        }
    } catch {
        return { days: {}, totalViews: 0, totalClicks: 0 }
    }
}

export function saveStoredAnalytics(store: StoredAnalytics): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
        window.dispatchEvent(new CustomEvent("chat_bubbles_analytics_updated", { detail: store }))
    } catch {}
}

export function recordAnalyticsView(widgetId?: string): void {
    const store = getStoredAnalytics()
    const today = getTodayKey()
    if (!store.days[today]) {
        store.days[today] = { views: 0, clicks: 0, channels: {} }
    }
    store.days[today].views = (store.days[today].views || 0) + 1
    store.totalViews = (store.totalViews || 0) + 1
    saveStoredAnalytics(store)

    // Remote sync
    const id = widgetId || getStoredWidgetId()
    try {
        fetch(`${BACKEND_ANALYTICS_URL}/api/analytics/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ widgetId: id, eventType: "view" }),
        }).catch(() => {})
    } catch {}
}

export function recordAnalyticsClick(channelId: ChannelId | string, widgetId?: string): void {
    if (!channelId) return
    const store = getStoredAnalytics()
    const today = getTodayKey()
    if (!store.days[today]) {
        store.days[today] = { views: 0, clicks: 0, channels: {} }
    }
    store.days[today].clicks = (store.days[today].clicks || 0) + 1
    if (!store.days[today].channels) {
        store.days[today].channels = {}
    }
    store.days[today].channels[channelId] = (store.days[today].channels[channelId] || 0) + 1
    store.totalClicks = (store.totalClicks || 0) + 1
    saveStoredAnalytics(store)

    // Remote sync
    const id = widgetId || getStoredWidgetId()
    try {
        fetch(`${BACKEND_ANALYTICS_URL}/api/analytics/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ widgetId: id, eventType: "click", channel: channelId }),
        }).catch(() => {})
    } catch {}
}

export function clearAnalyticsData(): void {
    const fresh: StoredAnalytics = { days: {}, totalViews: 0, totalClicks: 0 }
    saveStoredAnalytics(fresh)
}

export function formatViews(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k"
    }
    return num.toString()
}

export function formatNumber(num: number): string {
    return num.toLocaleString()
}

export function getXAxisLabels(period: AnalyticsPeriod): string[] {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    if (period === "Last 7 days") {
        const labels: string[] = []
        const today = new Date()
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(today.getDate() - i)
            labels.push(daysOfWeek[d.getDay()])
        }
        return labels
    }

    if (period === "Last 30 days") {
        const labels: string[] = []
        const today = new Date()
        for (let i = 11; i >= 0; i--) {
            const d = new Date()
            d.setDate(today.getDate() - Math.round(i * 2.5))
            labels.push(String(d.getDate()))
        }
        return labels
    }

    if (period === "Last 6 months") {
        const labels: string[] = []
        const today = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(today.getMonth() - i)
            labels.push(months[d.getMonth()].substring(0, 3))
        }
        return labels
    }

    return []
}

export function getStoredOrFallbackAnalytics(
    period: AnalyticsPeriod,
    channels: ChatChannel[]
): AnalyticsData {
    const store = getStoredAnalytics()
    const xLabels = getXAxisLabels(period)
    const bars: AnalyticsBar[] = []

    let totalPeriodViews = store.totalViews || 0
    let totalPeriodClicks = store.totalClicks || 0

    const maxBarValue = Math.max(totalPeriodClicks, 0)
    const maxY = maxBarValue > 0 ? Math.max(10, Math.ceil(maxBarValue * 1.25)) : 10
    const midY = Math.round(maxY / 2)

    for (let i = 0; i < xLabels.length; i++) {
        const isLast = i === xLabels.length - 1
        const val = isLast ? totalPeriodClicks : 0
        const percentage = maxY > 0 && val > 0
            ? Math.min(100, Math.max(8, Math.round((val / maxY) * 100)))
            : 0
        bars.push({
            label: xLabels[i] || "",
            value: val,
            percentage,
            highlight: isLast && val > 0,
        })
    }

    // Accurate CRO conversion rate: (clicks / views) * 100, capped at 100%
    const convRate = totalPeriodViews > 0 && totalPeriodClicks > 0
        ? (Math.min(100, (totalPeriodClicks / Math.max(totalPeriodViews, totalPeriodClicks)) * 100)).toFixed(1) + "%"
        : "0.0%"

    const activeChannels = channels.filter((c) => c.enabled && c.value.trim() !== "")
    const displayChannels = activeChannels.length > 0 ? activeChannels : channels.slice(0, 4)
    const channelStats: ChannelStat[] = displayChannels.map((channel, idx) => {
        const count = idx === 0 ? totalPeriodClicks : 0
        const percentage = totalPeriodClicks > 0 && idx === 0 ? 100 : 0
        return {
            id: channel.id,
            label: channel.label,
            color: channel.color,
            clicks: count,
            percentage,
        }
    })

    return {
        views: totalPeriodViews,
        clicks: totalPeriodClicks,
        convRate,
        bars,
        channelStats,
        maxY,
        midY,
        isRealData: false,
    }
}

export async function fetchAnalyticsData(
    widgetId: string,
    period: AnalyticsPeriod,
    channels: ChatChannel[]
): Promise<AnalyticsData> {
    const id = widgetId && widgetId.trim() !== "" ? widgetId.trim() : getStoredWidgetId()

    try {
        const res = await fetch(
            `${BACKEND_ANALYTICS_URL}/api/analytics/${encodeURIComponent(id)}?period=${encodeURIComponent(period)}`
        )
        if (!res.ok) throw new Error("Backend response error: " + res.status)

        const json = await res.json()
        const views = typeof json.views === "number" ? Math.max(0, json.views) : 0
        const clicks = typeof json.clicks === "number" ? Math.max(0, json.clicks) : 0

        // Accurate Conversion Rate Calculation:
        // Capped at 100%. If 0 views, conversion rate is 0.0%
        let convRate = "0.0%"
        if (views > 0 && clicks > 0) {
            const calculated = Math.min(100, (clicks / Math.max(views, clicks)) * 100)
            convRate = calculated.toFixed(1) + "%"
        }

        const rawBars = Array.isArray(json.bars) ? json.bars : []
        const xLabels = getXAxisLabels(period)
        const bars: AnalyticsBar[] = []

        const maxBarValue = Math.max(...rawBars.map((b: any) => Number(b?.value) || 0), 0)
        const maxY = maxBarValue > 0 ? Math.max(10, Math.ceil(maxBarValue * 1.25)) : 10
        const midY = Math.round(maxY / 2)

        for (let i = 0; i < xLabels.length; i++) {
            const rawBar = rawBars[i]
            const val = rawBar ? (Number(rawBar.value) || 0) : 0
            const percentage = maxY > 0 && val > 0
                ? Math.min(100, Math.max(12, Math.round((val / maxY) * 100)))
                : 0
            const isHighlight = Boolean(rawBar?.highlight) || (val === maxBarValue && maxBarValue > 0)

            bars.push({
                label: xLabels[i] || "",
                value: val,
                percentage,
                highlight: isHighlight,
            })
        }

        const activeChannels = channels.filter((c) => c.enabled && c.value.trim() !== "")
        const displayChannels = activeChannels.length > 0 ? activeChannels : channels.slice(0, 4)
        const channelStats: ChannelStat[] = displayChannels.map((ch, idx) => {
            const chClicks = clicks > 0 && idx === 0 ? clicks : 0
            const percentage = clicks > 0 && idx === 0 ? 100 : 0
            return {
                id: ch.id,
                label: ch.label,
                color: ch.color,
                clicks: chClicks,
                percentage,
            }
        })

        return {
            views,
            clicks,
            convRate,
            bars,
            channelStats,
            maxY,
            midY,
            isRealData: true,
        }
    } catch (err) {
        console.warn("[ChatBubbles] Remote analytics fetch failed, falling back to local:", err)
        return getStoredOrFallbackAnalytics(period, channels)
    }
}
