import type { ChannelId, ChatChannel } from "../types"

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

const STORAGE_KEY = "chat_bubbles_analytics_data_v1"

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

export function recordAnalyticsView(): void {
    const store = getStoredAnalytics()
    const today = getTodayKey()
    if (!store.days[today]) {
        store.days[today] = { views: 0, clicks: 0, channels: {} }
    }
    store.days[today].views = (store.days[today].views || 0) + 1
    store.totalViews = (store.totalViews || 0) + 1
    saveStoredAnalytics(store)
}

export function recordAnalyticsClick(channelId: ChannelId | string): void {
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

export function generateAnalytics(period: AnalyticsPeriod, channels: ChatChannel[]): AnalyticsData {
    const store = getStoredAnalytics()
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    let totalPeriodViews = 0
    let totalPeriodClicks = 0
    const periodChannelClicks: Record<string, number> = {}
    const bars: AnalyticsBar[] = []

    if (period === "Last 7 days") {
        const today = new Date()
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(today.getDate() - i)
            const dateKey = getTodayKey(d)
            const dayRecord = store.days[dateKey]
            const dayClicks = dayRecord?.clicks || 0
            const dayViews = dayRecord?.views || 0

            totalPeriodViews += dayViews
            totalPeriodClicks += dayClicks

            if (dayRecord?.channels) {
                for (const [chId, count] of Object.entries(dayRecord.channels)) {
                    periodChannelClicks[chId] = (periodChannelClicks[chId] || 0) + count
                }
            }

            bars.push({
                label: daysOfWeek[d.getDay()],
                value: dayClicks,
                percentage: 0,
                highlight: false,
            })
        }
    } else if (period === "Last 30 days") {
        // 10 3-day blocks across the 30 days
        const today = new Date()
        for (let i = 9; i >= 0; i--) {
            let intervalClicks = 0
            let intervalViews = 0
            let blockLabel = ""

            for (let sub = 2; sub >= 0; sub--) {
                const dayOffset = i * 3 + sub
                const d = new Date()
                d.setDate(today.getDate() - dayOffset)
                const dateKey = getTodayKey(d)
                const dayRecord = store.days[dateKey]

                intervalClicks += dayRecord?.clicks || 0
                intervalViews += dayRecord?.views || 0

                if (dayRecord?.channels) {
                    for (const [chId, count] of Object.entries(dayRecord.channels)) {
                        periodChannelClicks[chId] = (periodChannelClicks[chId] || 0) + count
                    }
                }

                if (sub === 1) {
                    blockLabel = `${months[d.getMonth()]} ${d.getDate()}`
                }
            }

            totalPeriodViews += intervalViews
            totalPeriodClicks += intervalClicks

            bars.push({
                label: blockLabel,
                value: intervalClicks,
                percentage: 0,
                highlight: false,
            })
        }
    } else if (period === "Last 6 months") {
        const today = new Date()
        for (let i = 5; i >= 0; i--) {
            const target = new Date(today.getFullYear(), today.getMonth() - i, 1)
            const targetYear = target.getFullYear()
            const targetMonth = target.getMonth()
            const monthLabel = months[targetMonth]

            let monthClicks = 0
            let monthViews = 0

            for (const [dateKey, dayRecord] of Object.entries(store.days)) {
                const [y, m] = dateKey.split("-").map(Number)
                if (y === targetYear && m === targetMonth + 1) {
                    monthClicks += dayRecord.clicks || 0
                    monthViews += dayRecord.views || 0
                    if (dayRecord.channels) {
                        for (const [chId, count] of Object.entries(dayRecord.channels)) {
                            periodChannelClicks[chId] = (periodChannelClicks[chId] || 0) + count
                        }
                    }
                }
            }

            totalPeriodViews += monthViews
            totalPeriodClicks += monthClicks

            bars.push({
                label: monthLabel,
                value: monthClicks,
                percentage: 0,
                highlight: false,
            })
        }
    }

    // Determine scale: if 0 clicks, default maxY to 10 for clean baseline
    const maxBarValue = Math.max(...bars.map((b) => b.value), 0)
    const maxY = maxBarValue > 0 ? Math.max(10, Math.ceil(maxBarValue * 1.25)) : 10
    const midY = Math.round(maxY / 2)

    // Calculate percentage heights and highlight the peak day
    for (const bar of bars) {
        if (maxY > 0 && bar.value > 0) {
            bar.percentage = Math.min(100, Math.max(8, Math.round((bar.value / maxY) * 100)))
            if (bar.value === maxBarValue && maxBarValue > 0) {
                bar.highlight = true
            }
        } else {
            bar.percentage = 0
            bar.highlight = false
        }
    }

    // Conversion rate
    const convRate = totalPeriodViews > 0
        ? ((totalPeriodClicks / totalPeriodViews) * 100).toFixed(1) + "%"
        : "0.0%"

    // Channels breakdown based on real clicks
    const activeChannels = channels.filter((c) => c.enabled && c.value.trim() !== "")
    const displayChannels = activeChannels.length > 0 ? activeChannels : channels.slice(0, 4)

    const channelStats: ChannelStat[] = displayChannels.map((channel) => {
        const chClicks = periodChannelClicks[channel.id] || 0
        const percentage = totalPeriodClicks > 0
            ? Math.min(100, Math.round((chClicks / totalPeriodClicks) * 100))
            : 0

        return {
            id: channel.id,
            label: channel.label,
            color: channel.color,
            clicks: chClicks,
            percentage,
        }
    })

    // Sort channels by clicks descending
    channelStats.sort((a, b) => b.clicks - a.clicks)

    return {
        views: totalPeriodViews,
        clicks: totalPeriodClicks,
        convRate,
        bars,
        channelStats,
        maxY,
        midY,
        isRealData: true,
    }
}
