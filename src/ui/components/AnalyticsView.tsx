import React, { useEffect, useMemo, useRef, useState } from "react"
import type { ChatChannel } from "../../types"
import { renderChannelSvg } from "../../widget/icons"
import {
    type AnalyticsPeriod,
    generateAnalytics,
    formatNumber,
    formatViews,
} from "../../core/analytics"
import {
    IconAnalyticsOff,
    IconChevronDown,
    IconEye,
    IconMousePointer,
    IconSparkles,
    IconTrendingUp,
} from "../icons"

interface AnalyticsViewProps {
    enabled: boolean
    onToggleEnabled: (enabled: boolean) => void
    channels: ChatChannel[]
    onNavigateToSettings: () => void
}

const PERIODS: AnalyticsPeriod[] = ["Last 7 days", "Last 30 days", "Last 6 months"]

export function AnalyticsView({
    enabled,
    onToggleEnabled: _onToggleEnabled,
    channels,
    onNavigateToSettings,
}: AnalyticsViewProps) {
    const [period, setPeriod] = useState<AnalyticsPeriod>("Last 7 days")
    const [periodOpen, setPeriodOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Listen to local interaction updates without off-platform network transmission
    useEffect(() => {
        function handleUpdate() {
            setRefreshKey((k) => k + 1)
        }
        window.addEventListener("chat_bubbles_analytics_updated", handleUpdate)
        window.addEventListener("chat_bubbles_interaction", handleUpdate)
        window.addEventListener("chat_bubbles_view", handleUpdate)
        window.addEventListener("storage", handleUpdate)
        return () => {
            window.removeEventListener("chat_bubbles_analytics_updated", handleUpdate)
            window.removeEventListener("chat_bubbles_interaction", handleUpdate)
            window.removeEventListener("chat_bubbles_view", handleUpdate)
            window.removeEventListener("storage", handleUpdate)
        }
    }, [])

    // Close period dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setPeriodOpen(false)
            }
        }
        if (periodOpen) {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [periodOpen])

    // Generate deterministic local analytics (matching Crestbar pattern, 100% offline & local)
    const data = useMemo(
        () => generateAnalytics(period, channels),
        [period, channels, refreshKey]
    )

    if (!enabled) {
        return (
            <div className="cf-analytics-page">
                <div className="cf-analytics-disabled-state">
                    <div className="cf-analytics-disabled-icon">
                        <IconAnalyticsOff size={32} />
                    </div>
                    <h2 className="cf-analytics-disabled-title">
                        Analytics is disabled
                    </h2>
                    <p className="cf-analytics-disabled-desc">
                        Enable analytics in settings to track views, clicks, and conversion rates across your channels.
                    </p>
                    <button
                        type="button"
                        className="cf-btn cf-btn-primary"
                        onClick={onNavigateToSettings}
                    >
                        Go to Settings
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="cf-analytics-page">
            {/* Header with Period Selector */}
            <div className="cf-analytics-header">
                <div>
                    <h1 className="cf-analytics-title">Widget Analytics</h1>
                    <p className="cf-analytics-subtitle">
                        Performance metrics for your chat launcher
                    </p>
                </div>

                <div className="cf-analytics-period-wrapper" ref={dropdownRef}>
                    <button
                        type="button"
                        className="cf-analytics-period-btn"
                        onClick={() => setPeriodOpen(!periodOpen)}
                    >
                        <span>{period}</span>
                        <IconChevronDown
                            size={14}
                            className={`cf-chevron ${periodOpen ? "is-open" : ""}`}
                        />
                    </button>

                    {periodOpen && (
                        <div className="cf-analytics-dropdown">
                            {PERIODS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`cf-analytics-dropdown-item ${p === period ? "is-active" : ""}`}
                                    onClick={() => {
                                        setPeriod(p)
                                        setPeriodOpen(false)
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="cf-analytics-stats-grid">
                <div className="cf-stat-card">
                    <div className="cf-stat-header">
                        <span className="cf-stat-label">Total Views</span>
                        <div className="cf-stat-icon cf-stat-icon-blue">
                            <IconEye size={16} />
                        </div>
                    </div>
                    <div className="cf-stat-value">{formatViews(data.views)}</div>
                    <div className="cf-stat-hint">Impressions on site</div>
                </div>

                <div className="cf-stat-card">
                    <div className="cf-stat-header">
                        <span className="cf-stat-label">Total Clicks</span>
                        <div className="cf-stat-icon cf-stat-icon-green">
                            <IconMousePointer size={16} />
                        </div>
                    </div>
                    <div className="cf-stat-value">{formatNumber(data.clicks)}</div>
                    <div className="cf-stat-hint">Interactions with channels</div>
                </div>

                <div className="cf-stat-card">
                    <div className="cf-stat-header">
                        <span className="cf-stat-label">Conversion Rate</span>
                        <div className="cf-stat-icon cf-stat-icon-purple">
                            <IconTrendingUp size={16} />
                        </div>
                    </div>
                    <div className="cf-stat-value">{data.convRate}</div>
                    <div className="cf-stat-hint">Click-through percentage</div>
                </div>
            </div>

            {/* Main Bar Chart */}
            <div className="cf-analytics-chart-card">
                <div className="cf-chart-header">
                    <h2 className="cf-chart-title">Clicks Overview</h2>
                    <span className="cf-chart-badge">{period}</span>
                </div>

                <div className="cf-chart-body">
                    <div className="cf-chart-y-axis">
                        <span>{data.maxY}</span>
                        <span>{data.midY}</span>
                        <span>0</span>
                    </div>

                    <div className="cf-chart-grid">
                        <div className="cf-chart-grid-line" style={{ top: "0%" }} />
                        <div className="cf-chart-grid-line" style={{ top: "50%" }} />
                        <div className="cf-chart-grid-line" style={{ top: "100%" }} />

                        <div className="cf-chart-bars-container">
                            {data.bars.map((bar, idx) => (
                                <div key={idx} className="cf-chart-bar-col">
                                    <div className="cf-chart-bar-track">
                                        <div
                                            className={`cf-chart-bar-fill ${bar.highlight ? "is-highlight" : ""}`}
                                            style={{ height: `${bar.percentage}%` }}
                                        >
                                            <div className="cf-chart-bar-tooltip">
                                                {formatNumber(bar.value)} clicks
                                            </div>
                                        </div>
                                    </div>
                                    <span className="cf-chart-x-label">{bar.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Channel Breakdown List */}
            <div className="cf-analytics-channels-card">
                <h2 className="cf-chart-title">Performance by Channel</h2>

                <div className="cf-channel-stats-list">
                    {data.channelStats.map((channel) => {
                        const progressStyle: React.CSSProperties = {
                            width: `${channel.percentage}%`,
                            backgroundColor: channel.color,
                        }
                        const badgeStyle: React.CSSProperties = {
                            backgroundColor: channel.color,
                        }

                        return (
                            <div key={channel.id} className="cf-channel-stat-row">
                                <div className="cf-channel-stat-meta">
                                    <div className="cf-channel-stat-brand">
                                        <span
                                            className="cf-channel-stat-badge"
                                            style={badgeStyle}
                                        >
                                            {renderChannelSvg(channel.id, 16)}
                                        </span>
                                        <span className="cf-channel-stat-name">
                                            {channel.label}
                                        </span>
                                    </div>
                                    <div className="cf-channel-stat-count">
                                        <span className="cf-channel-stat-clicks">
                                            {formatNumber(channel.clicks)} clicks
                                        </span>
                                        <span className="cf-channel-stat-pct">
                                            {channel.percentage}%
                                        </span>
                                    </div>
                                </div>

                                <div className="cf-channel-stat-bar-track">
                                    <div
                                        className="cf-channel-stat-bar-fill"
                                        style={progressStyle}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Pro Notice / Footer */}
            <div className="cf-analytics-footer-note">
                <IconSparkles size={14} />
                <span>
                    Analytics data is tracked entirely within your browser for fast, private reporting.
                </span>
            </div>
        </div>
    )
}
