import React from "react"
import { IconSparkles } from "../icons"

interface HeroCardProps {
    title: string
    description: string
    badgeLabel?: string
    badgeType?: "brand" | "pro"
    badgeIcon?: React.ReactNode
    statusBadge?: React.ReactNode
    ctaLabel?: string
    ctaIcon?: React.ReactNode
    onCtaClick?: () => void
    disabled?: boolean
    illustration?: React.ReactNode
    children?: React.ReactNode
}

export function HeroCard({
    title,
    description,
    badgeLabel,
    badgeType = "brand",
    badgeIcon,
    statusBadge,
    ctaLabel,
    ctaIcon = <IconSparkles size={16} />,
    onCtaClick,
    disabled = false,
    illustration,
    children,
}: HeroCardProps) {
    return (
        <div className="cf-hero-card">
            {(badgeLabel || statusBadge || illustration) ? (
                <div className="cf-hero-card-header">
                    {badgeLabel ? (
                        <div className="cf-hero-card-badges">
                            <span className={`cf-badge cf-badge-${badgeType}`}>
                                {badgeIcon}
                                <span>{badgeLabel}</span>
                            </span>
                        </div>
                    ) : <div />}
                    {statusBadge || illustration}
                </div>
            ) : null}

            <div className="cf-hero-card-content">
                <h2 className="cf-hero-card-title">{title}</h2>
                <p className="cf-hero-card-desc">{description}</p>
            </div>

            {children ? (
                <div className="cf-hero-card-extra">
                    {children}
                </div>
            ) : null}

            {ctaLabel && onCtaClick ? (
                <button
                    type="button"
                    className="primary-cta cf-hero-cta"
                    onClick={onCtaClick}
                    disabled={disabled}
                >
                    <span>{ctaLabel}</span>
                    {ctaIcon}
                </button>
            ) : null}
        </div>
    )
}


