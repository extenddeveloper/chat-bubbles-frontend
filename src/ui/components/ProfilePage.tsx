import { useEffect, useState } from "react"
import { framer } from "@framer/plugin"
import { IconCrown, IconCheck, IconArrowLeft } from "../icons"

export interface ProfilePageProps {
    onBack: () => void
    onManageSubscription?: () => void
}

export function ProfilePage({ onBack, onManageSubscription }: ProfilePageProps) {
    const [userName, setUserName] = useState<string>("Site Owner")
    const [userEmail, setUserEmail] = useState<string>("owner@framer.website")
    const [plan] = useState<string>("Chat Bubbles Pro")

    useEffect(() => {
        let isMounted = true
        async function loadSiteInfo() {
            try {
                if (typeof (framer as any).getSiteInfo === "function") {
                    const info = await (framer as any).getSiteInfo()
                    if (!isMounted) return
                    if (info?.userName) setUserName(info.userName)
                    if (info?.userEmail) setUserEmail(info.userEmail)
                }
            } catch {
                // fallback to default
            }
        }
        void loadSiteInfo()
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <div className="cf-profile-page">
            <div className="cf-profile-top-bar">
                <button
                    type="button"
                    className="cf-btn-back"
                    onClick={onBack}
                    aria-label="Back to previous view"
                >
                    <IconArrowLeft size={14} />
                    <span>Back</span>
                </button>
                <span className="cf-profile-top-title">Account & Profile</span>
            </div>

            <div className="cf-profile-hero">
                <div className="cf-profile-avatar-wrap">
                    <div className="cf-profile-avatar-ring">
                        <div className="cf-profile-avatar-circle">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <span className="cf-profile-pro-badge">
                        <IconCrown size={12} />
                        <span>PRO</span>
                    </span>
                </div>

                <div className="cf-profile-identity">
                    <h2 className="cf-profile-name">{userName}</h2>
                    <span className="cf-profile-email">{userEmail}</span>
                </div>
            </div>

            <div className="cf-profile-card">
                <div className="cf-profile-card-header">
                    <div>
                        <span className="cf-profile-card-eyebrow">CURRENT PLAN</span>
                        <h3 className="cf-profile-plan-title">{plan}</h3>
                    </div>
                    <span className="cf-badge cf-badge-brand">Active</span>
                </div>

                <div className="cf-profile-features">
                    <div className="cf-profile-feature-item">
                        <IconCheck size={14} className="cf-feature-check" />
                        <span>12+ Instant Communication Channels</span>
                    </div>
                    <div className="cf-profile-feature-item">
                        <IconCheck size={14} className="cf-feature-check" />
                        <span>Unlimited Multi-Agent Support Team</span>
                    </div>
                    <div className="cf-profile-feature-item">
                        <IconCheck size={14} className="cf-feature-check" />
                        <span>Full Custom Themes & Color Gradients</span>
                    </div>
                    <div className="cf-profile-feature-item">
                        <IconCheck size={14} className="cf-feature-check" />
                        <span>Canvas Style Controls & Zero Watermarks</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="primary-cta cf-profile-cta"
                    onClick={onManageSubscription}
                >
                    <IconCrown size={16} />
                    <span>Manage Subscription</span>
                </button>
            </div>

            <div className="cf-profile-footer-info">
                <span>Chat Bubbles Plugin · v1.0.0</span>
            </div>
        </div>
    )
}
