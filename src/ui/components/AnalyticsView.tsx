import React, { useEffect, useMemo, useRef, useState } from "react"
import type { ChatChannel } from "../../types"
import { ICONS } from "../../widget/icons"
import {
    type AnalyticsPeriod,
    formatNumber,
    formatViews,
    generateAnalytics,
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
    onToggleEnabled,
    channels,
    onNavigateToSettings,
}: AnalyticsViewProps) {
    const [period, setPeriod] = useState<AnalyticsPeriod>("Last 7 days")
    const [periodOpen, setPeriodOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

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

    const data = useMemo(() => generateAnalytics(period, channels), [period, channels])

    if (!enabled) {
        return (
            <div className="cf-analytics-page">
                <div className="cf-analytics-disabled-state">
                    <div className="cf-analytics-disabled-icon">
                        <IconAnalyticsOff size={28} />
                    </div>
                    <h3 className="cf-analytics-disabled-title">Analytics is disabled</h3>
                    <p className="cf-analytics-disabled-desc">
                        Turn on Widget Analytics in <strong>Settings</strong> to track views and clicks.
                    </p>
                    <div className="cf-analytics-disabled-actions">
                        <button
                            type="button"
                            className="primary-cta"
                            onClick={() => onToggleEnabled(true)}
                        >
                            <IconSparkles size={14} />
                            <span>Enable Widget Analytics</span>
                        </button>
                        <button
                            type="button"
                            className="secondary-cta"
                            onClick={onNavigateToSettings}
                        >
                            Go to Settings
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="cf-analytics-page">
            {/* Header & Filter */}
            <div className="cf-analytics-header">
                <div className="cf-analytics-title-group">
                    <h3 className="cf-analytics-title">Widget Analytics</h3>
                    <span className="cf-analytics-subtitle">
                        Visitor engagement & conversion metrics
                    </span>
                </div>

                <div className="cf-analytics-filter" ref={dropdownRef}>
                    <button
                        type="button"
                        className="cf-analytics-dropdown-btn"
                        onClick={() => setPeriodOpen(!periodOpen)}
                        aria-expanded={periodOpen}
                        aria-label="Select analytics reporting period"
                    >
                        <span>{period}</span>
                        <IconChevronDown
                            size={14}
                            className={"cf-analytics-dropdown-chevron" + (periodOpen ? " is-open" : "")}
                        />
                    </button>

                    {periodOpen && (
                        <ul className="cf-analytics-dropdown-menu">
                            {PERIODS.map((p) => (
                                <li
                                    key={p}
                                    className={"cf-analytics-dropdown-item" + (p === period ? " is-active" : "")}
                                    onClick={() => {
                                        setPeriod(p)
                                        setPeriodOpen(false)
                                    }}
                                >
                                    {p}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* 3 KPI Summary Cards */}
            <div className="cf-analytics-kpi-grid">
                <div className="cf-analytics-kpi-card">
                    <div className="cf-analytics-kpi-header">
                        <span className="cf-analytics-kpi-label">Views</span>
                        <span className="cf-analytics-kpi-icon cf-kpi-views">
                            <IconEye size={13} />
                        </span>
                    </div>
                    <div className="cf-analytics-kpi-val">{formatViews(data.views)}</div>
                    <div className="cf-analytics-kpi-trend">
                        <span>Total impressions</span>
                    </div>
                </div>

                <div className="cf-analytics-kpi-card">
                    <div className="cf-analytics-kpi-header">
                        <span className="cf-analytics-kpi-label">Clicks</span>
                        <span className="cf-analytics-kpi-icon cf-kpi-clicks">
                            <IconMousePointer size={13} />
                        </span>
                    </div>
                    <div className="cf-analytics-kpi-val">{formatNumber(data.clicks)}</div>
                    <div className="cf-analytics-kpi-trend">
                        <span>Channel interactions</span>
                    </div>
                </div>

                <div className="cf-analytics-kpi-card">
                    <div className="cf-analytics-kpi-header">
                        <span className="cf-analytics-kpi-label">Conv. Rate</span>
                        <span className="cf-analytics-kpi-icon cf-kpi-rate">
                            <IconTrendingUp size={13} />
                        </span>
                    </div>
                    <div className="cf-analytics-kpi-val">{data.convRate}</div>
                    <div className="cf-analytics-kpi-trend">
                        <span>Click-through rate</span>
                    </div>
                </div>
            </div>

            {/* Interactive Clicks Bar Chart */}
            <div className="cf-analytics-chart-card">
                <div className="cf-analytics-chart-header">
                    <div className="cf-analytics-chart-title">
                        Clicks over the {period.toLowerCase()}
                    </div>
                    <span className="cf-analytics-chart-badge">Daily Volume</span>
                </div>

                <div className="cf-analytics-chart-wrapper">
                    {/* Y-Axis Labels */}
                    <div className="cf-chart-y-axis">
                        <span>{formatViews(data.maxY)}</span>
                        <span>{formatViews(data.midY)}</span>
                        <span>0</span>
                    </div>

                    {/* Chart Canvas & Grid */}
                    <div className="cf-chart-stage">
                        {/* Dashed Reference Lines */}
                        <div className="cf-chart-grid-line cf-grid-top" />
                        <div className="cf-chart-grid-line cf-grid-mid" />
                        <div className="cf-chart-grid-line cf-grid-bottom" />

                        {/* Bars flex track */}
                        <div className="cf-chart-bars-track">
                            {data.bars.map((bar, idx) => {
                                const barFillStyle: React.CSSProperties = {
                                    height: `${bar.percentage}%`,
                                }
                                return (
                                    <div key={idx} className="cf-chart-bar-column">
                                        <div
                                            className={"cf-chart-bar-fill" + (bar.highlight ? " is-highlight" : "")}
                                            style={barFillStyle}
                                            title={`${bar.label}: ${formatNumber(bar.value)} clicks`}
                                        >
                                            <div className="cf-chart-bar-tooltip">
                                                {formatNumber(bar.value)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="cf-chart-x-axis">
                            {data.bars.map((bar, idx) => (
                                <div key={idx} className="cf-chart-x-label">
                                    {bar.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Channel Performance Breakdown */}
            <div className="cf-analytics-channels-card">
                <div className="cf-analytics-channels-header">
                    <div className="cf-analytics-channels-title">Channel Breakdown</div>
                    <div className="cf-analytics-channels-desc">
                        Conversion distribution by communication channel
                    </div>
                </div>

                <div className="cf-analytics-channels-list">
                    {data.channelStats.map((channel) => {
                        const progressStyle: React.CSSProperties = {
                            width: `${channel.percentage}%`,
                            backgroundColor: channel.color,
                        }
                        const badgeStyle: React.CSSProperties = {
                            backgroundColor: channel.color,
                        }
                        const iconSvg = ICONS[channel.id] || ""

                        return (
                            <div key={channel.id} className="cf-channel-stat-row">
                                <div className="cf-channel-stat-meta">
                                    <div className="cf-channel-stat-brand">
                                        <span
                                            className="cf-channel-stat-badge"
                                            style={badgeStyle}
                                            dangerouslySetInnerHTML={{ __html: iconSvg }}
                                        />
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
        </div>
    )
}
