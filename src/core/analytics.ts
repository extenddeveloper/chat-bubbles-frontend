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

const STORAGE_KEY = "chat_bubbles_analytics_data_v1"

// Clear old local test click artifacts so the clean Crestbar generator is active
try {
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY)
    }
} catch {}

// Seed-based pseudo-random generator matching Crestbar to make analytics deterministic but look realistic
export const getDeterministicRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

export function formatViews(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + "k"
    }
    return num.toString()
}

export function formatNumber(num: number): string {
    return num.toLocaleString()
}

export function recordAnalyticsView(): void {}
export function recordAnalyticsClick(_channelId: ChannelId | string): void {}
export function clearAnalyticsData(): void {
    try {
        if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY)
        }
    } catch {}
}

export const getXAxisLabels = (period: AnalyticsPeriod): string[] => {
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
        // 12 bars across 30 days means each bar represents ~2.5 days
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

/**
 * Generates realistic analytics data following the Framer-Crestbar engine.
 * Once a dedicated Chat Bubbles backend is deployed, this function serves as the seamless
 * offline fallback when the backend is unreachable or returning empty stats.
 */
export function generateAnalytics(
    period: AnalyticsPeriod,
    channels: ChatChannel[],
    customSeed?: number
): AnalyticsData {
    const seed = customSeed || 12345

    // Base views (40k to 150k) and conversion rate (5% to 17%) matching Crestbar
    const baseViews = Math.floor(40000 + getDeterministicRandom(seed) * 110000)
    const baseConvRate = 0.05 + getDeterministicRandom(seed + 1) * 0.12

    let multiplier = 1
    let numBars = 7

    if (period === "Last 30 days") {
        multiplier = 4.2
        numBars = 12 // 12 bars is clean for a monthly view
    } else if (period === "Last 6 months") {
        multiplier = 24.5
        numBars = 6
    }

    const views = Math.floor(baseViews * multiplier)
    const clicks = Math.floor(views * baseConvRate)
    const convRate = (baseConvRate * 100).toFixed(1) + "%"

    const xLabels = getXAxisLabels(period)
    const bars: AnalyticsBar[] = []
    const maxBarValue = (clicks / numBars) * 1.6

    for (let i = 0; i < numBars; i++) {
        const barFactor = 0.5 + getDeterministicRandom(seed + i + 5) * 1.1
        const barValue = Math.floor((clicks / numBars) * barFactor)
        const percentage = Math.min(100, Math.max(15, Math.round((barValue / maxBarValue) * 100)))

        let highlight = false
        if (numBars === 7) {
            // For 7 days, highlight the middle 3 peak days matching Crestbar
            highlight = i === 3 || i === 4 || i === 5
        } else if (numBars === 6) {
            highlight = i === 2 || i === 3 || i === 4
        } else {
            // For 12 bars, highlight the middle 4 bars
            highlight = i >= 4 && i <= 7
        }

        bars.push({
            label: xLabels[i] || `Day ${i + 1}`,
            value: barValue,
            percentage,
            highlight,
        })
    }

    // Chart Y-Axis Scale
    const maxVal = Math.max(...bars.map((b) => b.value)) || 10
    const maxY = Math.ceil(maxVal * 1.15)
    const midY = Math.round(maxY / 2)

    // Performance by Channel breakdown
    const activeChannels = channels.filter((c) => c.enabled && c.value.trim() !== "")
    const displayChannels = activeChannels.length > 0 ? activeChannels : channels.slice(0, 4)

    const rawWeights = displayChannels.map((_, idx) => {
        return 1 / (idx + 1.2) + getDeterministicRandom(seed + idx * 7 + 11) * 0.3
    })
    const totalWeight = rawWeights.reduce((sum, w) => sum + w, 0) || 1
    let remainingClicks = clicks

    const channelStats: ChannelStat[] = displayChannels.map((channel, idx) => {
        const rawPct = rawWeights[idx] / totalWeight
        const chClicks = idx === displayChannels.length - 1
            ? remainingClicks
            : Math.min(remainingClicks, Math.round(clicks * rawPct))
        remainingClicks = Math.max(0, remainingClicks - chClicks)
        const percentage = clicks > 0 ? Math.round((chClicks / clicks) * 100) : 0

        return {
            id: channel.id,
            label: channel.label,
            color: channel.color,
            clicks: chClicks,
            percentage,
        }
    })

    channelStats.sort((a, b) => b.clicks - a.clicks)

    return {
        views,
        clicks,
        convRate,
        bars,
        channelStats,
        maxY,
        midY,
        isRealData: false,
    }
}
