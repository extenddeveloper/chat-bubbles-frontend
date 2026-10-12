import React from "react"

interface FrameficCardProps {
    name: string
    description: string
    logoSrc?: string
    logoIcon?: React.ReactNode
    marketplaceUrl: string
}

export function FrameficCard({
    name,
    description,
    logoSrc,
    logoIcon,
    marketplaceUrl,
}: FrameficCardProps) {
    return (
        <a
            href={marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="help-product-card"
            aria-label={`Open ${name} on Framer Marketplace`}
        >
            <div className="product-icon">
                {logoSrc ? (
                    <img src={logoSrc} alt={name} className="promo-logo" />
                ) : (
                    logoIcon
                )}
            </div>
            <div className="product-info">
                <h5>{name}</h5>
                <p>{description}</p>
            </div>
            <div className="product-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M7 17L17 7M17 7H7M17 7V17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </a>
    )
}
