import React from "react"

export interface HelpTileProps {
    label: string
    icon: React.ReactNode
    onClick?: () => void
    href?: string
}

export function HelpCard({ label, icon, onClick, href }: HelpTileProps) {
    const content = (
        <>
            <div className="help-card-icon">
                {icon}
            </div>
            <h4>{label}</h4>
        </>
    )

    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="help-card">
                {content}
            </a>
        )
    }

    return (
        <button type="button" className="help-card" onClick={onClick}>
            {content}
        </button>
    )
}

export function HelpRow({
    onOpenGuide,
    onContactUs,
    onFeatureRequest,
}: {
    onOpenGuide?: () => void
    onContactUs?: () => void
    onFeatureRequest?: () => void
    hasNewUpdate?: boolean
}) {
    return (
        <div className="help-categories">
            <HelpCard
                label="Guide"
                icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 18H17V16H7V18ZM7 14H17V12H7V14ZM7 10H11V8H7V10ZM3 22V2C3 1.45 3.19583 0.979167 3.5875 0.5875C3.97917 0.195833 4.45 0 5 0H15L21 6V22C21 22.55 20.8042 23.0208 20.4125 23.4125C20.0208 23.8042 19.55 24 19 24H5C4.45 24 3.97917 23.8042 3.5875 23.4125C3.19583 23.0208 3 22.55 3 22ZM14 7V2H5V22H19V7H14Z" fill="#5271FF" />
                    </svg>
                }
                onClick={onOpenGuide}
                href="https://framefic.com/docs/chat-bubbles/"
            />
            <HelpCard
                label="Get Support"
                icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8L12 13L20 8V18ZM12 11L4 6H20L12 11Z" fill="#5271FF" />
                    </svg>
                }
                onClick={onContactUs}
                href="https://framefic.com/support/"
            />
            <HelpCard
                label="Feature Request"
                icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 13H5V11H3V13ZM3 17H5V15H3V17ZM3 9H5V7H3V9ZM7 13H21V11H7V13ZM7 17H21V15H7V17ZM7 7V9H21V7H7Z" fill="#5271FF" />
                    </svg>
                }
                onClick={onFeatureRequest}
                href="https://framefic.com/feature-requests/"
            />
        </div>
    )
}
