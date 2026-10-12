import { useEffect, useMemo, useRef, useState } from "react"
import { framer } from "@framer/plugin"
import { cloneDefaultConfig, normalizeConfig } from "./core/config"
import { loadConfig, saveConfig } from "./core/storage"
import { getCanvasInstancesCount, insertCanvasComponent } from "./framer/canvas-component-service"
import type { ChannelId, ChatAgent, ChatChannel, ChatConfig, ModalTheme } from "./types"
import { Field } from "./ui/components/Field"
import { Section } from "./ui/components/Section"
import { Switch } from "./ui/components/Switch"
import { HeroCard } from "./ui/components/HeroCard"
import { HelpRow } from "./ui/components/HelpRow"
import { ProfilePage } from "./ui/components/ProfilePage"
import { FrameficCard } from "./ui/components/FrameficCard"
import { CustomColorPicker } from "./ui/components/CustomColorPicker"
import { ICONS, LAUNCHER_ICONS } from "./widget/icons"
import { sanitizeAgent, sanitizeAvatarUrl, sanitizeChannel, sanitizeMultilineText, sanitizeText } from "./core/sanitize"
import {
    IconCamera,
    IconGear,
    IconX,
    IconUpload,
    IconUser,
    IconLink,
    IconRefresh,
    IconArrowLeft,
    IconArrowRight,
    IconSpinner,
    IconLayoutModal,
    IconLayoutButtons,
    IconPlus,
    IconSun,
    IconMoon,
    IconSparkles,
    IconExternalLink,
    IconVolume,
    IconChevronDown,
    IconNoticeInfo,
    IconNoticeSuccess,
    IconNoticeWarning,
    IconNoticeError,
} from "./ui/icons"
import { playNotificationChime } from "./core/sound"
import "./ui/styles.css"

type Tab = "home" | "builder" | "design" | "settings"
type BuilderSubTab = "channels" | "agents"

const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
]

const channelMeta: Record<ChannelId, { label: string; placeholder: string; hint: string }> = {
    whatsapp: {
        label: "WhatsApp Number",
        placeholder: "+1 234 567 8900",
        hint: "Include country code (e.g. +1 for US).",
    },
    messenger: {
        label: "Messenger Username / Page",
        placeholder: "username or page name",
        hint: "Facebook page username or profile handle without @.",
    },
    instagram: {
        label: "Instagram Username",
        placeholder: "username",
        hint: "Instagram account handle without @.",
    },
    telegram: {
        label: "Telegram Username",
        placeholder: "username",
        hint: "Telegram handle or public channel without @.",
    },
    tiktok: {
        label: "TikTok Username",
        placeholder: "username",
        hint: "TikTok handle without @.",
    },
    wechat: {
        label: "WeChat ID / QR URL",
        placeholder: "wechat_id or https://...",
        hint: "WeChat ID or full profile URL.",
    },
    viber: {
        label: "Viber Number",
        placeholder: "+1 234 567 8900",
        hint: "Phone number with country code.",
    },
    line: {
        label: "LINE ID",
        placeholder: "line_id",
        hint: "Official or personal LINE ID.",
    },
    signal: {
        label: "Signal ID / Link",
        placeholder: "username or link",
        hint: "Signal profile URL or identifier.",
    },
    phone: {
        label: "Phone Number",
        placeholder: "+1 234 567 8900",
        hint: "Direct dial phone number.",
    },
    sms: {
        label: "SMS Phone Number",
        placeholder: "+1 234 567 8900",
        hint: "Mobile number for SMS text messages.",
    },
    email: {
        label: "Email Address",
        placeholder: "hello@yourcompany.com",
        hint: "Contact email for visitors.",
    },
    discord: {
        label: "Discord Invite / Server",
        placeholder: "https://discord.gg/yourserver or invite code",
        hint: "Discord invite code or full invite URL.",
    },
    slack: {
        label: "Slack Workspace / Channel",
        placeholder: "https://join.slack.com/t/...",
        hint: "Public Slack community invite link or workspace URL.",
    },
    teams: {
        label: "Microsoft Teams User / Link",
        placeholder: "email@company.com or meeting link",
        hint: "User email or Teams direct conversation link.",
    },
    x: {
        label: "X (Twitter) Handle",
        placeholder: "username",
        hint: "X handle without @ or profile URL.",
    },
    linkedin: {
        label: "LinkedIn Profile / Company",
        placeholder: "in/username or company/name",
        hint: "Profile slug, company path, or full LinkedIn URL.",
    },
    maps: {
        label: "Google Maps Address / Link",
        placeholder: "1600 Amphitheatre Pkwy or Google Maps URL",
        hint: "Store address or Google Maps location link.",
    },
    custom: {
        label: "Custom URL Link",
        placeholder: "https://yourwebsite.com/chat",
        hint: "Any valid web URL or custom protocol.",
    },
}

export function App() {
    const [config, setConfig] = useState<ChatConfig>(cloneDefaultConfig())
    const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
        if (typeof document !== "undefined") {
            const bodyTheme = document.body?.dataset?.framerTheme
            const htmlTheme = document.documentElement?.dataset?.framerTheme
            if (bodyTheme === "light" || htmlTheme === "light") return "light"
        }
        return "dark"
    })
    const [tab, setTab] = useState<Tab>("home")
    const [builderSubTab, setBuilderSubTab] = useState<BuilderSubTab>("channels")
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [inserting, setInserting] = useState(false)
    const [canvasCount, setCanvasCount] = useState(0)
    const [previewOpen, setPreviewOpen] = useState(true)
    const [previewSelectedAgent, setPreviewSelectedAgent] = useState<ChatAgent | null>(null)
    const [previewMobileExpanded, setPreviewMobileExpanded] = useState(false)
    const [message, setMessage] = useState<{
        type: "info" | "success" | "warning" | "error"
        title?: string
        text: string
    } | null>(null)

    // Auto-dismiss notice after 5 seconds
    useEffect(() => {
        if (!message) return
        const timer = setTimeout(() => {
            setMessage(null)
        }, 5000)
        return () => clearTimeout(timer)
    }, [message])

    // Agent creation & configuration state
    const [showAddAgent, setShowAddAgent] = useState(false)
    const [newAgentName, setNewAgentName] = useState("")
    const [newAgentRole, setNewAgentRole] = useState("")
    const [newAgentAvatar, setNewAgentAvatar] = useState(AVATAR_PRESETS[0])
    const [newAgentChannel, setNewAgentChannel] = useState<ChannelId>("whatsapp")
    const [newAgentValue, setNewAgentValue] = useState("")
    const [newAgentMessage, setNewAgentMessage] = useState("")
    const [newAvatarMode, setNewAvatarMode] = useState<"upload" | "presets" | "url">("upload")
    const [isUploadingNewAvatar, setIsUploadingNewAvatar] = useState(false)
    const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null)
    const [uploadingAgentId, setUploadingAgentId] = useState<string | null>(null)
    const [collapsedChannels, setCollapsedChannels] = useState<Record<string, boolean>>({})

    function toggleChannelCollapse(channelId: ChannelId) {
        setCollapsedChannels((prev) => ({
            ...prev,
            [channelId]: !prev[channelId],
        }))
    }

    // Automatic Canvas Theme Sync + Subscription (Read-only observer)
    useEffect(() => {
        function readCanvasTheme() {
            const bodyTheme = document.body.getAttribute("data-framer-theme")
            const htmlTheme = document.documentElement.getAttribute("data-framer-theme")
            if (bodyTheme === "light" || htmlTheme === "light") {
                setThemeMode("light")
            } else if (bodyTheme === "dark" || htmlTheme === "dark") {
                setThemeMode("dark")
            }
        }

        readCanvasTheme()

        let unsubscribe: (() => void) | undefined
        try {
            if (typeof (framer as any).subscribe === "function") {
                unsubscribe = (framer as any).subscribe("theme", (themeData: any) => {
                    if (themeData && (themeData.mode === "light" || themeData.mode === "dark")) {
                        setThemeMode(themeData.mode)
                    }
                })
            }
        } catch {
            // Subscription not available
        }

        const observer = new MutationObserver(() => {
            readCanvasTheme()
        })
        observer.observe(document.body, { attributes: true, attributeFilter: ["data-framer-theme"] })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-framer-theme"] })

        return () => {
            if (unsubscribe) unsubscribe()
            observer.disconnect()
        }
    }, [])

    function toggleTheme() {
        const next = themeMode === "dark" ? "light" : "dark"
        setThemeMode(next)
        document.documentElement.setAttribute("data-framer-theme", next)
        document.body.setAttribute("data-framer-theme", next)
    }

    useEffect(() => {
        Promise.all([loadConfig(), getCanvasInstancesCount()])
            .then(([saved, count]) => {
                setConfig(saved)
                setCanvasCount(count)
            })
            .catch(() => setMessage({ type: "error", text: "Unable to load plugin data." }))
    }, [])

    const isFirstLoad = useRef(true)
    useEffect(() => {
        if (isFirstLoad.current) {
            isFirstLoad.current = false
            return
        }

        const timer = setTimeout(async () => {
            try {
                const normalized = normalizeConfig(config)
                await saveConfig(normalized)
            } catch (err) {
                console.warn("Auto-save config failed:", err)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [config])

    const enabledChannels = useMemo(
        () => config.channels.filter((channel) => channel.enabled && channel.value.trim()),
        [config.channels],
    )

    const previewChannels = useMemo(() => {
        const active = config.channels.filter((channel) => channel.enabled && channel.value.trim())
        if (active.length > 0) return active
        const justEnabled = config.channels.filter((channel) => channel.enabled)
        if (justEnabled.length > 0) return justEnabled
        return config.channels.slice(0, 6)
    }, [config.channels])

    const resolvedGradientClass = useMemo(() => {
        const key = config.modalTheme || "whatsapp"
        return `cf-theme-grad-${key}`
    }, [config.modalTheme])

    const isScheduleOffline = useMemo(() => {
        if (!config.scheduleEnabled) return false
        const now = new Date()
        const curDay = now.getDay()
        const days = config.scheduleDays || [1, 2, 3, 4, 5]
        if (!days.includes(curDay)) return true
        const curMins = now.getHours() * 60 + now.getMinutes()
        const [sH, sM] = (config.scheduleStart || "09:00").split(":").map(Number)
        const [eH, eM] = (config.scheduleEnd || "18:00").split(":").map(Number)
        const sMins = (sH || 9) * 60 + (sM || 0)
        const eMins = (eH || 18) * 60 + (eM || 0)
        if (sMins <= eMins) {
            return curMins < sMins || curMins >= eMins
        } else {
            return curMins < sMins && curMins >= eMins
        }
    }, [config.scheduleEnabled, config.scheduleDays, config.scheduleStart, config.scheduleEnd])

    function updateConfig(patch: Partial<ChatConfig>) {
        setConfig((current) => normalizeConfig({ ...current, ...patch }))
        setMessage(null)
    }

    function updateChannel(id: ChannelId, patch: Partial<ChatChannel>) {
        setConfig((current) => ({
            ...current,
            channels: current.channels.map((channel) =>
                channel.id === id ? sanitizeChannel({ ...channel, ...patch }) : channel,
            ),
        }))
        setMessage(null)
    }

    function updateAgent(id: string, patch: Partial<ChatAgent>) {
        setConfig((current) => ({
            ...current,
            agents: current.agents.map((ag) => (ag.id === id ? sanitizeAgent({ ...ag, ...patch }) : ag)),
        }))
        setMessage(null)
    }

    function deleteAgent(id: string) {
        setConfig((current) => ({
            ...current,
            agents: current.agents.filter((ag) => ag.id !== id),
        }))
        if (previewSelectedAgent?.id === id) {
            setPreviewSelectedAgent(null)
        }
    }

    async function uploadAvatarFile(file: File): Promise<string> {
        if (!file.type.startsWith("image/")) {
            throw new Error("Please select an image file (PNG, JPG, SVG, WebP, etc.).")
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("Image size should be less than 5MB.")
        }

        if (typeof framer?.uploadImage === "function") {
            try {
                const asset = await framer.uploadImage(file)
                if (asset && asset.url) {
                    return asset.url
                }
            } catch (framerErr) {
                console.warn("framer.uploadImage unavailable in current context:", framerErr)
            }
        }

        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error("Failed to read image file."))
            reader.readAsDataURL(file)
        })
    }

    async function handleNewAgentFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploadingNewAvatar(true)
        try {
            const url = await uploadAvatarFile(file)
            setNewAgentAvatar(url)
            setMessage({ type: "success", text: "Avatar image uploaded successfully!" })
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to upload image." })
        } finally {
            setIsUploadingNewAvatar(false)
            e.target.value = ""
        }
    }

    async function handleExistingAgentFileUpload(agentId: string, e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingAgentId(agentId)
        try {
            const url = await uploadAvatarFile(file)
            updateAgent(agentId, { avatar: url })
            setMessage({ type: "success", text: "Agent avatar updated!" })
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to upload image." })
        } finally {
            setUploadingAgentId(null)
            e.target.value = ""
        }
    }

    function addAgent() {
        const cleanName = sanitizeText(newAgentName, 60)
        if (!cleanName) return
        const newAgent: ChatAgent = {
            id: "agent-" + Date.now(),
            name: cleanName,
            role: sanitizeText(newAgentRole, 80, "Customer Support"),
            avatar: sanitizeAvatarUrl(newAgentAvatar),
            channelId: newAgentChannel,
            value: sanitizeText(newAgentValue, 150, "") || undefined,
            message: sanitizeMultilineText(newAgentMessage, 300, "") || undefined,
            online: true,
        }
        setConfig((current) => ({
            ...current,
            agents: [...current.agents, newAgent],
        }))
        setNewAgentName("")
        setNewAgentRole("")
        setNewAgentValue("")
        setNewAgentMessage("")
        setNewAgentAvatar(AVATAR_PRESETS[0])
        setShowAddAgent(false)
        setMessage({ type: "success", text: "Added " + newAgent.name + " to chat team." })
    }

    async function handleInsertToCanvas() {
        setInserting(true)
        setMessage(null)
        try {
            const normalized = normalizeConfig(config)
            await saveConfig(normalized)
            const result = await insertCanvasComponent(normalized)
            const count = await getCanvasInstancesCount()
            setCanvasCount(count)
            setMessage({
                type: result.success ? "success" : "error",
                text: result.message,
            })
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Failed to insert component onto canvas.",
            })
        } finally {
            setInserting(false)
        }
    }

    async function reset() {
        const next = cloneDefaultConfig()
        setConfig(next)
        await saveConfig(next)
        setMessage({ type: "info", text: "Settings restored to defaults." })
    }

    // Helper to get launcher button classes
    const launcherShapeClass = "shape-" + (config.buttonShape || "circle")
    const launcherSizeClass = "size-" + (config.buttonSize || 56)

    // Render interactive simulation preview block
    function renderPreview() {
        const hasActiveTriggers = Boolean(
            config.scheduleEnabled ||
            config.scrollTriggerEnabled ||
            config.targetingEnabled
        )

        return (
            <div className="preview-container">
                <div className="preview-toolbar">
                    <span className="preview-pill">Live Simulation</span>
                    <div className="preview-mode-switch">
                        <button
                            type="button"
                            className={"preview-mode-btn " + (config.widgetMode === "modal" && previewOpen ? "active" : "")}
                            onClick={() => {
                                updateConfig({ widgetMode: "modal" })
                                setPreviewOpen(true)
                                setPreviewSelectedAgent(null)
                            }}
                        >
                            Modal View
                        </button>
                        <button
                            type="button"
                            className={"preview-mode-btn " + (config.widgetMode === "buttons" && previewOpen ? "active" : "")}
                            onClick={() => {
                                updateConfig({ widgetMode: "buttons" })
                                setPreviewOpen(true)
                            }}
                        >
                            Button View
                        </button>
                    </div>
                </div>

                {hasActiveTriggers && (
                    <div className="preview-active-triggers-bar">
                        {config.scheduleEnabled && (
                            <span
                                className={`preview-status-tag ${isScheduleOffline ? "is-offline" : "is-online"}`}
                                title={
                                    isScheduleOffline
                                        ? config.scheduleOfflineAction === "hide"
                                            ? "Outside business hours: Widget hidden on site"
                                            : `Offline notice badge: ${config.scheduleOfflineText || "Back tomorrow at 9:00 AM"}`
                                        : "Store currently within business hours"
                                }
                            >
                                {isScheduleOffline
                                    ? config.scheduleOfflineAction === "hide"
                                        ? "Closed (Hidden)"
                                        : "Closed (Offline Badge)"
                                    : "Open"}
                            </span>
                        )}
                        {config.scrollTriggerEnabled && (
                            <span
                                className="preview-status-tag is-trigger"
                                title={`Reveals after visitor scrolls ${config.scrollTriggerPercent}% (${config.scrollTriggerTarget})`}
                            >
                                Scroll {config.scrollTriggerPercent}%
                            </span>
                        )}
                        {config.targetingEnabled && (
                            <span
                                className="preview-status-tag is-trigger"
                                title={`URL targeting filter: ${config.targetingMode} on configured paths`}
                            >
                                Path Filter
                            </span>
                        )}
                    </div>
                )}

                <div
                    className="preview-viewport"
                    onMouseLeave={(e) => {
                        if (!config.exitIntentEnabled) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        if (e.clientY <= rect.top + 30) {
                            if (config.exitIntentAction === "greeting") {
                                setPreviewOpen(false)
                                if (config.enableSound) playNotificationChime()
                            } else {
                                setPreviewOpen(true)
                            }
                        }
                    }}
                >
                    <div className="preview-mock-page">
                        <div className="preview-mock-line short" />
                        <div className="preview-mock-line long" />
                        <div className="preview-mock-line" />
                        <div className="preview-mock-line short" />
                    </div>

                    <div className="preview-launcher-wrap">
                        {config.widgetMode === "modal" && previewOpen ? (
                            <div className="preview-modal-card">
                                <div className={"preview-modal-header " + resolvedGradientClass}>
                                    <div className="preview-modal-header-top">
                                        <h4 className="preview-modal-title">{config.modalTitle || "Hi there!"}</h4>
                                        <button
                                            type="button"
                                            className="preview-modal-close-btn"
                                            onClick={() => setPreviewOpen(false)}
                                        >
                                            <IconX size={12} />
                                        </button>
                                    </div>
                                    <p className="preview-modal-subtitle">
                                        {config.modalSubtitle || "Welcome to our live chat! Feel free to ask any questions."}
                                    </p>
                                    <div className={`preview-modal-badge ${isScheduleOffline ? "offline" : ""}`}>
                                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.2l2.2 1.3"/></svg>
                                        <span>
                                            {isScheduleOffline
                                                ? (config.scheduleOfflineText || "Back tomorrow at 9:00 AM")
                                                : (config.modalResponseTime || "Typically replies in minutes")}
                                        </span>
                                    </div>
                                </div>

                                <div className="preview-modal-body">
                                    {previewSelectedAgent ? (
                                        <div className="preview-chat-view">
                                            <button
                                                type="button"
                                                className="preview-chat-back preview-chat-back-wrap"
                                                onClick={() => setPreviewSelectedAgent(null)}
                                            >
                                                <IconArrowLeft size={12} />
                                                <span>All Team Members</span>
                                            </button>
                                            <div className="preview-chat-agent-info">
                                                <img
                                                    src={previewSelectedAgent.avatar}
                                                    alt={previewSelectedAgent.name}
                                                    className="preview-chat-avatar"
                                                />
                                                <div>
                                                    <div className="preview-chat-name">
                                                        {previewSelectedAgent.name}
                                                    </div>
                                                    <div className="preview-chat-role">
                                                        {previewSelectedAgent.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="preview-chat-bubble">
                                                {previewSelectedAgent.message || config.modalChatBubble || "We typically reply within a few minutes. How can we help you today?"}
                                            </div>
                                            <button
                                                type="button"
                                                className={"preview-start-btn preview-start-btn-wrap " + resolvedGradientClass}
                                                onClick={() => {
                                                    const ch = config.channels.find((c) => c.id === previewSelectedAgent.channelId)
                                                    const targetVal = previewSelectedAgent.value || ch?.value || "(Not configured)"
                                                    setMessage({
                                                        type: "info",
                                                        text: `Simulated chat with ${previewSelectedAgent.name} via ${previewSelectedAgent.channelId} (${targetVal})!`,
                                                    })
                                                }}
                                            >
                                                <span>{config.modalStartChatText || "Start chat"}</span>
                                                <IconArrowRight size={13} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {config.agents.map((agent) => {
                                                const chClass = `cf-ch-${agent.channelId}`
                                                return (
                                                    <div
                                                        key={agent.id}
                                                        className="preview-agent-card"
                                                        onClick={() => setPreviewSelectedAgent(agent)}
                                                        title="Click to preview agent chat screen"
                                                    >
                                                        <div className="preview-agent-avatar-wrap">
                                                            <img src={agent.avatar} alt={agent.name} />
                                                            <span
                                                                className={"preview-agent-av-badge " + chClass + (isScheduleOffline ? " offline" : "")}
                                                                dangerouslySetInnerHTML={{ __html: ICONS[agent.channelId] || "" }}
                                                            />
                                                        </div>
                                                        <div className="preview-agent-details">
                                                            <div className="preview-agent-name-row">
                                                                <span className="preview-agent-name">{agent.name}</span>
                                                                {agent.online !== false && !isScheduleOffline && (
                                                                    <span className="preview-agent-online-dot" title="Online" />
                                                                )}
                                                                {isScheduleOffline && (
                                                                    <span className="preview-agent-offline-dot" title="Offline" />
                                                                )}
                                                            </div>
                                                            <span className="preview-agent-role">
                                                                {agent.role}
                                                                {isScheduleOffline ? " • Offline" : ""}
                                                            </span>
                                                        </div>
                                                        <span className="preview-agent-arrow">
                                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M6 3.5L10.5 8L6 12.5" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {config.widgetMode === "buttons" && previewOpen ? (
                            <div className={`preview-buttons-list layout-${config.layout}`}>
                                {previewChannels.map((channel, idx) => {
                                    const displayLabel = channel.label?.trim() || (channel.id === "custom" ? "Custom" : channel.label)
                                    const isCapped = Boolean(config.mobileCapChannels ?? true) && previewChannels.length > 4 && !previewMobileExpanded && idx >= 4
                                    if (isCapped) return null

                                    return (
                                        <div key={channel.id} className="preview-channel-button-item">
                                            {config.showLabels && (
                                                <span className="preview-channel-label">{displayLabel}</span>
                                            )}
                                            <div
                                                className={`preview-channel-btn shape-${config.buttonShape} cf-ch-${channel.id}`}
                                                title={displayLabel}
                                                onClick={() => {
                                                    setMessage({
                                                        type: "info",
                                                        text: `Opened ${displayLabel} directly (${channel.value || "Configured"})!`,
                                                    })
                                                }}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: ICONS[channel.id] || "" }} />
                                            </div>
                                        </div>
                                    )
                                })}

                                {Boolean(config.mobileCapChannels ?? true) && previewChannels.length > 4 && (
                                    <div className="preview-channel-button-item">
                                        {config.showLabels && (
                                            <span className="preview-channel-label">
                                                {previewMobileExpanded ? "Show Less" : `+${previewChannels.length - 4} More`}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            className={`preview-more-btn shape-${config.buttonShape} ${previewMobileExpanded ? "is-expanded" : ""}`}
                                            title={previewMobileExpanded ? "Show Less" : `View ${previewChannels.length - 4} more channels`}
                                            onClick={() => setPreviewMobileExpanded(!previewMobileExpanded)}
                                        >
                                            {previewMobileExpanded ? "−" : `+${previewChannels.length - 4}`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {!previewOpen && config.greetingEnabled && (
                            <div
                                className="preview-greeting-pill"
                                onClick={() => {
                                    if (config.enableSound) {
                                        playNotificationChime()
                                    }
                                }}
                                title={config.enableSound ? "Click to hear notification sound preview" : undefined}
                            >
                                {config.greetingText || "Need help? Chat with us."}
                            </div>
                        )}

                        <button
                            type="button"
                            className={`preview-main-btn ${launcherShapeClass} ${launcherSizeClass} ${resolvedGradientClass}`}
                            onClick={() => setPreviewOpen(!previewOpen)}
                            aria-label="Toggle preview"
                        >
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: previewOpen
                                        ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'
                                        : LAUNCHER_ICONS[config.launcherIcon || "chat"] || LAUNCHER_ICONS.chat,
                                }}
                            />
                            {config.showBadge && !previewOpen && (
                                <span className="preview-badge-pill">{config.badgeText || "1"}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={"app " + themeMode}>
            <header className="header">
                <div className="app-brand">
                    <div className="app-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2a10 10 0 0 0-8.9 14.6L2 22l5.4-1.1A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4-1.1l-.4-.2-3.2.7.7-3.1-.2-.4A8 8 0 1 1 12 20Z" />
                        </svg>
                    </div>
                    <div className="app-brand-info">
                        <h1>Chatfic</h1>
                        <p>Live Social Chat &amp; Contact Widgets</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        type="button"
                        className="cf-theme-toggle"
                        onClick={toggleTheme}
                        title={"Theme: " + themeMode + ". Click to switch."}
                    >
                        {themeMode === "dark" ? (
                            <>
                                <IconMoon size={12} />
                                <span>Dark</span>
                            </>
                        ) : (
                            <>
                                <IconSun size={12} />
                                <span>Light</span>
                            </>
                        )}
                    </button>
                    <div className={"status-badge " + (canvasCount > 0 ? "ok" : "")}>
                        <span className="status-dot" />
                        {canvasCount > 0 ? `${canvasCount} on Canvas` : "Ready"}
                    </div>
                </div>
            </header>

            <nav className="cf-tabs">
                <div className="cf-tabs-list">
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "home" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("home")
                        }}
                    >
                        Home
                    </button>
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "builder" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("builder")
                        }}
                    >
                        Builder
                    </button>
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "design" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("design")
                        }}
                    >
                        Design
                    </button>
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "settings" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("settings")
                        }}
                    >
                        Settings
                    </button>
                </div>
                <button
                    type="button"
                    className={"cf-tab-profile " + (isProfileOpen ? "active" : "")}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    title="Account & Profile"
                    aria-label="Account & Profile"
                >
                    <IconUser size={14} />
                </button>
            </nav>

            <main className="content">
                {message && (
                    <div className={"cf-notice " + message.type}>
                        <div className="cf-notice-icon-col">
                            {message.type === "info" && <IconNoticeInfo size={18} />}
                            {message.type === "success" && <IconNoticeSuccess size={18} />}
                            {message.type === "warning" && <IconNoticeWarning size={18} />}
                            {message.type === "error" && <IconNoticeError size={18} />}
                        </div>
                        <div className="cf-notice-content">
                            <h5 className="cf-notice-title">
                                {message.title || (message.type === "success" ? "Success" : message.type === "error" ? "Error" : message.type === "warning" ? "Warning" : "Notice")}
                            </h5>
                            <p className="cf-notice-desc">{message.text}</p>
                        </div>
                        <button
                            type="button"
                            className="cf-notice-close"
                            onClick={() => setMessage(null)}
                            aria-label="Dismiss notice"
                        >
                            <IconX size={12} />
                        </button>
                    </div>
                )}

                {isProfileOpen ? (
                    <ProfilePage onBack={() => setIsProfileOpen(false)} />
                ) : (
                    <>
                        {/* HOME TAB */}
                        {tab === "home" && (
                            <>
                                <HeroCard
                                    badgeLabel="Chat Widget"
                                    badgeType="brand"
                                    badgeIcon={<IconSparkles size={11} />}
                                    statusBadge={
                                        <div className={"status-badge " + (canvasCount > 0 ? "ok" : "")}>
                                            <span className="status-dot" />
                                            <span>{canvasCount > 0 ? `${canvasCount} on Canvas` : "Ready"}</span>
                                        </div>
                                    }
                                    title="Welcome to Chatfic"
                                    description="Live social chat and multi-channel contact widgets for Framer."
                                    ctaLabel="Configure in Builder"
                                    ctaIcon={<IconArrowRight size={14} />}
                                    onCtaClick={() => {
                                        setIsProfileOpen(false)
                                        setTab("builder")
                                    }}
                                >
                                    <div className="cf-hero-config-grid">
                                        <button
                                            type="button"
                                            className="cf-hero-config-item"
                                            onClick={() => {
                                                setIsProfileOpen(false)
                                                setTab("builder")
                                            }}
                                            title="Current widget mode"
                                        >
                                            <span className="cf-hero-config-label">Mode</span>
                                            <span className="cf-hero-config-val">
                                                {config.widgetMode === "modal" ? "Live Modal" : "Buttons"}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            className="cf-hero-config-item"
                                            onClick={() => {
                                                setIsProfileOpen(false)
                                                setTab("builder")
                                                setBuilderSubTab("channels")
                                            }}
                                            title="Active channels in builder"
                                        >
                                            <span className="cf-hero-config-label">Channels</span>
                                            <span className="cf-hero-config-val">{enabledChannels.length} Active</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="cf-hero-config-item"
                                            onClick={() => {
                                                setIsProfileOpen(false)
                                                setTab("builder")
                                                setBuilderSubTab("agents")
                                            }}
                                            title="Team agents in builder"
                                        >
                                            <span className="cf-hero-config-label">Team</span>
                                            <span className="cf-hero-config-val">{config.agents.length} Agents</span>
                                        </button>
                                    </div>
                                </HeroCard>

                                <Section
                                    title="Widget Experience Mode"
                                    description="Choose how visitors interact when clicking your floating button."
                                >
                                    <div className="cf-field-grid">
                                        <div
                                            className={"cf-theme-card cf-mode-card " + (config.widgetMode === "modal" ? "active" : "")}
                                            onClick={() => updateConfig({ widgetMode: "modal" })}
                                        >
                                            <div className="cf-mode-card-header">
                                                <span className="cf-mode-card-icon">
                                                    <IconLayoutModal size={16} />
                                                </span>
                                                <strong className="cf-mode-card-title">Live Chat Modal</strong>
                                            </div>
                                            <span className="cf-mode-card-desc">
                                                Popup chat window with support team and preview.
                                            </span>
                                        </div>
                                        <div
                                            className={"cf-theme-card cf-mode-card " + (config.widgetMode === "buttons" ? "active" : "")}
                                            onClick={() => updateConfig({ widgetMode: "buttons" })}
                                        >
                                            <div className="cf-mode-card-header">
                                                <span className="cf-mode-card-icon">
                                                    <IconLayoutButtons size={16} />
                                                </span>
                                                <strong className="cf-mode-card-title">Icon Buttons</strong>
                                            </div>
                                            <span className="cf-mode-card-desc">
                                                Classic floating icon list opening direct channel URLs.
                                            </span>
                                        </div>
                                    </div>
                                </Section>

                                <Section
                                    title="Interactive Live Preview"
                                    description="Test the interactive widget live. Click the button to toggle the window."
                                >
                                    {renderPreview()}
                                </Section>

                                <HelpRow />

                                <div className="help-section">
                                    <h3 className="help-section-title">More from Framefic</h3>
                                    <div className="help-products">
                                        <FrameficCard
                                            name="Before After Images Slider"
                                            description="Advanced image slider fully customizable and responsive"
                                            logoSrc="./Favicon.png"
                                            marketplaceUrl="https://www.framer.com/marketplace/plugins/beaf/"
                                        />
                                        <FrameficCard
                                            name="Connectfic"
                                            description="Connect your framer site with shopify store and components"
                                            logoSrc="./Connectfic.png"
                                            marketplaceUrl="https://www.framer.com/marketplace/plugins/connectfic/"
                                        />
                                        <FrameficCard
                                            name="Announcement Bar"
                                            description="Create bars and countdown timers to boost engagement and conversions."
                                            logoSrc="./Crestbar.png"
                                            marketplaceUrl="https://www.framer.com/community/marketplace/plugins/announcement-bar/"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* BUILDER TAB */}
                        {tab === "builder" && (
                            <>
                                <div className="cf-builder-subtabs">
                                    <button
                                        type="button"
                                        className={"cf-builder-subtab " + (builderSubTab === "channels" ? "active" : "")}
                                        onClick={() => setBuilderSubTab("channels")}
                                    >
                                        Channels ({enabledChannels.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={"cf-builder-subtab " + (builderSubTab === "agents" ? "active" : "")}
                                        onClick={() => setBuilderSubTab("agents")}
                                    >
                                        Support Team ({config.agents.length})
                                    </button>
                                </div>

                                {builderSubTab === "channels" && (
                                    <Section
                                        title={`Messaging Channels (${config.channels.length} Platforms Supported)`}
                                        description="Configure handles, phone numbers, and pre-filled greetings for your visitors."
                                    >
                                        {config.channels.map((channel) => {
                                            const meta = channelMeta[channel.id]
                                            const chClass = `cf-ch-${channel.id}`
                                            const isMinimized = channel.enabled && Boolean(collapsedChannels[channel.id])
                                            return (
                                                <div
                                                    key={channel.id}
                                                    className={
                                                        "cf-channel-card " +
                                                        (channel.enabled ? "is-active" : "") +
                                                        (isMinimized ? " is-minimized" : "")
                                                    }
                                                >
                                                    <div className="cf-channel-header">
                                                        <div
                                                            className={"cf-channel-info" + (channel.enabled ? " cf-channel-info-clickable" : "")}
                                                            onClick={() => channel.enabled && toggleChannelCollapse(channel.id)}
                                                            title={
                                                                channel.enabled
                                                                    ? isMinimized
                                                                        ? "Click to expand options"
                                                                        : "Click to minimize options"
                                                                    : undefined
                                                            }
                                                        >
                                                            <span
                                                                className={"cf-channel-icon-badge " + chClass}
                                                                dangerouslySetInnerHTML={{ __html: ICONS[channel.id] || "" }}
                                                            />
                                                            <div className="cf-channel-meta">
                                                                <div className="cf-channel-meta-title">
                                                                    {channel.id === "custom" ? (channel.label.trim() || "Custom") : channel.label}
                                                                    {channel.enabled && channel.value.trim() ? (
                                                                        <span className="cf-channel-pill live">Active</span>
                                                                    ) : null}
                                                                </div>
                                                                <div className="cf-channel-meta-hint">{meta?.hint || ""}</div>
                                                            </div>
                                                        </div>
                                                        <div className="cf-channel-actions">
                                                            {channel.enabled && (
                                                                <button
                                                                    type="button"
                                                                    className={"cf-channel-btn-collapse " + (isMinimized ? "is-collapsed" : "")}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        toggleChannelCollapse(channel.id)
                                                                    }}
                                                                    title={isMinimized ? "Expand options" : "Minimize options"}
                                                                    aria-label={isMinimized ? "Expand options" : "Minimize options"}
                                                                >
                                                                    <IconChevronDown size={14} />
                                                                </button>
                                                            )}
                                                            <Switch
                                                                checked={channel.enabled}
                                                                onChange={(enabled) => {
                                                                    updateChannel(channel.id, { enabled })
                                                                    if (enabled) {
                                                                        setCollapsedChannels((prev) => ({ ...prev, [channel.id]: false }))
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {channel.enabled && !isMinimized && (
                                                        <div className="cf-channel-body">
                                                            {channel.id === "custom" ? (
                                                                <>
                                                                    <div className="cf-field-grid">
                                                                        <Field label="Custom URL Link" hint="Any valid web URL or custom protocol.">
                                                                            <input
                                                                                className="cf-input"
                                                                                maxLength={150}
                                                                                value={channel.value}
                                                                                onChange={(e) => updateChannel(channel.id, { value: e.target.value })}
                                                                                placeholder={meta?.placeholder || "https://yourwebsite.com/chat"}
                                                                            />
                                                                        </Field>
                                                                        <Field label="Channel / Button Label" hint="Name displayed on button badge & tooltip.">
                                                                            <input
                                                                                className="cf-input"
                                                                                maxLength={40}
                                                                                value={channel.label}
                                                                                onChange={(e) => updateChannel(channel.id, { label: e.target.value })}
                                                                                placeholder="Custom"
                                                                            />
                                                                        </Field>
                                                                    </div>
                                                                    <div className="cf-field-grid">
                                                                        <Field label="Button Color">
                                                                            <CustomColorPicker
                                                                                value={channel.color || "#5271FF"}
                                                                                fallback="#5271FF"
                                                                                onChange={(color) => updateChannel(channel.id, { color })}
                                                                                ariaLabel="Button Color"
                                                                            />
                                                                        </Field>
                                                                        <Field label="Open Link In">
                                                                            <div className="cf-flex-center-gap-6 cf-mt-6">
                                                                                <Switch
                                                                                    checked={channel.openInNewTab}
                                                                                    onChange={(openInNewTab) => updateChannel(channel.id, { openInNewTab })}
                                                                                />
                                                                                <span className="cf-subtext-sm">
                                                                                    {channel.openInNewTab ? "New browser tab" : "Same browser tab"}
                                                                                </span>
                                                                            </div>
                                                                        </Field>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="cf-field-grid">
                                                                    <Field label={meta?.label || "Handle / ID"}>
                                                                        <input
                                                                            className="cf-input"
                                                                            maxLength={150}
                                                                            value={channel.value}
                                                                            onChange={(e) => updateChannel(channel.id, { value: e.target.value })}
                                                                            placeholder={meta?.placeholder}
                                                                        />
                                                                    </Field>
                                                                    <Field label="Button Color">
                                                                        <CustomColorPicker
                                                                            value={channel.color || "#5271FF"}
                                                                            fallback="#5271FF"
                                                                            onChange={(color) => updateChannel(channel.id, { color })}
                                                                            ariaLabel="Button Color"
                                                                        />
                                                                    </Field>
                                                                </div>
                                                            )}
                                                            {["whatsapp", "telegram", "sms"].includes(channel.id) && (
                                                                <Field
                                                                    label="Pre-filled Welcome Message"
                                                                    hint="Automatically fills visitor's chat input. Supports {url} and {title} variables."
                                                                >
                                                                    <input
                                                                        className="cf-input"
                                                                        maxLength={300}
                                                                        value={channel.message || ""}
                                                                        onChange={(e) => updateChannel(channel.id, { message: e.target.value })}
                                                                        placeholder="Hello! I'd like to know more about {title}."
                                                                    />
                                                                </Field>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </Section>
                                )}

                                {builderSubTab === "agents" && (
                                    <Section
                                        title="Support Team / Agents"
                                        description="Add team members visitors can chat with. Each agent can have their own direct number or custom message."
                                    >
                                        <div className="cf-agents-list">
                                            {config.agents.map((agent) => {
                                                const channel = config.channels.find((c) => c.id === agent.channelId) || config.channels[0]
                                                const isExpanded = expandedAgentId === agent.id
                                                const isUploading = uploadingAgentId === agent.id
                                                const currentChannelMeta = channelMeta[agent.channelId]
                                                const hasCustomValue = Boolean(agent.value && agent.value.trim())
                                                const chClass = `cf-ch-${agent.channelId}`

                                                return (
                                                    <div key={agent.id} className={"cf-agent-manage-item " + (isExpanded ? "is-expanded" : "")}>
                                                        <div className="cf-agent-manage-header">
                                                            <div
                                                                className="cf-agent-avatar-wrap"
                                                                title="Click to upload/change photo"
                                                                onClick={() => {
                                                                    document.getElementById(`cf-agent-file-${agent.id}`)?.click()
                                                                }}
                                                            >
                                                                <img src={agent.avatar} alt={agent.name} className="cf-agent-manage-avatar" />
                                                                <div className="cf-agent-avatar-hover-icon">
                                                                    {isUploading ? <IconSpinner size={14} /> : <IconCamera size={14} />}
                                                                </div>
                                                                <input
                                                                    id={`cf-agent-file-${agent.id}`}
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="cf-hidden-file-input"
                                                                    onChange={(e) => handleExistingAgentFileUpload(agent.id, e)}
                                                                />
                                                            </div>

                                                            <div className="cf-agent-manage-fields">
                                                                <input
                                                                    className="cf-input"
                                                                    maxLength={60}
                                                                    value={agent.name}
                                                                    onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                                                                    placeholder="Agent Name"
                                                                />
                                                                <input
                                                                    className="cf-input"
                                                                    maxLength={80}
                                                                    value={agent.role}
                                                                    onChange={(e) => updateAgent(agent.id, { role: e.target.value })}
                                                                    placeholder="Role / Department"
                                                                />
                                                            </div>

                                                            <div className="cf-agent-meta-badge-wrap">
                                                                <span
                                                                    className={"cf-agent-channel-tag " + chClass}
                                                                >
                                                                    {channel?.label || "Chat"}
                                                                </span>
                                                                {hasCustomValue && (
                                                                    <span className="cf-agent-custom-tag" title={"Direct value: " + agent.value}>
                                                                        Custom #
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className={"cf-agent-btn-configure " + (isExpanded ? "active" : "")}
                                                                onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                                                                title={isExpanded ? "Collapse settings" : "Configure direct number, message & photo"}
                                                            >
                                                                <IconGear size={13} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="cf-agent-del-btn"
                                                                onClick={() => deleteAgent(agent.id)}
                                                                title="Remove agent"
                                                            >
                                                                <IconX size={12} />
                                                            </button>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="cf-agent-expanded-body">
                                                                <Field
                                                                    label="Assigned Channel"
                                                                    hint="Only channels enabled in the Channels tab appear here."
                                                                >
                                                                    <select
                                                                        className="cf-input"
                                                                        value={agent.channelId}
                                                                        onChange={(e) => updateAgent(agent.id, { channelId: e.target.value as ChannelId })}
                                                                    >
                                                                        {(() => {
                                                                            const eligible = config.channels.filter((c) => c.enabled || c.id === agent.channelId)
                                                                            const list = eligible.length > 0 ? eligible : config.channels
                                                                            return list.map((c) => (
                                                                                <option key={c.id} value={c.id}>
                                                                                    {c.label}
                                                                                    {!c.enabled
                                                                                        ? " (Disabled in Channels)"
                                                                                        : c.value
                                                                                        ? ` (${c.value})`
                                                                                        : " (Active, no default)"}
                                                                                </option>
                                                                            ))
                                                                        })()}
                                                                    </select>
                                                                </Field>

                                                                <Field
                                                                    label={`Direct ${channel?.label || "Channel"} ${agent.channelId === "email" ? "Email" : agent.channelId === "phone" || agent.channelId === "whatsapp" || agent.channelId === "viber" ? "Number" : "Handle"} (Optional)`}
                                                                    hint={
                                                                        channel?.value
                                                                            ? `Default: ${channel.value}. Leave blank to use default.`
                                                                            : "Leave blank to use channel default."
                                                                    }
                                                                >
                                                                    <input
                                                                        className="cf-input"
                                                                        maxLength={150}
                                                                        value={agent.value || ""}
                                                                        onChange={(e) => updateAgent(agent.id, { value: e.target.value })}
                                                                        placeholder={currentChannelMeta?.placeholder || "Direct contact value"}
                                                                    />
                                                                </Field>

                                                                <Field
                                                                    label="Direct Pre-filled Message (Optional)"
                                                                    hint={
                                                                        channel?.message
                                                                            ? `Default: "${channel.message}". Leave blank to use default.`
                                                                            : "Leave blank to use welcome chat bubble."
                                                                    }
                                                                >
                                                                    <textarea
                                                                        className="cf-input"
                                                                        rows={2}
                                                                        maxLength={300}
                                                                        value={agent.message || ""}
                                                                        onChange={(e) => updateAgent(agent.id, { message: e.target.value })}
                                                                        placeholder="e.g. Hi there! Emma here from billing. How can I help you today?"
                                                                    />
                                                                </Field>

                                                                <Field label="Avatar Photo">
                                                                    <div className="cf-avatar-edit-row">
                                                                        <button
                                                                            type="button"
                                                                            className="cf-btn secondary cf-avatar-upload-trigger cf-btn-inline-flex"
                                                                            onClick={() => {
                                                                                document.getElementById(`cf-agent-file-${agent.id}`)?.click()
                                                                            }}
                                                                            disabled={isUploading}
                                                                        >
                                                                            {isUploading ? (
                                                                                <>
                                                                                    <IconSpinner size={12} />
                                                                                    <span>Uploading photo...</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <IconUpload size={12} />
                                                                                    <span>Upload New Photo</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                        <div className="cf-avatar-presets-mini">
                                                                            {AVATAR_PRESETS.map((preset, idx) => (
                                                                                <button
                                                                                    key={idx}
                                                                                    type="button"
                                                                                    className={"cf-avatar-preset-btn " + (agent.avatar === preset ? "active" : "")}
                                                                                    onClick={() => updateAgent(agent.id, { avatar: preset })}
                                                                                    title={"Preset " + (idx + 1)}
                                                                                >
                                                                                    <img src={preset} alt={"Preset " + (idx + 1)} />
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <input
                                                                        className="cf-input cf-mt-6"
                                                                        maxLength={500}
                                                                        value={agent.avatar}
                                                                        onChange={(e) => updateAgent(agent.id, { avatar: e.target.value })}
                                                                        placeholder="Or paste image URL..."
                                                                    />
                                                                </Field>

                                                                <div className="cf-agent-detail-row">
                                                                    <div className="cf-agent-detail-left">
                                                                        <Switch
                                                                            checked={agent.online !== false}
                                                                            onChange={(online) => updateAgent(agent.id, { online })}
                                                                        />
                                                                        <span className="cf-agent-detail-lbl">
                                                                            {agent.online !== false ? "Active / Online (shows green dot)" : "Away / Offline"}
                                                                        </span>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        className="cf-btn secondary cf-badge-sm"
                                                                        onClick={() => setExpandedAgentId(null)}
                                                                    >
                                                                        Done
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {showAddAgent ? (
                                            <div className="cf-add-agent-box">
                                                <div className="cf-add-member-header">
                                                    <span className="cf-add-member-title">Add New Team Member</span>
                                                    <button
                                                        type="button"
                                                        className="cf-agent-del-btn"
                                                        onClick={() => setShowAddAgent(false)}
                                                        title="Close"
                                                    >
                                                        <IconX size={12} />
                                                    </button>
                                                </div>

                                                <div className="cf-field-grid">
                                                    <Field label="Agent Name *">
                                                        <input
                                                            className="cf-input"
                                                            maxLength={60}
                                                            value={newAgentName}
                                                            onChange={(e) => setNewAgentName(e.target.value)}
                                                            placeholder="e.g. Emma Watson"
                                                            autoFocus
                                                        />
                                                    </Field>
                                                    <Field label="Role / Department">
                                                        <input
                                                            className="cf-input"
                                                            maxLength={80}
                                                            value={newAgentRole}
                                                            onChange={(e) => setNewAgentRole(e.target.value)}
                                                            placeholder="e.g. Sales Specialist"
                                                        />
                                                    </Field>
                                                </div>

                                                <Field
                                                    label="Assigned Channel"
                                                    hint="Only channels enabled in the Channels tab appear here."
                                                >
                                                    <select
                                                        className="cf-input"
                                                        value={newAgentChannel}
                                                        onChange={(e) => setNewAgentChannel(e.target.value as ChannelId)}
                                                    >
                                                        {(() => {
                                                            const eligible = config.channels.filter((c) => c.enabled)
                                                            const list = eligible.length > 0 ? eligible : config.channels
                                                            return list.map((c) => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.label} {c.value ? `(${c.value})` : "(Active, no default)"}
                                                                </option>
                                                            ))
                                                        })()}
                                                    </select>
                                                </Field>

                                                <Field
                                                    label={`Direct ${config.channels.find((c) => c.id === newAgentChannel)?.label || "Channel"} ${newAgentChannel === "email" ? "Email" : newAgentChannel === "phone" || newAgentChannel === "whatsapp" || newAgentChannel === "viber" ? "Number" : "Handle"} (Optional)`}
                                                    hint={(() => {
                                                        const c = config.channels.find((c) => c.id === newAgentChannel)
                                                        return c?.value
                                                            ? `Default: ${c.value}. Leave blank to inherit default.`
                                                            : "Leave blank to inherit channel default."
                                                    })()}
                                                >
                                                    <input
                                                        className="cf-input"
                                                        maxLength={150}
                                                        value={newAgentValue}
                                                        onChange={(e) => setNewAgentValue(e.target.value)}
                                                        placeholder={channelMeta[newAgentChannel]?.placeholder || "Custom number or handle"}
                                                    />
                                                </Field>

                                                <Field
                                                    label="Direct Welcome Message (Optional)"
                                                    hint={(() => {
                                                        const c = config.channels.find((c) => c.id === newAgentChannel)
                                                        return c?.message
                                                            ? `Default: "${c.message}". Leave blank to inherit.`
                                                            : "Leave blank to use general chat bubble."
                                                    })()}
                                                >
                                                    <textarea
                                                        className="cf-input"
                                                        rows={2}
                                                        maxLength={300}
                                                        value={newAgentMessage}
                                                        onChange={(e) => setNewAgentMessage(e.target.value)}
                                                        placeholder="e.g. Hi there! Emma here from billing. How can I help you today?"
                                                    />
                                                </Field>

                                                <Field label="Avatar Photo">
                                                    <div className="cf-avatar-picker-tabs">
                                                        <button
                                                            type="button"
                                                            className={"cf-avatar-picker-tab " + (newAvatarMode === "upload" ? "active" : "")}
                                                            onClick={() => setNewAvatarMode("upload")}
                                                        >
                                                            <IconUpload size={12} />
                                                            <span>Upload Image</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={"cf-avatar-picker-tab " + (newAvatarMode === "presets" ? "active" : "")}
                                                            onClick={() => setNewAvatarMode("presets")}
                                                        >
                                                            <IconUser size={12} />
                                                            <span>Presets</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={"cf-avatar-picker-tab " + (newAvatarMode === "url" ? "active" : "")}
                                                            onClick={() => setNewAvatarMode("url")}
                                                        >
                                                            <IconLink size={12} />
                                                            <span>Image URL</span>
                                                        </button>
                                                    </div>

                                                    <div className="cf-avatar-picker-content">
                                                        <div className="cf-avatar-picker-preview-wrap">
                                                            <img src={newAgentAvatar} alt="New agent avatar" className="cf-avatar-picker-preview" />
                                                        </div>

                                                        <div className="cf-avatar-picker-controls">
                                                            {newAvatarMode === "upload" && (
                                                                <div className="cf-avatar-upload-zone">
                                                                    <label className="cf-btn secondary cf-avatar-upload-button">
                                                                        {isUploadingNewAvatar ? (
                                                                            <>
                                                                                <IconSpinner size={13} />
                                                                                <span>Uploading photo...</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <IconUpload size={13} />
                                                                                <span>Choose Image File</span>
                                                                            </>
                                                                        )}
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            className="cf-hidden-file-input"
                                                                            onChange={handleNewAgentFileUpload}
                                                                            disabled={isUploadingNewAvatar}
                                                                        />
                                                                    </label>
                                                                    <span className="cf-avatar-upload-hint">
                                                                        JPG, PNG, WebP or SVG. Uploads to Framer CDN.
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {newAvatarMode === "presets" && (
                                                                <div className="cf-avatar-presets-grid">
                                                                    {AVATAR_PRESETS.map((preset, idx) => (
                                                                        <button
                                                                            key={idx}
                                                                            type="button"
                                                                            className={"cf-avatar-preset-btn " + (newAgentAvatar === preset ? "active" : "")}
                                                                            onClick={() => setNewAgentAvatar(preset)}
                                                                            title={"Preset " + (idx + 1)}
                                                                        >
                                                                            <img src={preset} alt={"Preset " + (idx + 1)} />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {newAvatarMode === "url" && (
                                                                <input
                                                                    className="cf-input"
                                                                    maxLength={500}
                                                                    value={newAgentAvatar}
                                                                    onChange={(e) => setNewAgentAvatar(e.target.value)}
                                                                    placeholder="Paste image URL (https://...)"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </Field>

                                                <div className="cf-flex-end-gap-8">
                                                    <button
                                                        type="button"
                                                        className="cf-btn secondary"
                                                        onClick={() => setShowAddAgent(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cf-btn primary"
                                                        onClick={addAgent}
                                                        disabled={!newAgentName.trim() || isUploadingNewAvatar}
                                                    >
                                                        {isUploadingNewAvatar ? "Uploading..." : "Add to Team"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="cf-btn secondary full-col cf-btn-add-agent"
                                                onClick={() => {
                                                    const firstActive = config.channels.find((c) => c.enabled)?.id || "whatsapp"
                                                    setNewAgentChannel(firstActive)
                                                    setShowAddAgent(true)
                                                }}
                                            >
                                                <IconPlus size={13} />
                                                <span>Add Team Member</span>
                                            </button>
                                        )}
                                    </Section>
                                )}

                            </>
                        )}

                        {/* DESIGN TAB */}
                        {tab === "design" && (
                            <>
                                        <Section
                                            title="Chat Window Header &amp; Theme"
                                            description="Customize the top header gradient, greeting, and response time."
                                        >
                                            <Field label="Header Theme Gradient">
                                                <div className="cf-theme-grid">
                                                    {(
                                                        [
                                                            ["whatsapp", "WhatsApp"],
                                                            ["messenger", "Messenger"],
                                                            ["telegram", "Telegram"],
                                                            ["instagram", "Instagram"],
                                                            ["tiktok", "TikTok"],
                                                            ["wechat", "WeChat"],
                                                            ["dark", "Modern Dark"],
                                                            ["custom", "Custom"],
                                                        ] as const
                                                    ).map(([themeId, label]) => (
                                                        <div
                                                            key={themeId}
                                                            className={"cf-theme-card " + (config.modalTheme === themeId ? "active" : "")}
                                                            onClick={() => updateConfig({ modalTheme: themeId as ModalTheme })}
                                                        >
                                                            <div className={"cf-theme-swatch cf-theme-grad-" + themeId} />
                                                            <span className="cf-theme-name">{label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Field>

                                            {config.modalTheme === "custom" && (
                                                <Field label="Custom CSS Gradient" hint="e.g. linear-gradient(135deg, #6366f1, #a855f7)">
                                                    <input
                                                        className="cf-input"
                                                        maxLength={200}
                                                        value={config.modalCustomGradient || ""}
                                                        onChange={(e) => updateConfig({ modalCustomGradient: e.target.value })}
                                                        placeholder="linear-gradient(135deg, #6366f1, #a855f7)"
                                                    />
                                                </Field>
                                            )}

                                            <div className="cf-field-grid">
                                                <Field label="Header Title">
                                                    <input
                                                        className="cf-input"
                                                        maxLength={100}
                                                        value={config.modalTitle}
                                                        onChange={(e) => updateConfig({ modalTitle: e.target.value })}
                                                        placeholder="Hi there!"
                                                    />
                                                </Field>
                                                <Field label="Response Time Badge">
                                                    <input
                                                        className="cf-input"
                                                        maxLength={60}
                                                        value={config.modalResponseTime}
                                                        onChange={(e) => updateConfig({ modalResponseTime: e.target.value })}
                                                        placeholder="Typically replies in minutes"
                                                    />
                                                </Field>
                                            </div>

                                            <Field label="Header Subtitle">
                                                <input
                                                    className="cf-input"
                                                    maxLength={250}
                                                    value={config.modalSubtitle}
                                                    onChange={(e) => updateConfig({ modalSubtitle: e.target.value })}
                                                    placeholder="Welcome to our live chat! Feel free to ask any questions."
                                                />
                                            </Field>
                                        </Section>

                                        <Section
                                            title="Chat Preview &amp; Start CTA"
                                            description="Configure the simulated incoming message and the action button."
                                        >
                                            <Field label="Welcome Chat Bubble Message">
                                                <textarea
                                                    className="cf-input"
                                                    rows={2}
                                                    maxLength={500}
                                                    value={config.modalChatBubble}
                                                    onChange={(e) => updateConfig({ modalChatBubble: e.target.value })}
                                                    placeholder="We typically reply within a few minutes. How can we help you today?"
                                                />
                                            </Field>
                                            <Field label="CTA Button Text">
                                                <input
                                                    className="cf-input"
                                                    maxLength={50}
                                                    value={config.modalStartChatText}
                                                    onChange={(e) => updateConfig({ modalStartChatText: e.target.value })}
                                                    placeholder="Start chat"
                                                />
                                            </Field>
                                        </Section>

                                        <Section
                                            title="Floating Launcher Design"
                                            description="Customize the floating button shape, size, layout, animation, and responsive offsets."
                                        >
                                            <div className="cf-field-grid">
                                                <Field label="Toggle Button Icon" hint="Icon displayed on the main floating toggle button">
                                                    <select
                                                        className="cf-input"
                                                        value={config.launcherIcon || "chat"}
                                                        onChange={(e) => updateConfig({ launcherIcon: e.target.value as any })}
                                                    >
                                                        <option value="chat">Live Chat (Speech Bubble)</option>
                                                        <option value="whatsapp">WhatsApp</option>
                                                        <option value="messenger">Messenger</option>
                                                        <option value="telegram">Telegram</option>
                                                        <option value="instagram">Instagram</option>
                                                        <option value="phone">Phone Call</option>
                                                        <option value="email">Email</option>
                                                        <option value="support">Customer Support (Headset)</option>
                                                    </select>
                                                </Field>
                                                <Field label="Button Shape">
                                                    <select
                                                        className="cf-input"
                                                        value={config.buttonShape}
                                                        onChange={(e) => updateConfig({ buttonShape: e.target.value as any })}
                                                    >
                                                        <option value="circle">Circle</option>
                                                        <option value="rounded">Rounded Square</option>
                                                        <option value="pill">Pill</option>
                                                    </select>
                                                </Field>
                                            </div>

                                            <div className="cf-field-grid">
                                                <Field label="Button Menu Layout" hint="Arrange channel buttons in vertical stack, 2-column grid, or horizontal row">
                                                    <select
                                                        className="cf-input"
                                                        value={config.layout}
                                                        onChange={(e) => updateConfig({ layout: e.target.value as any })}
                                                    >
                                                        <option value="stack">Stack (Vertical)</option>
                                                        <option value="grid">Grid (2 Columns)</option>
                                                        <option value="horizontal">Horizontal Row</option>
                                                    </select>
                                                </Field>
                                                <Field label="Entrance Animation" hint="Motion preset when launcher/window opens">
                                                    <select
                                                        className="cf-input"
                                                        value={config.animation}
                                                        onChange={(e) => updateConfig({ animation: e.target.value as any })}
                                                    >
                                                        <option value="pop">Pop In</option>
                                                        <option value="bounce">Playful Bounce</option>
                                                        <option value="slide">Slide Up</option>
                                                        <option value="pulse">Pulse Glow</option>
                                                        <option value="none">None (Instant)</option>
                                                    </select>
                                                </Field>
                                            </div>

                                            <div className="cf-field-grid">
                                                <Field label="Button Size">
                                                    <select
                                                        className="cf-input"
                                                        value={config.buttonSize}
                                                        onChange={(e) => updateConfig({ buttonSize: Number(e.target.value) })}
                                                    >
                                                        <option value={46}>Small (46px)</option>
                                                        <option value={56}>Medium (56px)</option>
                                                        <option value={64}>Large (64px)</option>
                                                    </select>
                                                </Field>
                                                <Field label="Launcher Default Color">
                                                    <CustomColorPicker
                                                        value={config.buttonColor || "#5271FF"}
                                                        fallback="#5271FF"
                                                        onChange={(buttonColor) => updateConfig({ buttonColor })}
                                                        ariaLabel="Launcher Default Color"
                                                    />
                                                </Field>
                                            </div>

                                            <div className="cf-field-grid">
                                                <Field label="Desktop Offset X (px)">
                                                    <input
                                                        type="number"
                                                        className="cf-input"
                                                        min={0}
                                                        max={300}
                                                        value={config.offsetX}
                                                        onChange={(e) => updateConfig({ offsetX: Number(e.target.value) || 0 })}
                                                    />
                                                </Field>
                                                <Field label="Desktop Offset Y (px)">
                                                    <input
                                                        type="number"
                                                        className="cf-input"
                                                        min={0}
                                                        max={300}
                                                        value={config.offsetY}
                                                        onChange={(e) => updateConfig({ offsetY: Number(e.target.value) || 0 })}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="cf-field-grid">
                                                <Field label="Mobile Offset X (px)" hint="Distance from screen edge on mobile (<640px)">
                                                    <input
                                                        type="number"
                                                        className="cf-input"
                                                        min={0}
                                                        max={200}
                                                        value={config.mobileOffsetX}
                                                        onChange={(e) => updateConfig({ mobileOffsetX: Number(e.target.value) || 0 })}
                                                    />
                                                </Field>
                                                <Field label="Mobile Offset Y (px)" hint="Distance from screen edge on mobile (<640px)">
                                                    <input
                                                        type="number"
                                                        className="cf-input"
                                                        min={0}
                                                        max={200}
                                                        value={config.mobileOffsetY}
                                                        onChange={(e) => updateConfig({ mobileOffsetY: Number(e.target.value) || 0 })}
                                                    />
                                                </Field>
                                            </div>

                                            <div className="cf-flex-between">
                                                <div className="cf-setting-info">
                                                    <div className="cf-text-sm-semibold">
                                                        Mobile Layout Constraint (Cap 4+)
                                                    </div>
                                                    <div className="cf-text-xs-secondary">
                                                        When 5+ channels are enabled, caps visible mobile buttons (&lt;640px) to the top 4 channels with an expandable '+ More' button to prevent screen clutter.
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={config.mobileCapChannels ?? true}
                                                    onChange={(mobileCapChannels) => updateConfig({ mobileCapChannels })}
                                                />
                                            </div>

                                            <Field label="Accessibility ARIA Label" hint="Screen reader text describing the floating launcher button">
                                                <input
                                                    className="cf-input"
                                                    maxLength={80}
                                                    value={config.ariaLabel}
                                                    onChange={(e) => updateConfig({ ariaLabel: e.target.value })}
                                                    placeholder="Open chat options"
                                                />
                                            </Field>

                                            <div className="cf-field-grid">
                                                <Field label="Unread Notification Badge">
                                                    <div className="cf-flex-center-gap-10">
                                                        <Switch
                                                            checked={config.showBadge}
                                                            onChange={(showBadge) => updateConfig({ showBadge })}
                                                        />
                                                        {config.showBadge && (
                                                            <input
                                                                className="cf-input cf-input-w60"
                                                                maxLength={10}
                                                                value={config.badgeText}
                                                                onChange={(e) => updateConfig({ badgeText: e.target.value })}
                                                                placeholder="1"
                                                            />
                                                        )}
                                                    </div>
                                                </Field>

                                                <Field label="Greeting Bubble Preview">
                                                    <div className="cf-flex-center-gap-10">
                                                        <Switch
                                                            checked={config.greetingEnabled}
                                                            onChange={(greetingEnabled) => updateConfig({ greetingEnabled })}
                                                        />
                                                        <span className="cf-text-xs-secondary">
                                                            {config.greetingEnabled ? "Visible" : "Hidden"}
                                                        </span>
                                                    </div>
                                                </Field>
                                            </div>

                                            {config.greetingEnabled && (
                                                <Field label="Greeting Bubble Text">
                                                    <input
                                                        className="cf-input"
                                                        maxLength={200}
                                                        value={config.greetingText}
                                                        onChange={(e) => updateConfig({ greetingText: e.target.value })}
                                                        placeholder="Need help? Chat with us."
                                                    />
                                                </Field>
                                            )}
                                        </Section>

                                        <Section
                                    title="Interactive Live Preview"
                                    description="Live simulation updates automatically as you edit channels, team agents, and appearance."
                                >
                                    {renderPreview()}
                                </Section>
                            </>
                        )}

                        {/* SETTINGS TAB */}
                        {tab === "settings" && (
                            <>
                                <Section
                                    title="Widget Placement"
                                    description="Configure the default screen anchor for your live chat floating button."
                                >
                                    <Field label="Screen Corner Position">
                                        <select
                                            className="cf-input"
                                            value={config.position}
                                            onChange={(e) => updateConfig({ position: e.target.value as any })}
                                        >
                                            <option value="bottom-right">Bottom Right (Recommended)</option>
                                            <option value="bottom-left">Bottom Left</option>
                                            <option value="top-right">Top Right</option>
                                            <option value="top-left">Top Left</option>
                                        </select>
                                    </Field>

                                    <div className="cf-field-grid">
                                        <Field label="Show Channel Labels" hint="Display text labels alongside channel buttons">
                                            <div className="cf-flex-center-gap-10">
                                                <Switch
                                                    checked={config.showLabels}
                                                    onChange={(showLabels) => updateConfig({ showLabels })}
                                                />
                                                <span className="cf-text-xs-secondary">
                                                    {config.showLabels ? "Visible" : "Hidden"}
                                                </span>
                                            </div>
                                        </Field>

                                        <Field label="Labels on Mobile" hint="Keep labels visible on smaller screens (<640px)">
                                            <div className="cf-flex-center-gap-10">
                                                <Switch
                                                    checked={config.mobileShowLabels}
                                                    onChange={(mobileShowLabels) => updateConfig({ mobileShowLabels })}
                                                />
                                                <span className="cf-text-xs-secondary">
                                                    {config.mobileShowLabels ? "Visible" : "Hidden"}
                                                </span>
                                            </div>
                                        </Field>
                                    </div>
                                </Section>

                                <Section
                                    title="Interaction &amp; Behavior"
                                    description="Configure how and when the chat button triggers, auto-opens, and closes for site visitors."
                                >
                                    <div className="cf-flex-col-gap-14">
                                        <div className="cf-flex-between">
                                            <div className="cf-setting-info">
                                                <div className="cf-text-sm-semibold">
                                                    Auto-open on Load
                                                </div>
                                                <div className="cf-text-xs-secondary">
                                                    Automatically pop open the chat modal or channel menu for visitors.
                                                </div>
                                            </div>
                                            <Switch
                                                checked={config.autoOpen || false}
                                                onChange={(autoOpen) => updateConfig({ autoOpen })}
                                            />
                                        </div>

                                        {config.autoOpen && (
                                            <Field label="Auto-open Delay (Seconds)" hint="How long to wait after page load before opening">
                                                <input
                                                    type="number"
                                                    className="cf-input"
                                                    min={0}
                                                    max={60}
                                                    value={Math.round((config.autoOpenDelay || 1200) / 1000)}
                                                    onChange={(e) => updateConfig({ autoOpenDelay: (Number(e.target.value) || 0) * 1000 })}
                                                />
                                            </Field>
                                        )}

                                        <div className="cf-flex-between">
                                            <div className="cf-setting-info">
                                                <div className="cf-text-sm-semibold">
                                                    Close on Outside Click
                                                </div>
                                                <div className="cf-text-xs-secondary">
                                                    Dismiss the menu or modal when visitor clicks elsewhere on the page.
                                                </div>
                                            </div>
                                            <Switch
                                                checked={config.closeOnOutsideClick ?? true}
                                                onChange={(closeOnOutsideClick) => updateConfig({ closeOnOutsideClick })}
                                            />
                                        </div>

                                        <div className="cf-flex-between">
                                            <div className="cf-setting-info">
                                                <div className="cf-text-sm-semibold">
                                                    Close on Escape Key
                                                </div>
                                                <div className="cf-text-xs-secondary">
                                                    Press Escape to dismiss chat and return keyboard focus to the launcher.
                                                </div>
                                            </div>
                                            <Switch
                                                checked={config.closeOnEscape ?? true}
                                                onChange={(closeOnEscape) => updateConfig({ closeOnEscape })}
                                            />
                                        </div>

                                        <div className="cf-flex-between">
                                            <div className="cf-setting-info">
                                                <div className="cf-text-sm-semibold">
                                                    Close After Clicking Channel
                                                </div>
                                                <div className="cf-text-xs-secondary">
                                                    Collapse the menu after a visitor selects and opens a channel.
                                                </div>
                                            </div>
                                            <Switch
                                                checked={config.closeAfterClick ?? true}
                                                onChange={(closeAfterClick) => updateConfig({ closeAfterClick })}
                                            />
                                        </div>

                                        <div className="cf-flex-between">
                                            <div className="cf-setting-info">
                                                <div className="cf-text-sm-semibold">
                                                    Open Channels in New Tab
                                                </div>
                                                <div className="cf-text-xs-secondary">
                                                    Launch chat app in a fresh browser tab so users keep your site open.
                                                </div>
                                            </div>
                                            <Switch
                                                checked={config.openInNewTab ?? true}
                                                onChange={(openInNewTab) => updateConfig({ openInNewTab })}
                                            />
                                        </div>

                                        <div className="cf-flex-between">
                                            <div className="cf-setting-info">
                                                <div className="cf-text-sm-semibold">
                                                    Greeting Bubble Sound
                                                </div>
                                                <div className="cf-text-xs-secondary">
                                                    Play a subtle notification chime when the bubble pops up.
                                                </div>
                                            </div>
                                            <div className="cf-flex-center-gap-8">
                                                <button
                                                    type="button"
                                                    className="cf-btn-test-chime"
                                                    onClick={() => playNotificationChime()}
                                                    title="Listen to notification sound preview"
                                                >
                                                    <IconVolume size={13} />
                                                    <span>Test Sound</span>
                                                </button>
                                                <Switch
                                                    checked={config.enableSound ?? false}
                                                    onChange={(enableSound) => {
                                                        updateConfig({ enableSound })
                                                        if (enableSound) {
                                                            playNotificationChime()
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <Field label="Greeting Appearance Delay (Seconds)">
                                            <input
                                                type="number"
                                                className="cf-input"
                                                min={0}
                                                max={60}
                                                value={Math.round(config.greetingDelay / 1000)}
                                                onChange={(e) => updateConfig({ greetingDelay: (Number(e.target.value) || 0) * 1000 })}
                                            />
                                        </Field>
                                    </div>
                                </Section>

                                <Section
                                    title="Behavioral Triggers & Smart Display"
                                    description="Enterprise triggers: scroll depth, desktop exit-intent, operating hours schedule, and URL path targeting."
                                >
                                    <div className="cf-flex-col-gap-14">
                                        {/* 1. Scroll Depth Trigger */}
                                        <div className={`cf-trigger-card ${config.scrollTriggerEnabled ? "is-active" : ""}`}>
                                            <div className="cf-trigger-card-header">
                                                <div className="cf-trigger-info">
                                                    <div className="cf-trigger-title">Scroll Depth Trigger</div>
                                                    <div className="cf-trigger-desc">
                                                        Only reveal the floating launcher or greeting bubble after visitor scrolls past a percentage of the page.
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={config.scrollTriggerEnabled || false}
                                                    onChange={(scrollTriggerEnabled) => updateConfig({ scrollTriggerEnabled })}
                                                />
                                            </div>
                                            {config.scrollTriggerEnabled && (
                                                <div className="cf-trigger-body">
                                                    <Field label="Scroll Percentage Threshold" hint="Reveal after visitor scrolls past this depth">
                                                        <div className="cf-flex-center-gap-10">
                                                            <input
                                                                type="range"
                                                                min={5}
                                                                max={95}
                                                                step={5}
                                                                className="cf-range-input"
                                                                value={config.scrollTriggerPercent ?? 25}
                                                                onChange={(e) => updateConfig({ scrollTriggerPercent: Number(e.target.value) })}
                                                            />
                                                            <span className="cf-badge-value">{config.scrollTriggerPercent ?? 25}%</span>
                                                        </div>
                                                    </Field>
                                                    <Field label="Trigger Target" hint="Choose what to reveal once threshold is met">
                                                        <select
                                                            className="cf-input"
                                                            value={config.scrollTriggerTarget || "launcher"}
                                                            onChange={(e) => updateConfig({ scrollTriggerTarget: e.target.value as any })}
                                                        >
                                                            <option value="launcher">Floating Launcher (Reveal Entire Widget)</option>
                                                            <option value="greeting">Greeting Bubble Only (Launcher Stays Visible)</option>
                                                        </select>
                                                    </Field>
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. Exit-Intent Trigger (Desktop) */}
                                        <div className={`cf-trigger-card ${config.exitIntentEnabled ? "is-active" : ""}`}>
                                            <div className="cf-trigger-card-header">
                                                <div className="cf-trigger-info">
                                                    <div className="cf-trigger-title">Exit-Intent Trigger (Desktop)</div>
                                                    <div className="cf-trigger-desc">
                                                        Detect when desktop visitors move cursor towards the browser tab bar to exit, re-engaging them before they leave.
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={config.exitIntentEnabled || false}
                                                    onChange={(exitIntentEnabled) => updateConfig({ exitIntentEnabled })}
                                                />
                                            </div>
                                            {config.exitIntentEnabled && (
                                                <div className="cf-trigger-body">
                                                    <Field label="Exit-Intent Action" hint="Action to take when visitor heads to leave">
                                                        <select
                                                            className="cf-input"
                                                            value={config.exitIntentAction || "modal"}
                                                            onChange={(e) => updateConfig({ exitIntentAction: e.target.value as any })}
                                                        >
                                                            <option value="modal">Pop Open Chat Window (High Conversion)</option>
                                                            <option value="greeting">Display Greeting Bubble (Subtle Notice)</option>
                                                        </select>
                                                    </Field>
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Operating Hours & Days Schedule */}
                                        <div className={`cf-trigger-card ${config.scheduleEnabled ? "is-active" : ""}`}>
                                            <div className="cf-trigger-card-header">
                                                <div className="cf-trigger-info">
                                                    <div className="cf-trigger-title">Operating Hours & Days Schedule</div>
                                                    <div className="cf-trigger-desc">
                                                        Set working hours. Automatically switch agent badges to Offline outside office hours, or adjust the response badge.
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={config.scheduleEnabled || false}
                                                    onChange={(scheduleEnabled) => updateConfig({ scheduleEnabled })}
                                                />
                                            </div>
                                            {config.scheduleEnabled && (
                                                <div className="cf-trigger-body">
                                                    <Field label="Operating Days" hint="Select active days of the week">
                                                        <div className="cf-day-selector">
                                                            {[
                                                                { label: "Mon", day: 1 },
                                                                { label: "Tue", day: 2 },
                                                                { label: "Wed", day: 3 },
                                                                { label: "Thu", day: 4 },
                                                                { label: "Fri", day: 5 },
                                                                { label: "Sat", day: 6 },
                                                                { label: "Sun", day: 0 },
                                                            ].map(({ label, day }) => {
                                                                const isActive = (config.scheduleDays || [1, 2, 3, 4, 5]).includes(day)
                                                                return (
                                                                    <button
                                                                        key={day}
                                                                        type="button"
                                                                        className={`cf-day-pill ${isActive ? "active" : ""}`}
                                                                        onClick={() => {
                                                                            const current = config.scheduleDays || [1, 2, 3, 4, 5]
                                                                            const next = isActive
                                                                                ? current.filter((d) => d !== day)
                                                                                : [...current, day]
                                                                            if (next.length > 0) {
                                                                                updateConfig({ scheduleDays: next })
                                                                            }
                                                                        }}
                                                                    >
                                                                        {label}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                        <div className="cf-day-presets">
                                                            <button
                                                                type="button"
                                                                className={`cf-preset-pill ${
                                                                    (config.scheduleDays || [1, 2, 3, 4, 5]).length === 5 &&
                                                                    [1, 2, 3, 4, 5].every((d) => (config.scheduleDays || [1, 2, 3, 4, 5]).includes(d))
                                                                        ? "is-active"
                                                                        : ""
                                                                }`}
                                                                onClick={() => updateConfig({ scheduleDays: [1, 2, 3, 4, 5] })}
                                                            >
                                                                Weekdays (Mon-Fri)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`cf-preset-pill ${
                                                                    (config.scheduleDays || [1, 2, 3, 4, 5]).length === 2 &&
                                                                    [6, 0].every((d) => (config.scheduleDays || [1, 2, 3, 4, 5]).includes(d))
                                                                        ? "is-active"
                                                                        : ""
                                                                }`}
                                                                onClick={() => updateConfig({ scheduleDays: [6, 0] })}
                                                            >
                                                                Weekends
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`cf-preset-pill ${
                                                                    (config.scheduleDays || [1, 2, 3, 4, 5]).length === 7
                                                                        ? "is-active"
                                                                        : ""
                                                                }`}
                                                                onClick={() => updateConfig({ scheduleDays: [1, 2, 3, 4, 5, 6, 0] })}
                                                            >
                                                                All 7 Days
                                                            </button>
                                                        </div>
                                                    </Field>

                                                    <div className="cf-field-grid">
                                                        <Field label="Opening Time" hint="Store opening time">
                                                            <input
                                                                type="time"
                                                                className="cf-input"
                                                                value={config.scheduleStart || "09:00"}
                                                                onChange={(e) => updateConfig({ scheduleStart: e.target.value })}
                                                            />
                                                        </Field>
                                                        <Field label="Closing Time" hint="Store closing time">
                                                            <input
                                                                type="time"
                                                                className="cf-input"
                                                                value={config.scheduleEnd || "18:00"}
                                                                onChange={(e) => updateConfig({ scheduleEnd: e.target.value })}
                                                            />
                                                        </Field>
                                                    </div>

                                                    <div className="cf-field-grid">
                                                        <Field label="Outside Hours Action" hint="What happens outside business hours">
                                                            <select
                                                                className="cf-input"
                                                                value={config.scheduleOfflineAction || "badge"}
                                                                onChange={(e) => updateConfig({ scheduleOfflineAction: e.target.value as any })}
                                                            >
                                                                <option value="badge">Show "Offline" Badge & Notice</option>
                                                                <option value="hide">Hide Widget Completely</option>
                                                            </select>
                                                        </Field>
                                                        {config.scheduleOfflineAction !== "hide" && (
                                                            <Field label="Offline Badge Notice" hint="Header badge shown outside hours">
                                                                <input
                                                                    className="cf-input"
                                                                    maxLength={80}
                                                                    value={config.scheduleOfflineText || "Back tomorrow at 9:00 AM"}
                                                                    onChange={(e) => updateConfig({ scheduleOfflineText: e.target.value })}
                                                                    placeholder="Back tomorrow at 9:00 AM"
                                                                />
                                                            </Field>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 4. Page / URL Targeting Filter */}
                                        <div className={`cf-trigger-card ${config.targetingEnabled ? "is-active" : ""}`}>
                                            <div className="cf-trigger-card-header">
                                                <div className="cf-trigger-info">
                                                    <div className="cf-trigger-title">Page / URL Targeting Filter</div>
                                                    <div className="cf-trigger-desc">
                                                        Show or hide the widget on specific page paths (e.g., hide on /checkout or only show on /pricing).
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={config.targetingEnabled || false}
                                                    onChange={(targetingEnabled) => updateConfig({ targetingEnabled })}
                                                />
                                            </div>
                                            {config.targetingEnabled && (
                                                <div className="cf-trigger-body">
                                                    <Field label="Targeting Mode" hint="Show only on listed paths, or hide on listed paths">
                                                        <select
                                                            className="cf-input"
                                                            value={config.targetingMode || "show"}
                                                            onChange={(e) => updateConfig({ targetingMode: e.target.value as any })}
                                                        >
                                                            <option value="show">Show Widget Only on Listed Paths</option>
                                                            <option value="hide">Hide Widget on Listed Paths (Show Everywhere Else)</option>
                                                        </select>
                                                    </Field>
                                                    <Field label="URL Paths & Wildcards" hint="Enter paths separated by lines or commas. Use * for wildcards (e.g. /checkout, /blog/*)">
                                                        <textarea
                                                            className="cf-textarea"
                                                            rows={3}
                                                            value={config.targetingRules || ""}
                                                            onChange={(e) => updateConfig({ targetingRules: e.target.value })}
                                                            placeholder={"/pricing\n/checkout\n/products/*"}
                                                        />
                                                    </Field>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Section>
                            </>
                        )}
                    </>
                )}
            </main>

            <footer className="actions">
                <div className="cf-footer-grid">
                    <button
                        type="button"
                        className="primary-cta"
                        onClick={handleInsertToCanvas}
                        disabled={inserting}
                        title="Insert reusable Chatfic component onto the Framer canvas"
                    >
                        <IconSparkles size={16} />
                        <span>{inserting ? "Inserting..." : "Insert into Canvas"}</span>
                    </button>
                    <button
                        type="button"
                        className="secondary-cta"
                        onClick={reset}
                        disabled={inserting}
                        title="Restore default settings"
                    >
                        <IconRefresh size={13} />
                        <span>Reset</span>
                    </button>
                </div>
                <div className="cf-shell-footer-bar">
                    <a
                        href="https://www.framefic.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cf-shell-company-link"
                        title="Visit Framefic website"
                    >
                        <span>@Framefic</span>
                        <IconExternalLink size={12} />
                    </a>
                    <span className="cf-shell-version">v0.1.0 · Framefic</span>
                </div>
            </footer>
        </div>
    )
}
