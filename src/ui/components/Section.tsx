import type { ReactNode } from "react"

export function Section({
    title,
    description,
    badge,
    action,
    children,
}: {
    title: string
    description?: string
    badge?: ReactNode
    action?: ReactNode
    children?: ReactNode
}) {
    return (
        <section className="cf-section">
            <div className={`cf-section-header${action ? " has-action" : ""}`}>
                <div className="cf-section-header-info">
                    <div className="cf-section-title-row">
                        <h2 className="cf-section-title">{title}</h2>
                        {badge}
                    </div>
                    {description ? <p className="cf-section-desc">{description}</p> : null}
                </div>
                {action ? <div className="cf-section-action">{action}</div> : null}
            </div>
            {children ? <div className="cf-section-body">{children}</div> : null}
        </section>
    )
}
