import { framer } from "@framer/plugin"
import type { ChatConfig } from "../types"
import { CHANNEL_PATHS } from "../widget/icons"
import { MODAL_THEME_GRADIENTS } from "../core/config"
import { SVG_AVATAR_PRESETS } from "../core/avatars"
import { getSiteInfo } from "../lib/framer/project"

let cachedHasAccess: boolean = false
let cachedIsTrial: boolean = false

export function setCanvasLicensingState(hasAccess: boolean, isTrial: boolean, _apiBaseUrl?: string) {
    cachedHasAccess = hasAccess
    cachedIsTrial = isTrial
}

function sanitizeGradient(val?: string | null): string {
    if (!val || typeof val !== "string") return ""
    const trimmed = val.trim()
    if (/[;<>"'`\\]/.test(trimmed) || /url\s*\(/i.test(trimmed) || /javascript:/i.test(trimmed) || /expression\s*\(/i.test(trimmed)) {
        return ""
    }
    const isGradient = /^(linear-gradient|radial-gradient)\([a-zA-Z0-9\s(),#%.-]+\)$/i.test(trimmed)
    const isColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed) || /^rgba?\([0-9\s,%.-]+\)$/.test(trimmed)
    return (isGradient || isColor) ? trimmed : ""
}

export function generateComponentCode(
    config: ChatConfig,
    _siteId?: string | null,
    _siteUrl?: string | null,
    showBranding: boolean = cachedIsTrial,
    isLocked: boolean = !cachedHasAccess
): string {
    const channelPathEntries = Object.entries(CHANNEL_PATHS)
        .map(([key, d]) => `  ${JSON.stringify(key)}: ${JSON.stringify(d)},`)
        .join("\n")

    const safeCustomGradient = sanitizeGradient(config.modalCustomGradient)
    const gradient = config.modalTheme === "custom" && safeCustomGradient
        ? safeCustomGradient
        : MODAL_THEME_GRADIENTS[config.modalTheme] || MODAL_THEME_GRADIENTS.whatsapp

    const defaultAgentsJson = JSON.stringify(
        config.agents && config.agents.length > 0
            ? config.agents
            : [
                  {
                      id: "agent-1",
                      name: "Alex",
                      role: "Support Manager",
                      avatar: SVG_AVATAR_PRESETS[0],
                      channelId: "whatsapp",
                  },
                  {
                      id: "agent-2",
                      name: "Sarah",
                      role: "Customer Support",
                      avatar: SVG_AVATAR_PRESETS[1],
                      channelId: "messenger",
                  },
                  {
                      id: "agent-3",
                      name: "David",
                      role: "Technical Team",
                      avatar: SVG_AVATAR_PRESETS[2],
                      channelId: "telegram",
                  },
              ]
    )

    return `import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

const CHANNEL_PATHS: Record<string, string> = {
${channelPathEntries}
}

function sanitizeGradient(val?: string | null): string {
    if (!val || typeof val !== "string") return ""
    const trimmed = val.trim()
    if (/[;<>"'\`\\]/.test(trimmed) || /url\\s*\\(/i.test(trimmed) || /javascript:/i.test(trimmed) || /expression\\s*\\(/i.test(trimmed)) {
        return ""
    }
    const isGradient = /^(linear-gradient|radial-gradient)\\([a-zA-Z0-9\\s(),#%.-]+\\)$/i.test(trimmed)
    const isColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed) || /^rgba?\\([0-9\\s,%.-]+\\)$/.test(trimmed)
    return (isGradient || isColor) ? trimmed : ""
}

function renderChannelIcon(channelId: string, size: number = 22): React.ReactElement {
    const d = CHANNEL_PATHS[channelId] || CHANNEL_PATHS.whatsapp
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            aria-hidden="true"
            style={{ width: size, height: size, display: "block" }}
        >
            <path fill="currentColor" d={d} />
        </svg>
    )
}

function renderLauncherIcon(launcherIcon: string, isOpen: boolean, isLocked: boolean): React.ReactElement {
    if (isOpen) {
        return (
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
            </svg>
        )
    }
    if (isLocked) {
        return (
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        )
    }
    if (launcherIcon === "support") {
        return (
            <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
                <path d="M12 2a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1v-6H5v-1a7 7 0 1 1 14 0v1h-2v6h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9Zm-5 13v3H6a1 1 0 0 1-1-1v-2h2Zm12 2a1 1 0 0 1-1 1h-1v-3h2v2Z" />
            </svg>
        )
    }
    if (launcherIcon === "chat" || !CHANNEL_PATHS[launcherIcon]) {
        return (
            <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm0 14H5.2L4 17.2V4h16v12Z" />
                <circle cx="8" cy="10" r="1.5" />
                <circle cx="12" cy="10" r="1.5" />
                <circle cx="16" cy="10" r="1.5" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden="true">
            <path fill="currentColor" d={CHANNEL_PATHS[launcherIcon]} />
        </svg>
    )
}

const GRADIENTS: Record<string, string> = {
  whatsapp: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
  messenger: "linear-gradient(135deg, #0084FF 0%, #00C6FF 100%)",
  telegram: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
  instagram: "linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)",
  tiktok: "linear-gradient(135deg, #111111 0%, #1f2937 60%, #FE2C55 100%)",
  wechat: "linear-gradient(135deg, #07C160 0%, #048843 100%)",
  dark: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
  custom: ${JSON.stringify(gradient)},
}

interface ChatBubblesProps {
    style?: React.CSSProperties
    canvasPreview?: "modal" | "chat" | "closed"
    widgetMode?: "modal" | "buttons"
    modalTheme?: "whatsapp" | "messenger" | "telegram" | "instagram" | "tiktok" | "wechat" | "dark" | "custom"
    modalCustomGradient?: string
    modalTitle?: string
    modalSubtitle?: string
    modalResponseTime?: string
    modalChatBubble?: string
    modalStartChatText?: string
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
    layout?: "stack" | "grid" | "horizontal"
    animation?: "pop" | "bounce" | "slide" | "pulse" | "none"
    buttonColor?: string
    buttonShape?: "circle" | "rounded" | "pill"
    launcherText?: string
    launcherIcon?: "chat" | "whatsapp" | "messenger" | "telegram" | "instagram" | "phone" | "email" | "support"
    showLabels?: boolean
    mobileShowLabels?: boolean
    mobileOffsetX?: number
    mobileOffsetY?: number
    mobileCapChannels?: boolean
    closeOnOutsideClick?: boolean
    closeOnEscape?: boolean
    closeAfterClick?: boolean
    autoOpen?: boolean
    autoOpenDelay?: number
    ariaLabel?: string
    greetingEnabled?: boolean
    greetingText?: string
    greetingDelay?: number
    enableSound?: boolean
    showBadge?: boolean
    badgeText?: string
    whatsapp?: string
    whatsappMessage?: string
    messenger?: string
    telegram?: string
    telegramMessage?: string
    instagram?: string
    tiktok?: string
    wechat?: string
    viber?: string
    line?: string
    signal?: string
    phone?: string
    sms?: string
    smsMessage?: string
    email?: string
    emailSubject?: string
    emailMessage?: string
    discord?: string
    slack?: string
    teams?: string
    x?: string
    linkedin?: string
    maps?: string
    custom?: string
    customLabel?: string
    enableAnalytics?: boolean
    scrollTriggerEnabled?: boolean
    scrollTriggerPercent?: number
    scrollTriggerTarget?: "launcher" | "greeting"
    exitIntentEnabled?: boolean
    exitIntentAction?: "modal" | "greeting"
    scheduleEnabled?: boolean
    scheduleDays?: number[]
    scheduleStart?: string
    scheduleEnd?: string
    scheduleOfflineAction?: "badge" | "hide"
    scheduleOfflineText?: string
    targetingEnabled?: boolean
    showOn?: string
    canvasPagePath?: string
    targetingMode?: "show" | "hide"
    targetingRules?: string
    agentsData?: string
    scheduleDaysData?: string
}

// Web Audio Synthesizer singleton & gesture unlocker
let sharedChatAudioCtx: AudioContext | null = null
let pendingChimeQueued = false
let pendingChimeExpireTime = 0
let globalLastChimeTime = 0

function isFramerStudioCanvas(): boolean {
    if (typeof window === "undefined") return false
    try {
        if (typeof RenderTarget !== "undefined" && typeof RenderTarget.current === "function") {
            return RenderTarget.current() === RenderTarget.canvas
        }
    } catch {}
    return false
}

function getSharedAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return null
    if (!sharedChatAudioCtx || sharedChatAudioCtx.state === "closed") {
        try {
            sharedChatAudioCtx = new AudioCtx()
        } catch {
            return null
        }
    }
    return sharedChatAudioCtx
}

function unlockSharedAudioContext(ctx: AudioContext | null) {
    if (!ctx) return
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {})
    }
    // iOS Safari silent buffer unlock to ensure hardware audio routing is activated
    try {
        const buffer = ctx.createBuffer(1, 1, 22050)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.start(0)
    } catch {}
}

function playSynthesizedTone(ctx: AudioContext) {
    try {
        const now = ctx.currentTime

        // Crisp 2-tone melodic chime: Note 1 D5 (587.33 Hz) -> Note 2 A5 (880 Hz)
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = "sine"
        osc1.frequency.setValueAtTime(587.33, now)
        gain1.gain.setValueAtTime(0.0001, now)
        gain1.gain.linearRampToValueAtTime(0.24, now + 0.015)
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.22)

        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = "sine"
        osc2.frequency.setValueAtTime(880, now + 0.08)
        gain2.gain.setValueAtTime(0.0001, now + 0.08)
        gain2.gain.linearRampToValueAtTime(0.28, now + 0.095)
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.40)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.08)
        osc2.stop(now + 0.40)
    } catch {}
}

function playNotificationChimeDirect(force: boolean = false) {
    try {
        if (typeof window === "undefined") return
        // Never play chime when in Framer design canvas mode
        if (isFramerStudioCanvas()) return

        const now = Date.now()
        // Framer mounts multiple variant breakpoints (Desktop, Tablet, Mobile) in the DOM simultaneously.
        // A 1200ms debounce prevents simultaneous breakpoint mounts from echoing without silencing real notifications.
        if (!force && now - globalLastChimeTime < 1200) {
            return
        }

        const ctx = getSharedAudioContext()
        if (!ctx) return

        if (ctx.state === "running") {
            playSynthesizedTone(ctx)
            globalLastChimeTime = now
            pendingChimeQueued = false
            pendingChimeExpireTime = 0
        } else {
            // AudioContext is suspended (browser autoplay policy on live sites)
            // Mark pending so the first user interaction immediately flushes the chime
            pendingChimeQueued = true
            pendingChimeExpireTime = now + 15000 // Valid for 15s while greeting is active
            ctx.resume().then(() => {
                if (ctx.state === "running") {
                    const currentNow = Date.now()
                    if (!force && currentNow - globalLastChimeTime < 1200) {
                        return
                    }
                    playSynthesizedTone(ctx)
                    globalLastChimeTime = currentNow
                    pendingChimeQueued = false
                    pendingChimeExpireTime = 0
                }
            }).catch(() => {
                pendingChimeQueued = true
            })
        }
    } catch {
        pendingChimeQueued = true
    }
}

function flushPendingChimeIfQueued() {
    if (!pendingChimeQueued) return
    const now = Date.now()
    if (pendingChimeExpireTime && now > pendingChimeExpireTime) {
        pendingChimeQueued = false
        pendingChimeExpireTime = 0
        return
    }
    if (now - globalLastChimeTime < 1200) return

    const ctx = getSharedAudioContext()
    if (!ctx) return

    unlockSharedAudioContext(ctx)

    if (ctx.state === "running") {
        playSynthesizedTone(ctx)
        globalLastChimeTime = now
        pendingChimeQueued = false
        pendingChimeExpireTime = 0
    } else {
        ctx.resume().then(() => {
            if (ctx.state === "running") {
                const currentNow = Date.now()
                if (currentNow - globalLastChimeTime < 1200) return
                playSynthesizedTone(ctx)
                globalLastChimeTime = currentNow
                pendingChimeQueued = false
                pendingChimeExpireTime = 0
            }
        }).catch(() => {})
    }
}

function cancelPendingChime() {
    pendingChimeQueued = false
    pendingChimeExpireTime = 0
}

function resolveBreakpointKey(el: HTMLElement | null): string {
    if (!el || typeof window === "undefined") return "desktop"
    try {
        let cur: HTMLElement | null = el.parentElement
        while (cur && cur !== document.body) {
            const nameAttr = (cur.getAttribute("data-framer-name") || cur.getAttribute("name") || "").toLowerCase().trim()
            if (nameAttr.includes("phone") || nameAttr.includes("mobile") || nameAttr.includes("iphone") || nameAttr.includes("android")) {
                return "phone"
            }
            if (nameAttr.includes("tablet") || nameAttr.includes("ipad")) {
                return "tablet"
            }
            if (nameAttr.includes("desktop") || nameAttr.includes("laptop") || nameAttr.includes("screen") || nameAttr.includes("macbook")) {
                return "desktop"
            }
            const bpAttr = (cur.getAttribute("data-framer-breakpoint") || cur.getAttribute("data-breakpoint") || "").toLowerCase().trim()
            if (bpAttr) {
                if (bpAttr.includes("phone") || bpAttr.includes("mobile")) return "phone"
                if (bpAttr.includes("tablet")) return "tablet"
                if (bpAttr.includes("desktop")) return "desktop"
                return bpAttr
            }
            cur = cur.parentElement
        }

        cur = el.parentElement
        while (cur && cur !== document.body) {
            const rect = cur.getBoundingClientRect()
            if (rect.width >= 100 && rect.width < 10000) {
                if (rect.width < 600) return "phone"
                if (rect.width < 1000) return "tablet"
                return "desktop"
            }
            cur = cur.parentElement
        }

        const winW = window.innerWidth
        if (winW < 600) return "phone"
        if (winW < 1000) return "tablet"
        return "desktop"
    } catch {
        return "desktop"
    }
}

export default function ChatBubbles(props: ChatBubblesProps) {
    const {
        style,
        canvasPreview = "modal",
        widgetMode = ${JSON.stringify(config.widgetMode || "modal")},
        modalTheme = ${JSON.stringify(config.modalTheme || "whatsapp")},
        modalCustomGradient = ${JSON.stringify(config.modalCustomGradient || "")},
        modalTitle = ${JSON.stringify(config.modalTitle || "Hi there!")},
        modalSubtitle = ${JSON.stringify(config.modalSubtitle || "Welcome to our live chat! Feel free to ask any questions.")},
        modalResponseTime = ${JSON.stringify(config.modalResponseTime || "We typically reply within a few minutes")},
        modalChatBubble = ${JSON.stringify(config.modalChatBubble || "We typically reply within a few minutes. How can we help you today?")},
        modalStartChatText = ${JSON.stringify(config.modalStartChatText || "Start chat")},
        position = ${JSON.stringify(config.position || "bottom-right")},
        layout = ${JSON.stringify(config.layout || "stack")},
        animation = ${JSON.stringify(config.animation || "pop")},
        buttonColor = ${JSON.stringify(config.buttonColor || "#25D366")},
        buttonShape = ${JSON.stringify(config.buttonShape || "circle")},
        launcherText = "Chat",
        launcherIcon = ${JSON.stringify(config.launcherIcon || "chat")},
        showLabels = ${Boolean(config.showLabels)},
        mobileShowLabels = ${Boolean(config.mobileShowLabels ?? false)},
        mobileOffsetX = ${Number(config.mobileOffsetX ?? 16)},
        mobileOffsetY = ${Number(config.mobileOffsetY ?? 16)},
        mobileCapChannels = ${Boolean(config.mobileCapChannels ?? true)},
        closeOnOutsideClick = ${Boolean(config.closeOnOutsideClick ?? true)},
        closeOnEscape = ${Boolean(config.closeOnEscape ?? true)},
        closeAfterClick = ${Boolean(config.closeAfterClick ?? true)},
        autoOpen = ${Boolean(config.autoOpen)},
        autoOpenDelay = ${Number(config.autoOpenDelay ?? 1200)},
        ariaLabel = ${JSON.stringify(config.ariaLabel || "Open chat options")},
        greetingEnabled = ${Boolean(config.greetingEnabled)},
        greetingText = ${JSON.stringify(config.greetingText || "Need help? Chat with us.")},
        greetingDelay = ${Number(config.greetingDelay ?? 2000)},
        enableSound = ${Boolean(config.enableSound)},
        showBadge = ${Boolean(config.showBadge)},
        badgeText = ${JSON.stringify(config.badgeText || "1")},
        enableAnalytics = ${Boolean(config.enableAnalytics !== false)},
        scrollTriggerEnabled = ${Boolean(config.scrollTriggerEnabled)},
        scrollTriggerPercent = ${Number(config.scrollTriggerPercent ?? 25)},
        scrollTriggerTarget = ${JSON.stringify(config.scrollTriggerTarget || "launcher")},
        exitIntentEnabled = ${Boolean(config.exitIntentEnabled)},
        exitIntentAction = ${JSON.stringify(config.exitIntentAction || "modal")},
        scheduleEnabled = ${Boolean(config.scheduleEnabled)},
        scheduleDays = ${JSON.stringify(config.scheduleDays || [1, 2, 3, 4, 5])},
        scheduleStart = ${JSON.stringify(config.scheduleStart || "09:00")},
        scheduleEnd = ${JSON.stringify(config.scheduleEnd || "18:00")},
        scheduleOfflineAction = ${JSON.stringify(config.scheduleOfflineAction || "badge")},
        scheduleOfflineText = ${JSON.stringify(config.scheduleOfflineText || "Back tomorrow at 9:00 AM")},
        targetingEnabled = true,
        showOn = ${JSON.stringify(config.showOn || "Every page")},
        canvasPagePath = "",
        targetingMode = ${JSON.stringify(config.targetingMode || "show")},
        targetingRules = ${JSON.stringify(config.targetingRules || "")},
        agentsData = ${JSON.stringify(JSON.stringify(config.agents || []))},
        scheduleDaysData = ${JSON.stringify(JSON.stringify(config.scheduleDays || [1, 2, 3, 4, 5]))},
        whatsapp = ${JSON.stringify(config.channels.find((c) => c.id === "whatsapp")?.value || "")},
        whatsappMessage = ${JSON.stringify(config.channels.find((c) => c.id === "whatsapp")?.message || "Hello! I would like to know more.")},
        messenger = ${JSON.stringify(config.channels.find((c) => c.id === "messenger")?.value || "")},
        telegram = ${JSON.stringify(config.channels.find((c) => c.id === "telegram")?.value || "")},
        telegramMessage = ${JSON.stringify(config.channels.find((c) => c.id === "telegram")?.message || "Hello!")},
        instagram = ${JSON.stringify(config.channels.find((c) => c.id === "instagram")?.value || "")},
        tiktok = ${JSON.stringify(config.channels.find((c) => c.id === "tiktok")?.value || "")},
        wechat = ${JSON.stringify(config.channels.find((c) => c.id === "wechat")?.value || "")},
        viber = ${JSON.stringify(config.channels.find((c) => c.id === "viber")?.value || "")},
        line = ${JSON.stringify(config.channels.find((c) => c.id === "line")?.value || "")},
        signal = ${JSON.stringify(config.channels.find((c) => c.id === "signal")?.value || "")},
        phone = ${JSON.stringify(config.channels.find((c) => c.id === "phone")?.value || "")},
        sms = ${JSON.stringify(config.channels.find((c) => c.id === "sms")?.value || "")},
        smsMessage = ${JSON.stringify(config.channels.find((c) => c.id === "sms")?.message || "")},
        email = ${JSON.stringify(config.channels.find((c) => c.id === "email")?.value || "")},
        emailSubject = ${JSON.stringify(config.channels.find((c) => c.id === "email")?.emailSubject || "")},
        emailMessage = ${JSON.stringify(config.channels.find((c) => c.id === "email")?.message || "")},
        discord = ${JSON.stringify(config.channels.find((c) => c.id === "discord")?.value || "")},
        slack = ${JSON.stringify(config.channels.find((c) => c.id === "slack")?.value || "")},
        teams = ${JSON.stringify(config.channels.find((c) => c.id === "teams")?.value || "")},
        x = ${JSON.stringify(config.channels.find((c) => c.id === "x")?.value || "")},
        linkedin = ${JSON.stringify(config.channels.find((c) => c.id === "linkedin")?.value || "")},
        maps = ${JSON.stringify(config.channels.find((c) => c.id === "maps")?.value || "")},
        custom = ${JSON.stringify(config.channels.find((c) => c.id === "custom")?.value || "")},
        customLabel = ${JSON.stringify(config.channels.find((c) => c.id === "custom")?.label || "Custom")},
    } = props

    const isCanvas = typeof RenderTarget !== "undefined" && typeof RenderTarget.current === "function" && RenderTarget.current() === RenderTarget.canvas
    // @chat-bubbles-lock-state: ${isLocked ? "locked" : "unlocked"}
    const IS_LOCKED = ${Boolean(isLocked)}
    const showBranding = ${Boolean(showBranding)}
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = React.useState(isCanvas ? canvasPreview !== "closed" : false)
    const [greetingDismissed, setGreetingDismissed] = React.useState(false)
    const [selectedAgent, setSelectedAgent] = React.useState<any | null>(null)
    const [navDirection, setNavDirection] = React.useState<"forward" | "backward">("forward")
    const [customMessage, setCustomMessage] = React.useState("")
    const [mobileExpanded, setMobileExpanded] = React.useState(false)

    // Single-instance duplicate protection: allows 1 instance per responsive breakpoint (Desktop, Tablet, Mobile)
    const instanceId = React.useMemo(() => Math.random().toString(36).slice(2, 9), [])
    const [isDuplicate, setIsDuplicate] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const w = window as any
        w.__chat_bubbles_instances_by_bp__ = w.__chat_bubbles_instances_by_bp__ || {}

        let registeredBp = ""
        function register() {
            const el = containerRef.current
            const bpKey = resolveBreakpointKey(el)
            if (registeredBp && registeredBp !== bpKey) {
                const oldArr = w.__chat_bubbles_instances_by_bp__[registeredBp]
                if (oldArr) {
                    const idx = oldArr.indexOf(instanceId)
                    if (idx >= 0) oldArr.splice(idx, 1)
                }
            }
            registeredBp = bpKey
            w.__chat_bubbles_instances_by_bp__[bpKey] = w.__chat_bubbles_instances_by_bp__[bpKey] || []
            const reg: string[] = w.__chat_bubbles_instances_by_bp__[bpKey]
            if (reg.indexOf(instanceId) === -1) {
                reg.push(instanceId)
            }
            setIsDuplicate(reg.indexOf(instanceId) > 0)
        }

        register()
        const timer1 = setTimeout(register, 50)
        const timer2 = setTimeout(register, 250)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            if (registeredBp && w.__chat_bubbles_instances_by_bp__ && w.__chat_bubbles_instances_by_bp__[registeredBp]) {
                const arr: string[] = w.__chat_bubbles_instances_by_bp__[registeredBp]
                const idx = arr.indexOf(instanceId)
                if (idx >= 0) {
                    arr.splice(idx, 1)
                }
            }
        }
    }, [instanceId])

    // Delays normalization (supports milliseconds or seconds)
    const finalGreetingDelay = Number(greetingDelay ?? 2000) > 60 ? Number(greetingDelay ?? 2000) : Number(greetingDelay ?? 2) * 1000
    const finalAutoOpenDelay = Number(autoOpenDelay ?? 1200) > 60 ? Number(autoOpenDelay ?? 1200) : Number(autoOpenDelay ?? 1.2) * 1000

    // 1. Operating Hours & Days Schedule Calculation
    const activeScheduleDays = React.useMemo(() => {
        if (typeof scheduleDaysData === "string" && scheduleDaysData.trim()) {
            try {
                const parsed = JSON.parse(scheduleDaysData)
                if (Array.isArray(parsed)) return parsed
            } catch {}
        }
        return Array.isArray(scheduleDays) ? scheduleDays : [1, 2, 3, 4, 5]
    }, [scheduleDaysData, scheduleDays])

    const isOffline = React.useMemo(() => {
        if (isCanvas || !scheduleEnabled) return false
        try {
            const now = new Date()
            const curDay = now.getDay()
            if (!activeScheduleDays.includes(curDay)) return true
            const curMins = now.getHours() * 60 + now.getMinutes()
            const sParts = String(scheduleStart || "09:00").split(":")
            const eParts = String(scheduleEnd || "18:00").split(":")
            const sMins = (parseInt(sParts[0], 10) || 9) * 60 + (parseInt(sParts[1], 10) || 0)
            const eMins = (parseInt(eParts[0], 10) || 18) * 60 + (parseInt(eParts[1], 10) || 0)
            if (sMins <= eMins) {
                return curMins < sMins || curMins >= eMins
            } else {
                return curMins < sMins && curMins >= eMins
            }
        } catch {
            return false
        }
    }, [isCanvas, scheduleEnabled, activeScheduleDays, scheduleStart, scheduleEnd])

    // 2. Dynamic Location Tracker for Page Targeting & SPA Navigation in Framer
    const [currentLocationPath, setCurrentLocationPath] = React.useState(() => {
        return typeof window !== "undefined" && window.location && window.location.pathname ? window.location.pathname : "/"
    })

    React.useEffect(() => {
        if (typeof window === "undefined") return
        function syncLocationPath() {
            const next = window.location && window.location.pathname ? window.location.pathname : "/"
            setCurrentLocationPath((prev: string) => (prev !== next ? next : prev))
        }
        window.addEventListener("popstate", syncLocationPath)
        const pathPollTimer = setInterval(syncLocationPath, 400)
        return () => {
            window.removeEventListener("popstate", syncLocationPath)
            clearInterval(pathPollTimer)
        }
    }, [])

    // Page / URL Targeting Filter (supports dropdown page selection, custom paths, subpaths, trailing slashes, and wildcards)
    const isTargetingAllowed = React.useMemo(() => {
        const effectiveShowOn = showOn || "Every page"
        if (effectiveShowOn === "Every page") return true

        const normPath = (p: string) => {
            let s = (p || "").trim().toLowerCase()
            if (s === "home page") return ""
            while (s.startsWith("/")) s = s.substring(1)
            while (s.endsWith("/")) s = s.slice(0, -1)
            return s
        }

        // On Canvas Studio
        if (isCanvas) {
            if (!canvasPagePath) return true
            const canvasNorm = normPath(canvasPagePath)
            if (effectiveShowOn === "Home page") {
                return canvasNorm === "" || canvasNorm === "index" || canvasNorm === "home"
            }
            if (effectiveShowOn !== "custom") {
                return canvasNorm === normPath(effectiveShowOn)
            }
            if (!targetingRules) return true
            const curPath = (canvasPagePath.startsWith("/") ? canvasPagePath : "/" + canvasPagePath).toLowerCase().trim()
            try {
                const rawRules = String(targetingRules)
                    .split(",")
                    .flatMap((part: string) => part.split(String.fromCharCode(10)))
                    .flatMap((part: string) => part.split(";"))
                const rules = rawRules.map((r: string) => r.trim().toLowerCase()).filter(Boolean)
                if (rules.length === 0) return true
                const isMatch = rules.some((ruleInput: string) => {
                    let rule = ruleInput
                    if (rule === "*" || rule === "/*") return true
                    if (rule.includes("://") || rule.includes(".")) {
                        try {
                            const parsed = new URL(rule.includes("://") ? rule : "https://" + rule)
                            rule = parsed.pathname
                        } catch {}
                    }
                    const cleanRule = rule.startsWith("/") ? rule : "/" + rule
                    const isHomeRule = cleanRule === "/" || cleanRule === "/home" || cleanRule === "/index"
                    const isHomePath = curPath === "/" || curPath === "" || curPath === "/home" || curPath === "/index"
                    if (isHomeRule && isHomePath) return true
                    if (cleanRule.endsWith("/*")) {
                        const prefix = cleanRule.slice(0, -2)
                        return curPath === prefix || curPath === prefix + "/" || curPath.startsWith(prefix + "/")
                    }
                    if (cleanRule.endsWith("*")) {
                        const prefix = cleanRule.slice(0, -1)
                        return curPath.startsWith(prefix)
                    }
                    let ruleNoSlash = cleanRule
                    while (ruleNoSlash.endsWith("/")) ruleNoSlash = ruleNoSlash.slice(0, -1)
                    let pathNoSlash = curPath
                    while (pathNoSlash.endsWith("/")) pathNoSlash = pathNoSlash.slice(0, -1)
                    return curPath === cleanRule || pathNoSlash === ruleNoSlash
                })
                return targetingMode === "hide" ? !isMatch : isMatch
            } catch {
                return true
            }
        }

        // Live published site or preview mode
        const curPath = (currentLocationPath || "/").toLowerCase().trim()
        const currentNorm = normPath(curPath)

        if (effectiveShowOn === "Home page") {
            return currentNorm === "" || currentNorm === "index" || currentNorm === "index.html" || currentNorm === "home"
        }
        if (effectiveShowOn !== "custom") {
            const targetNorm = normPath(effectiveShowOn)
            return currentNorm === targetNorm
        }

        // Custom URL rules & wildcards
        if (!targetingRules) return true
        try {
            const curHref = (typeof window !== "undefined" && window.location && window.location.href ? window.location.href : "").toLowerCase()
            const rawRules = String(targetingRules)
                .split(",")
                .flatMap((part: string) => part.split(String.fromCharCode(10)))
                .flatMap((part: string) => part.split(";"))
            const rules = rawRules.map((r: string) => r.trim().toLowerCase()).filter(Boolean)
            if (rules.length === 0) return true

            const isMatch = rules.some((ruleInput: string) => {
                let rule = ruleInput
                if (rule === "*" || rule === "/*") return true

                // Full URL match if protocol or host provided
                if (rule.includes("://") || rule.includes(".")) {
                    if (curHref === rule || curHref === rule + "/") return true
                    if (rule.endsWith("*") && curHref.startsWith(rule.slice(0, -1))) return true
                    try {
                        const parsed = new URL(rule.includes("://") ? rule : "https://" + rule)
                        rule = parsed.pathname
                    } catch {}
                }

                const cleanRule = rule.startsWith("/") ? rule : "/" + rule

                const isHomeRule = cleanRule === "/" || cleanRule === "/home" || cleanRule === "/index"
                const isHomePath = curPath === "/" || curPath === "" || curPath === "/home" || curPath === "/index"
                if (isHomeRule && isHomePath) return true

                if (cleanRule.endsWith("/*")) {
                    const prefix = cleanRule.slice(0, -2)
                    return curPath === prefix || curPath === prefix + "/" || curPath.startsWith(prefix + "/")
                }
                if (cleanRule.endsWith("*")) {
                    const prefix = cleanRule.slice(0, -1)
                    return curPath.startsWith(prefix)
                }

                let ruleNoSlash = cleanRule
                while (ruleNoSlash.endsWith("/")) ruleNoSlash = ruleNoSlash.slice(0, -1)
                let pathNoSlash = curPath
                while (pathNoSlash.endsWith("/")) pathNoSlash = pathNoSlash.slice(0, -1)
                return curPath === cleanRule || pathNoSlash === ruleNoSlash
            })

            return targetingMode === "hide" ? !isMatch : isMatch
        } catch {
            return true
        }
    }, [isCanvas, showOn, canvasPagePath, targetingRules, targetingMode, currentLocationPath])

    // Strict visibility guard: if hidden by targeting or operating schedule, widget returns null & suppresses sound
    const isWidgetHidden = !isTargetingAllowed || (!isCanvas && scheduleEnabled && isOffline && scheduleOfflineAction === "hide")

    // View tracking for live site visitors (deduplicated per page load across responsive breakpoint instances)
    React.useEffect(() => {
        if (isCanvas || !enableAnalytics || isWidgetHidden) return
        try {
            const pagePath = typeof window !== "undefined" && window.location && window.location.pathname ? window.location.pathname : "/"
            const pageKey = (currentLocationPath || pagePath || "/").toLowerCase()
            const w = window as any
            w.__cb_view_stamps__ = w.__cb_view_stamps__ || {}
            const now = Date.now()
            // Deduplicate across responsive breakpoint instances (allow 1 view per page path within 3 seconds)
            if (!w.__cb_view_stamps__[pageKey] || now - w.__cb_view_stamps__[pageKey] > 3000) {
                w.__cb_view_stamps__[pageKey] = now
                if (Array.isArray(w.dataLayer)) {
                    w.dataLayer.push({ event: "chat_bubbles_view", event_category: "Chat Bubbles" })
                }
                if (typeof w.gtag === "function") {
                    w.gtag("event", "chat_bubbles_view", { event_category: "Chat Bubbles", event_label: "widget_view" })
                }
            }
        } catch {}
    }, [isCanvas, enableAnalytics, isWidgetHidden, currentLocationPath])

    // Web Audio Synthesizer chime for notifications (never plays on Canvas design preview or when hidden or locked)
    const playNotificationChime = React.useCallback((force: boolean = false) => {
        if (isCanvas || !enableSound || isWidgetHidden || IS_LOCKED) return
        playNotificationChimeDirect(force)
    }, [isCanvas, enableSound, isWidgetHidden, IS_LOCKED])

    // Unlock audio on real user gesture (click/tap/scroll/key) and immediately flush pending chime
    React.useEffect(() => {
        if (isCanvas || isWidgetHidden || !enableSound) return

        function handleUserInteraction() {
            if (isCanvas || isWidgetHidden || !enableSound) return
            const ctx = getSharedAudioContext()
            if (ctx) {
                unlockSharedAudioContext(ctx)
            }
            flushPendingChimeIfQueued()
        }

        const gestureEvents = ["pointerdown", "mousedown", "touchstart", "click", "keydown", "scroll", "wheel"]
        gestureEvents.forEach((evt) => {
            window.addEventListener(evt, handleUserInteraction, { passive: true, capture: true })
        })

        return () => {
            gestureEvents.forEach((evt) => {
                window.removeEventListener(evt, handleUserInteraction, { capture: true })
            })
        }
    }, [isCanvas, isWidgetHidden, enableSound])

    // 3. Scroll Depth Trigger State (checks if configured Depth % is already within the visible screen viewpoint)
    const [scrollPassed, setScrollPassed] = React.useState(() => {
        if (isCanvas || !scrollTriggerEnabled) return true
        if (typeof window === "undefined") return false
        try {
            const clientHeight = window.innerHeight || (document.documentElement ? document.documentElement.clientHeight : 0)
            const scrollHeight = Math.max(
                document.documentElement ? document.documentElement.scrollHeight : 0,
                document.body ? document.body.scrollHeight : 0,
                clientHeight
            )
            if (scrollHeight <= 0) return true
            const scrollTop = window.scrollY || window.pageYOffset || (document.documentElement ? document.documentElement.scrollTop : 0) || 0
            const visibleScreenDepth = ((scrollTop + clientHeight) / scrollHeight) * 100
            return visibleScreenDepth >= scrollTriggerPercent
        } catch {
            return false
        }
    })

    React.useEffect(() => {
        if (isCanvas || !scrollTriggerEnabled || isWidgetHidden) {
            setScrollPassed(true)
            return
        }
        function checkScroll(e?: Event) {
            try {
                let targetEl: HTMLElement | null = null
                if (e && e.target && e.target !== document && (e.target as HTMLElement).scrollHeight) {
                    targetEl = e.target as HTMLElement
                }
                const scrollTop = targetEl
                    ? targetEl.scrollTop
                    : (window.scrollY || window.pageYOffset || (document.documentElement ? document.documentElement.scrollTop : 0) || (document.scrollingElement ? (document.scrollingElement as HTMLElement).scrollTop : 0) || (document.body ? document.body.scrollTop : 0))
                const scrollHeight = targetEl
                    ? targetEl.scrollHeight
                    : Math.max(
                        document.documentElement ? document.documentElement.scrollHeight : 0,
                        document.body ? document.body.scrollHeight : 0,
                        document.scrollingElement ? (document.scrollingElement as HTMLElement).scrollHeight : 0
                    )
                const clientHeight = targetEl
                    ? targetEl.clientHeight
                    : (window.innerHeight || (document.documentElement ? document.documentElement.clientHeight : 0))
                const docHeight = scrollHeight - clientHeight
                if (docHeight <= 50) {
                    setScrollPassed(true)
                    return
                }
                // Visible screen depth: percentage of total document that has entered the visible viewpoint
                const visibleScreenDepth = scrollHeight > 0 ? ((scrollTop + clientHeight) / scrollHeight) * 100 : 100
                // Scroll travel: percentage of the scrollable track that has been scrolled
                const scrollTravel = docHeight > 0 ? (scrollTop / docHeight) * 100 : 100
                const currentDepth = Math.max(visibleScreenDepth, scrollTravel)

                if (currentDepth >= scrollTriggerPercent) {
                    setScrollPassed(true)
                }
            } catch {}
        }
        window.addEventListener("scroll", checkScroll, { passive: true, capture: true })
        window.addEventListener("resize", checkScroll, { passive: true })
        checkScroll()

        const frameId = requestAnimationFrame(() => checkScroll())

        return () => {
            cancelAnimationFrame(frameId)
            window.removeEventListener("scroll", checkScroll, { capture: true })
            window.removeEventListener("resize", checkScroll)
        }
    }, [isCanvas, scrollTriggerEnabled, scrollTriggerPercent, isWidgetHidden])

    // 4. Greeting Bubble Visibility (syncs with greetingDelay, sound, and scrollTrigger)
    const [greetingVisible, setGreetingVisible] = React.useState(isCanvas ? greetingEnabled : false)

    React.useEffect(() => {
        if (isCanvas) {
            setGreetingVisible(greetingEnabled)
            return
        }
        if (isWidgetHidden || !greetingEnabled || greetingDismissed) {
            setGreetingVisible(false)
            return
        }

        if (scrollTriggerEnabled && scrollTriggerTarget === "greeting") {
            if (scrollPassed) {
                setGreetingVisible(true)
                if (enableSound && !isWidgetHidden) playNotificationChime()
            }
            return
        }

        const timer = setTimeout(() => {
            if (!isWidgetHidden && !greetingDismissed) {
                setGreetingVisible(true)
                if (enableSound && !isWidgetHidden) playNotificationChime()
            }
        }, finalGreetingDelay)
        return () => clearTimeout(timer)
    }, [isCanvas, isWidgetHidden, greetingEnabled, greetingDismissed, scrollTriggerEnabled, scrollTriggerTarget, scrollPassed, finalGreetingDelay, enableSound, playNotificationChime])

    // 5. Desktop Exit-Intent Trigger (fires when cursor moves towards browser tabs / address bar)
    const exitIntentFiredRef = React.useRef(false)
    React.useEffect(() => {
        if (isCanvas || !exitIntentEnabled || isWidgetHidden) return

        function triggerExitIntent() {
            if (exitIntentFiredRef.current || isWidgetHidden) return
            exitIntentFiredRef.current = true
            if (exitIntentAction === "modal") {
                setIsOpen(true)
            } else if (exitIntentAction === "greeting") {
                setGreetingVisible(true)
                if (enableSound && !isWidgetHidden) playNotificationChime()
            }
        }

        // 1. Mouse leaving html document root towards browser chrome (tabs / address bar)
        function handleHtmlMouseLeave(e: MouseEvent) {
            if (e.clientY <= 30 || !e.relatedTarget) {
                triggerExitIntent()
            }
        }

        // 2. Window mouseout when leaving viewport into browser chrome
        function handleWindowMouseOut(e: MouseEvent) {
            const from = e.relatedTarget || (e as any).toElement
            if (!from && (e.clientY <= 40 || e.clientY <= 0)) {
                triggerExitIntent()
            }
        }

        // 3. Fast upward flick towards top boundary (tabs / close button)
        function handleWindowMouseMove(e: MouseEvent) {
            if (e.clientY <= 20) {
                triggerExitIntent()
            }
        }

        document.documentElement.addEventListener("mouseleave", handleHtmlMouseLeave)
        window.addEventListener("mouseout", handleWindowMouseOut)
        window.addEventListener("mousemove", handleWindowMouseMove, { passive: true })

        return () => {
            document.documentElement.removeEventListener("mouseleave", handleHtmlMouseLeave)
            window.removeEventListener("mouseout", handleWindowMouseOut)
            window.removeEventListener("mousemove", handleWindowMouseMove)
        }
    }, [isCanvas, exitIntentEnabled, exitIntentAction, enableSound, playNotificationChime, isWidgetHidden])

    // 6. Behavioral Auto-Open
    React.useEffect(() => {
        if (!isCanvas && !isWidgetHidden && autoOpen) {
            const timer = setTimeout(() => {
                if (!isWidgetHidden) setIsOpen(true)
            }, finalAutoOpenDelay)
            return () => clearTimeout(timer)
        }
    }, [isCanvas, isWidgetHidden, autoOpen, finalAutoOpenDelay])

    React.useEffect(() => {
        if (!isOpen) return
        if (isCanvas) return
        function handleKeyDown(e: KeyboardEvent) {
            if (closeOnEscape && e.key === "Escape") {
                setIsOpen(false)
                setSelectedAgent(null)
                setNavDirection("forward")
            }
        }
        function handleClickOutside(e: MouseEvent) {
            if (!containerRef.current) return
            const path = typeof e.composedPath === "function" ? e.composedPath() : []
            if (path.length > 0) {
                if (path.includes(containerRef.current)) return
            } else {
                const target = e.target as Node | null
                if (target && (containerRef.current.contains(target) || !document.contains(target))) return
            }
            if (closeOnOutsideClick) {
                setIsOpen(false)
                setSelectedAgent(null)
                setNavDirection("forward")
            }
        }

        const timer = setTimeout(() => {
            window.addEventListener("click", handleClickOutside)
        }, 0)
        window.addEventListener("keydown", handleKeyDown)

        return () => {
            clearTimeout(timer)
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("click", handleClickOutside)
        }
    }, [isOpen, closeOnEscape, closeOnOutsideClick])

    const rawAgents = React.useMemo(() => {
        if (typeof agentsData === "string" && agentsData.trim()) {
            try {
                const parsed = JSON.parse(agentsData)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            } catch {}
        }
        return ${defaultAgentsJson}
    }, [agentsData])

    // Synchronize canvas preview state in Framer design canvas mode
    React.useEffect(() => {
        if (isCanvas) {
            setIsOpen(canvasPreview !== "closed")
            if (canvasPreview === "chat" && rawAgents.length > 0) {
                setNavDirection("forward")
                setSelectedAgent(rawAgents[0])
            } else if (canvasPreview !== "chat") {
                setNavDirection("backward")
                setSelectedAgent(null)
            }
        }
    }, [isCanvas, canvasPreview, rawAgents])

    const channels = React.useMemo(() => {
        const list: Array<{ id: string; label: string; url: string; color: string; value: string; message: string }> = []
        if (whatsapp && whatsapp.trim()) {
            const clean = whatsapp.replace(/[^0-9]/g, "")
            const msg = whatsappMessage ? "?text=" + encodeURIComponent(whatsappMessage) : ""
            list.push({ id: "whatsapp", label: "WhatsApp", url: "https://wa.me/" + clean + msg, color: "#25D366", value: whatsapp, message: whatsappMessage })
        }
        if (messenger && messenger.trim()) {
            const handle = messenger.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
            list.push({ id: "messenger", label: "Messenger", url: "https://m.me/" + handle, color: "#0084FF", value: messenger, message: "" })
        }
        if (telegram && telegram.trim()) {
            const handle = telegram.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
            const msg = telegramMessage ? "?text=" + encodeURIComponent(telegramMessage) : ""
            list.push({ id: "telegram", label: "Telegram", url: "https://t.me/" + handle + msg, color: "#229ED9", value: telegram, message: telegramMessage })
        }
        if (instagram && instagram.trim()) {
            const handle = instagram.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
            list.push({ id: "instagram", label: "Instagram", url: "https://instagram.com/" + handle, color: "#E1306C", value: instagram, message: "" })
        }
        if (tiktok && tiktok.trim()) {
            const handle = tiktok.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
            list.push({ id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@" + handle, color: "#111111", value: tiktok, message: "" })
        }
        if (wechat && wechat.trim()) {
            const url = (wechat.startsWith("http://") || wechat.startsWith("https://")) ? wechat : "https://u.wechat.com/" + wechat.replace(/[^a-zA-Z0-9._-]/g, "")
            list.push({ id: "wechat", label: "WeChat", url, color: "#07C160", value: wechat, message: "" })
        }
        if (viber && viber.trim()) {
            const clean = viber.replace(/[^0-9+]/g, "")
            list.push({ id: "viber", label: "Viber", url: "viber://chat?number=" + encodeURIComponent(clean), color: "#7360F2", value: viber, message: "" })
        }
        if (line && line.trim()) {
            const handle = line.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
            list.push({ id: "line", label: "LINE", url: "https://line.me/R/ti/p/~" + handle, color: "#06C755", value: line, message: "" })
        }
        if (signal && signal.trim()) {
            const url = (signal.startsWith("http://") || signal.startsWith("https://")) ? signal : "https://signal.me/#p/" + encodeURIComponent(signal)
            list.push({ id: "signal", label: "Signal", url, color: "#3A76F0", value: signal, message: "" })
        }
        if (phone && phone.trim()) {
            list.push({ id: "phone", label: "Phone", url: "tel:" + phone.replace(/[^0-9+]/g, ""), color: "#111827", value: phone, message: "" })
        }
        if (sms && sms.trim()) {
            const clean = sms.replace(/[^0-9+]/g, "")
            const msg = smsMessage ? "?body=" + encodeURIComponent(smsMessage) : ""
            list.push({ id: "sms", label: "SMS", url: "sms:" + clean + msg, color: "#10B981", value: sms, message: smsMessage })
        }
        if (email && email.trim()) {
            const cleanEmail = email.replace(/[^a-zA-Z0-9._%+\-@]/g, "")
            const emailParams: string[] = []
            if (emailSubject && emailSubject.trim()) emailParams.push("subject=" + encodeURIComponent(emailSubject.trim()))
            if (emailMessage && emailMessage.trim()) emailParams.push("body=" + encodeURIComponent(emailMessage.trim()))
            const emailQuery = emailParams.length > 0 ? "?" + emailParams.join("&") : ""
            list.push({
                id: "email",
                label: "Email",
                url: cleanEmail ? "mailto:" + cleanEmail + emailQuery : "mailto:",
                color: "#EA4335",
                value: email,
                message: emailMessage || "",
                emailSubject: emailSubject || ""
            })
        }
        if (discord && discord.trim()) {
            const url = (discord.startsWith("http://") || discord.startsWith("https://")) ? discord : "https://discord.gg/" + discord.replace(/[^a-zA-Z0-9._-]/g, "")
            list.push({ id: "discord", label: "Discord", url, color: "#5865F2", value: discord, message: "" })
        }
        if (slack && slack.trim()) {
            const url = (slack.startsWith("http://") || slack.startsWith("https://")) ? slack : "https://" + slack
            list.push({ id: "slack", label: "Slack", url, color: "#4A154B", value: slack, message: "" })
        }
        if (teams && teams.trim()) {
            const url = (teams.startsWith("http://") || teams.startsWith("https://")) ? teams : "https://teams.microsoft.com/l/chat/0/0?users=" + encodeURIComponent(teams)
            list.push({ id: "teams", label: "Microsoft Teams", url, color: "#6264A7", value: teams, message: "" })
        }
        if (x && x.trim()) {
            const handle = x.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
            list.push({ id: "x", label: "X (Twitter)", url: "https://x.com/" + handle, color: "#000000", value: x, message: "" })
        }
        if (linkedin && linkedin.trim()) {
            const clean = linkedin.replace(/^@/, "").trim()
            const url = (clean.startsWith("http://") || clean.startsWith("https://"))
                ? clean
                : (clean.startsWith("in/") || clean.startsWith("company/"))
                ? "https://www.linkedin.com/" + clean
                : "https://www.linkedin.com/in/" + encodeURIComponent(clean)
            list.push({ id: "linkedin", label: "LinkedIn", url, color: "#0A66C2", value: linkedin, message: "" })
        }
        if (maps && maps.trim()) {
            const url = (maps.startsWith("http://") || maps.startsWith("https://")) ? maps : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(maps)
            list.push({ id: "maps", label: "Google Maps", url, color: "#EA4335", value: maps, message: "" })
        }
        if (custom && custom.trim()) {
            list.push({ id: "custom", label: (customLabel && customLabel.trim()) || "Custom", url: custom, color: "#111827", value: custom, message: "" })
        }
        if (list.length === 0) {
            list.push({ id: "whatsapp", label: "WhatsApp", url: "https://wa.me/", color: "#25D366", value: "", message: "Hello!" })
        }
        return list
    }, [whatsapp, whatsappMessage, messenger, telegram, telegramMessage, instagram, tiktok, wechat, viber, line, signal, phone, sms, smsMessage, email, emailSubject, emailMessage, discord, slack, teams, x, linkedin, maps, custom, customLabel])

    const agents = React.useMemo(() => {
        return rawAgents.map((ag: any) => {
            const ch = channels.find((c) => c.id === ag.channelId) || channels[0]
            const rawAv = ag.avatar || ""
            const safeAvatar = (rawAv.startsWith("http://") || rawAv.startsWith("https://") || rawAv.startsWith("data:image/"))
                ? rawAv
                : ${JSON.stringify(SVG_AVATAR_PRESETS[0])}
            const rawVal = ag.value || (ch ? ch.value : "")
            const rawMsg = ag.message || (ch ? ch.message : "")
            let directUrl = ch ? ch.url : "https://wa.me/"
            if (ag.channelId === "whatsapp") {
                const clean = rawVal.replace(/[^0-9]/g, "")
                directUrl = clean ? "https://wa.me/" + clean + (rawMsg ? "?text=" + encodeURIComponent(rawMsg) : "") : "https://wa.me/"
            } else if (ag.channelId === "telegram") {
                const handle = rawVal.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
                directUrl = handle ? "https://t.me/" + handle + (rawMsg ? "?text=" + encodeURIComponent(rawMsg) : "") : "https://t.me/"
            } else if (ag.channelId === "messenger") {
                const handle = rawVal.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
                directUrl = handle ? "https://m.me/" + handle : "https://m.me/"
            } else if (ag.channelId === "instagram") {
                const handle = rawVal.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
                directUrl = handle ? "https://instagram.com/" + handle : "https://instagram.com/"
            } else if (ag.channelId === "tiktok") {
                const handle = rawVal.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
                directUrl = handle ? "https://www.tiktok.com/@" + handle : "https://www.tiktok.com/"
            } else if (ag.channelId === "wechat") {
                directUrl = (rawVal.startsWith("http://") || rawVal.startsWith("https://")) ? rawVal : "https://u.wechat.com/" + rawVal.replace(/[^a-zA-Z0-9._-]/g, "")
            } else if (ag.channelId === "viber") {
                directUrl = "viber://chat?number=" + encodeURIComponent(rawVal.replace(/[^0-9+]/g, ""))
            } else if (ag.channelId === "line") {
                directUrl = "https://line.me/R/ti/p/~" + rawVal.replace(/^@/, "")
            } else if (ag.channelId === "signal") {
                directUrl = (rawVal.startsWith("http://") || rawVal.startsWith("https://")) ? rawVal : "https://signal.me/#p/" + encodeURIComponent(rawVal)
            } else if (ag.channelId === "phone") {
                directUrl = "tel:" + rawVal.replace(/[^0-9+]/g, "")
            } else if (ag.channelId === "sms") {
                const cleanDigits = rawVal.replace(/[^0-9+]/g, "")
                directUrl = cleanDigits ? "sms:" + cleanDigits + (rawMsg ? "?body=" + encodeURIComponent(rawMsg) : "") : "sms:"
            } else if (ag.channelId === "email") {
                directUrl = "mailto:" + rawVal.replace(/[^a-zA-Z0-9._%+\-@]/g, "") + (rawMsg ? "?body=" + encodeURIComponent(rawMsg) : "")
            } else if (ag.channelId === "discord") {
                directUrl = (rawVal.startsWith("http://") || rawVal.startsWith("https://")) ? rawVal : "https://discord.gg/" + rawVal.replace(/[^a-zA-Z0-9._-]/g, "")
            } else if (ag.channelId === "slack") {
                directUrl = (rawVal.startsWith("http://") || rawVal.startsWith("https://")) ? rawVal : "https://" + rawVal
            } else if (ag.channelId === "teams") {
                directUrl = (rawVal.startsWith("http://") || rawVal.startsWith("https://")) ? rawVal : "https://teams.microsoft.com/l/chat/0/0?users=" + encodeURIComponent(rawVal)
            } else if (ag.channelId === "x") {
                directUrl = (rawVal.startsWith("http://") || rawVal.startsWith("https://")) ? rawVal : "https://x.com/" + rawVal.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
            } else if (ag.channelId === "linkedin") {
                const clean = rawVal.replace(/^@/, "").trim()
                directUrl = (clean.startsWith("http://") || clean.startsWith("https://"))
                    ? clean
                    : (clean.startsWith("in/") || clean.startsWith("company/"))
                    ? "https://www.linkedin.com/" + clean
                    : "https://www.linkedin.com/in/" + encodeURIComponent(clean)
            } else if (ag.channelId === "maps") {
                directUrl = (rawVal.startsWith("http://") || rawVal.startsWith("https://")) ? rawVal : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(rawVal)
            } else if (ag.channelId === "custom") {
                directUrl = (rawVal && !rawVal.trim().toLowerCase().startsWith("javascript:") && !rawVal.trim().toLowerCase().startsWith("data:")) ? rawVal : "#"
            }
            return {
                ...ag,
                avatar: safeAvatar,
                color: ch ? ch.color : "#25D366",
                url: directUrl,
                value: rawVal,
                message: rawMsg,
                channelLabel: ch ? ch.label : "WhatsApp",
            }
        })
    }, [rawAgents, channels])

    const isPill = buttonShape === "pill"
    const isRounded = buttonShape === "rounded"
    const radius = isPill ? "999px" : isRounded ? "16px" : "50%"
    const hasPillLabel = isPill && Boolean(launcherText && launcherText.trim())
    const btnWidth = isPill ? (hasPillLabel ? "auto" : 84) : 58
    const btnHeight = 58
    const isBottom = position.startsWith("bottom")
    const isRight = position.endsWith("right")
    const safeModalGradient = sanitizeGradient(modalCustomGradient)
    const headerGradient = modalTheme === "custom" && safeModalGradient
        ? safeModalGradient
        : (GRADIENTS[modalTheme] || GRADIENTS.whatsapp)

    const btnAnimation = animation === "bounce"
        ? "cfBounce 1.6s ease infinite"
        : animation === "pulse"
        ? "cfPulse 2s ease infinite"
        : animation === "pop"
        ? "cfPopIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both"
        : animation === "slide"
        ? "cfSlideUp 0.35s ease both"
        : "none"

    const isLauncherHiddenByScroll = !isCanvas && scrollTriggerEnabled && scrollTriggerTarget === "launcher" && !scrollPassed

    const containerStyle: React.CSSProperties = {
        ...style,
        width: btnWidth,
        height: btnHeight,
        position: "relative",
        overflow: "visible",
        display: "inline-flex",
        alignItems: isBottom ? "flex-end" : "flex-start",
        justifyContent: isRight ? "flex-end" : "flex-start",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        boxSizing: "border-box",
        opacity: isLauncherHiddenByScroll ? 0 : 1,
        pointerEvents: isLauncherHiddenByScroll ? "none" : "auto",
        transform: isLauncherHiddenByScroll ? "scale(0.8) translateY(12px)" : "scale(1) translateY(0)",
        transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
    }

    const mainBtnStyle: React.CSSProperties = {
        width: btnWidth,
        minWidth: isPill ? (hasPillLabel ? 92 : 84) : 58,
        height: btnHeight,
        borderRadius: radius,
        backgroundColor: buttonColor,
        color: "#ffffff",
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: hasPillLabel ? "0 18px" : 0,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)",
        position: "relative",
        flexShrink: 0,
        zIndex: 50,
        outline: "none",
        animation: isOpen ? "none" : btnAnimation,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 14,
        fontWeight: 600,
    }

    const launcherWatermarkWrapStyle: React.CSSProperties = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        userSelect: "none",
        width: btnWidth,
        height: btnHeight,
    }

    const modalStyle: React.CSSProperties = {
        position: "absolute",
        bottom: isBottom ? 70 : "auto",
        top: !isBottom ? 70 : "auto",
        right: isRight ? 0 : "auto",
        left: !isRight ? 0 : "auto",
        width: 350,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 120px)",
        backgroundColor: "#ffffff",
        borderRadius: 24,
        boxShadow: "0 24px 60px rgba(0,0,0,0.22), 0 8px 20px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        animation: "cfFadeIn .22s ease both",
    }

    const headerWrapStyle: React.CSSProperties = {
        background: headerGradient,
    }
    const greetingPosStyle: React.CSSProperties = {
        bottom: isBottom ? 70 : "auto",
        top: !isBottom ? 70 : "auto",
        right: isRight ? 0 : "auto",
        left: !isRight ? 0 : "auto",
    }
    const buttonsContainerStyle: React.CSSProperties = {
        bottom: isBottom ? 68 : "auto",
        top: !isBottom ? 68 : "auto",
        right: isRight ? 0 : "auto",
        left: !isRight ? 0 : "auto",
        gap: 10,
        ...(layout === "grid"
            ? {
                  display: "grid",
                  gridTemplateColumns: "repeat(2, auto)",
                  alignItems: "center",
              }
            : layout === "horizontal"
            ? {
                  display: "flex",
                  flexDirection: isRight ? "row-reverse" : "row",
                  alignItems: "center",
              }
            : {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isRight ? "flex-end" : "flex-start",
              }),
    }

    // Pro licensing & lock state
    const isLocked = IS_LOCKED

    const lockedBlurContentStyle: React.CSSProperties = {
        filter: "blur(6px)",
        WebkitFilter: "blur(6px)",
        opacity: 0.45,
        pointerEvents: "none",
        userSelect: "none",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "filter 0.3s ease, opacity 0.3s ease",
    }
    const modalInnerContentStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        ...(isLocked ? lockedBlurContentStyle : undefined),
    }
    const buttonsContainerWithLockStyle: React.CSSProperties = {
        ...buttonsContainerStyle,
        ...(isLocked
            ? {
                  filter: "blur(6px)",
                  WebkitFilter: "blur(6px)",
                  opacity: 0.45,
                  pointerEvents: "none",
                  userSelect: "none",
              }
            : undefined),
    }
    const proLockedModalOverlayStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        borderRadius: 24,
        background: "rgba(10, 10, 12, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        color: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        userSelect: "none",
        boxSizing: "border-box",
    }
    const proLockedButtonsOverlayStyle: React.CSSProperties = {
        position: "absolute",
        bottom: isBottom ? 68 : "auto",
        top: !isBottom ? 68 : "auto",
        right: isRight ? 0 : "auto",
        left: !isRight ? 0 : "auto",
        zIndex: 100,
        minWidth: 200,
        minHeight: 120,
        borderRadius: 16,
        background: "rgba(10, 10, 12, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        textAlign: "center",
        color: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        userSelect: "none",
        boxSizing: "border-box",
    }
    const proLockedIconWrapStyle: React.CSSProperties = {
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "50%",
        width: 48,
        height: 48,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
    }
    const proLockedTitleStyle: React.CSSProperties = {
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 6,
        color: "#ffffff",
    }
    const proLockedDescStyle: React.CSSProperties = {
        fontSize: 12,
        opacity: 0.85,
        maxWidth: 260,
        lineHeight: 1.5,
        color: "#94a3b8",
    }

    if (isWidgetHidden) return null

    if (isLocked) {
        return (
            <div
                className="cf-canvas-pro-locked-container"
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: 140,
                    borderRadius: 16,
                    background: "rgba(10, 10, 12, 0.8)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px dashed rgba(255, 255, 255, 0.25)",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px 20px",
                    textAlign: "center",
                    color: "#ffffff",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    userSelect: "none",
                }}
            >
                <div
                    style={{
                        background: "rgba(255, 255, 255, 0.12)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "50%",
                        width: 48,
                        height: 48,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 12,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        flexShrink: 0,
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#708AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", letterSpacing: "0.2px", marginBottom: 6 }}>
                    PRO Feature Locked
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, color: "#94a3b8", lineHeight: 1.5, maxWidth: 280 }}>
                    Upgrade to the PRO plan in the Chat Bubbles plugin to activate this widget.
                </div>
            </div>
        )
    }

    // Duplicate component blocker: renders warning and disables chat interaction if cloned or duplicated
    const duplicateBoxStyle: React.CSSProperties = {
        width: "100%",
        minHeight: 140,
        borderRadius: 16,
        border: "2px dashed #EF4444",
        background: "rgba(239, 68, 68, 0.08)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: "#ffffff",
        userSelect: "none",
    }
    const duplicateIconStyle: React.CSSProperties = {
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: "rgba(239, 68, 68, 0.2)",
        border: "1px solid rgba(239, 68, 68, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        color: "#EF4444",
    }
    const duplicateTitleStyle: React.CSSProperties = {
        fontSize: 14,
        fontWeight: 700,
        color: "#EF4444",
        marginBottom: 6,
    }
    const duplicateDescStyle: React.CSSProperties = {
        fontSize: 12,
        opacity: 0.85,
        maxWidth: 260,
        lineHeight: 1.45,
        color: "#94a3b8",
    }

    if (isDuplicate) {
        if (!isCanvas) {
            return null
        }
        return (
            <div
                className="framefic-duplicate-limit-container"
                style={duplicateBoxStyle}
            >
                <div style={duplicateIconStyle}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                </div>
                <div style={duplicateTitleStyle}>
                    Duplicate Component Detected
                </div>
                <div style={duplicateDescStyle}>
                    Chat Bubbles cannot be copied or duplicated via Ctrl+C / Ctrl+V or Alt+Drag within the same layout. Only 1 floating widget instance is supported per breakpoint.
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            draggable={false}
            onDragStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
            onCopy={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
        >
            <style>{\`
              @keyframes cfFadeIn { from { opacity: 0; transform: translateY(10px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
              @keyframes cfPopIn { 0% { transform: scale(0.7); opacity: 0; } 70% { transform: scale(1.06); } 100% { transform: scale(1); opacity: 1; } }
              @keyframes cfBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
              @keyframes cfPulse { 0%, 100% { transform: scale(1); box-shadow: 0 12px 30px rgba(0,0,0,0.25); } 50% { transform: scale(1.05); box-shadow: 0 16px 36px rgba(0,0,0,0.35); } }
              @keyframes cfSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
              @keyframes cfSlideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
              @keyframes cfSlideInLeft { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
              @keyframes cfFadeScale { from { opacity: 0; transform: scale(0.75); } to { opacity: 1; transform: scale(1); } }

              .cf-view-slide-forward {
                animation: cfSlideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) both !important;
                will-change: transform, opacity !important;
              }
              .cf-view-slide-backward {
                animation: cfSlideInLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) both !important;
                will-change: transform, opacity !important;
              }
              button.cf-header-btn.cf-header-back-btn {
                animation: cfFadeScale 0.22s cubic-bezier(0.16, 1, 0.3, 1) both !important;
              }
              button.cf-header-btn.cf-header-close-btn {
                margin-left: auto !important;
              }

              a.cf-channel-btn, .cf-channel-btn, a.cf-channel-btn:link, a.cf-channel-btn:visited, a.cf-channel-btn:hover, a.cf-channel-btn:active {
                width: 44px !important;
                height: 44px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                overflow: hidden !important;
                color: #ffffff !important;
                text-decoration: none !important;
              }
              a.cf-channel-btn svg, .cf-channel-btn svg, .cf-canvas-icon-inner svg {
                width: 22px !important;
                height: 22px !important;
                max-width: 22px !important;
                max-height: 22px !important;
                min-width: 22px !important;
                min-height: 22px !important;
                display: block !important;
                margin: auto !important;
                fill: #ffffff !important;
                color: #ffffff !important;
              }
              a.cf-channel-btn svg path, .cf-channel-btn svg path, .cf-canvas-icon-inner svg path {
                fill: #ffffff !important;
              }
              button.cf-main-btn svg {
                width: 24px !important;
                height: 24px !important;
                max-width: 24px !important;
                max-height: 24px !important;
                display: block !important;
                margin: auto !important;
              }

              button.cf-header-btn {
                width: 28px !important;
                height: 28px !important;
                min-width: 28px !important;
                min-height: 28px !important;
                border-radius: 50% !important;
                background: rgba(255, 255, 255, 0.22) !important;
                border: none !important;
                color: #ffffff !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                margin: 0 !important;
                line-height: 0 !important;
                box-sizing: border-box !important;
                transition: background 0.15s ease !important;
              }
              button.cf-header-btn:hover {
                background: rgba(255, 255, 255, 0.35) !important;
              }
              button.cf-header-btn svg {
                width: 11px !important;
                height: 11px !important;
                max-width: 11px !important;
                max-height: 11px !important;
                min-width: 11px !important;
                min-height: 11px !important;
                display: block !important;
                margin: 0 !important;
              }

              .cf-icon-rotator {
                width: 24px !important;
                height: 24px !important;
                display: grid !important;
                place-items: center !important;
                transition: transform 0.25s ease !important;
                flex-shrink: 0 !important;
              }
              .cf-icon-rotator.is-open {
                transform: rotate(45deg) !important;
              }
              .cf-pill-text {
                font-size: 14px !important;
                font-weight: 600 !important;
                white-space: nowrap !important;
              }
              .cf-badge-counter {
                position: absolute !important;
                top: -2px !important;
                right: -2px !important;
                min-width: 18px !important;
                height: 18px !important;
                padding: 0 4px !important;
                border-radius: 999px !important;
                background: #ef4444 !important;
                color: #ffffff !important;
                border: 2px solid #ffffff !important;
                font-size: 10px !important;
                font-weight: 700 !important;
                display: grid !important;
                place-items: center !important;
              }
              .cf-canvas-greeting {
                position: absolute !important;
                background-color: #ffffff !important;
                color: #111827 !important;
                padding: 10px 14px !important;
                border-radius: 14px !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.18) !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 10px !important;
                white-space: nowrap !important;
                width: max-content !important;
                max-width: 320px !important;
                z-index: 100 !important;
                cursor: pointer !important;
                user-select: none !important;
                animation: cfFadeIn .22s ease both !important;
              }
              .cf-canvas-greeting-close {
                border: none !important;
                background: transparent !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 16px !important;
                height: 16px !important;
                line-height: 1 !important;
                color: #9ca3af !important;
                padding: 0 !important;
                opacity: 0.75 !important;
                transition: opacity 0.15s ease, color 0.15s ease !important;
              }
              .cf-canvas-greeting-close:hover {
                opacity: 1 !important;
                color: #4b5563 !important;
              }
              .cf-canvas-greeting-close svg {
                display: block !important;
              }
              .cf-canvas-modal-header {
                color: #ffffff !important;
                padding: 20px 18px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
              }
              .cf-canvas-modal-top {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                width: 100% !important;
                margin-bottom: 12px !important;
              }
              .cf-canvas-header-info {
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
              }
              .cf-canvas-modal-h3 {
                margin: 0 !important;
                font-size: 18px !important;
                font-weight: 700 !important;
                line-height: 1.2 !important;
              }
              .cf-canvas-modal-p {
                margin: 0 !important;
                font-size: 13px !important;
                color: #ffffff !important;
                opacity: 0.92 !important;
                line-height: 1.4 !important;
              }
              .cf-canvas-response-badge {
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                background: rgba(255,255,255,0.22) !important;
                padding: 3px 10px !important;
                border-radius: 999px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                width: max-content !important;
                margin-top: 4px !important;
              }
              .cf-canvas-response-badge.offline {
                background: rgba(0, 0, 0, 0.3) !important;
                color: rgba(255, 255, 255, 0.9) !important;
              }
              .cf-canvas-agent-av-badge.offline {
                background: #6b7280 !important;
              }
              .cf-canvas-agents-wrap {
                padding: 14px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                max-height: 340px !important;
                overflow-y: auto !important;
              }
              .cf-canvas-agent-card {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                padding: 10px 12px !important;
                border-radius: 14px !important;
                background-color: #f9fafb !important;
                border: 1px solid #f3f4f6 !important;
                cursor: pointer !important;
                transition: background-color 0.18s ease, transform 0.18s ease, border-color 0.18s ease !important;
              }
              .cf-canvas-agent-card:hover {
                background-color: #f3f4f6 !important;
                border-color: #e5e7eb !important;
                transform: translateY(-1px) !important;
              }
              .cf-canvas-agent-arrow {
                transition: transform 0.18s ease !important;
                display: flex !important;
                align-items: center !important;
              }
              .cf-canvas-agent-card:hover .cf-canvas-agent-arrow {
                transform: translateX(2px) !important;
              }
              .cf-canvas-agent-av-wrap {
                position: relative !important;
                width: 42px !important;
                height: 42px !important;
                flex-shrink: 0 !important;
              }
              .cf-canvas-agent-av-img {
                width: 42px !important;
                height: 42px !important;
                border-radius: 50% !important;
                object-fit: cover !important;
              }
              .cf-canvas-agent-name-row {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
              }
              .cf-canvas-agent-online-dot {
                width: 7px !important;
                height: 7px !important;
                border-radius: 50% !important;
                background-color: #22c55e !important;
                box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25) !important;
                flex-shrink: 0 !important;
                display: inline-block !important;
              }
              .cf-canvas-agent-av-badge {
                position: absolute !important;
                bottom: -2px !important;
                right: -2px !important;
                width: 17px !important;
                height: 17px !important;
                border-radius: 50% !important;
                display: grid !important;
                place-items: center !important;
                border: 2px solid #ffffff !important;
                color: #ffffff !important;
              }
              .cf-canvas-agent-av-badge svg {
                width: 10px !important;
                height: 10px !important;
                display: block !important;
                fill: #ffffff !important;
                color: #ffffff !important;
              }
              .cf-canvas-agent-av-badge svg path {
                fill: #ffffff !important;
              }
              .cf-canvas-agent-info {
                flex: 1 !important;
                min-width: 0 !important;
              }
              .cf-canvas-agent-name {
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #111827 !important;
              }
              .cf-canvas-agent-role {
                font-size: 12px !important;
                color: #6b7280 !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
              }
              .cf-canvas-chat-wrap {
                padding: 16px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 14px !important;
              }
              .cf-canvas-chat-bubble {
                background-color: #f3f4f6 !important;
                color: #1f2937 !important;
                padding: 12px 14px !important;
                border-radius: 16px 16px 16px 4px !important;
                font-size: 13px !important;
                line-height: 1.45 !important;
              }
              .cf-canvas-chat-input {
                width: 100% !important;
                padding: 10px 12px !important;
                border-radius: 12px !important;
                border: 1px solid #e5e7eb !important;
                font-size: 13px !important;
                outline: none !important;
                box-sizing: border-box !important;
              }
              .cf-canvas-start-btn {
                color: #ffffff !important;
                border-radius: 999px !important;
                padding: 12px 20px !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                text-align: center !important;
                text-decoration: none !important;
                box-shadow: 0 8px 20px rgba(0,0,0,0.16) !important;
                display: block !important;
              }
              .cf-canvas-buttons-container {
                position: absolute !important;
                z-index: 90 !important;
                gap: 10px !important;
              }
              .cf-canvas-channel-item {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
              }
              .cf-canvas-channel-label {
                background-color: #ffffff !important;
                color: #111827 !important;
                padding: 4px 9px !important;
                border-radius: 6px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
                white-space: nowrap !important;
              }
              .cf-canvas-icon-inner {
                width: 22px !important;
                height: 22px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex-shrink: 0 !important;
                overflow: hidden !important;
              }

              @media (max-width: 640px) {
                .cf-canvas-buttons-container {
                  max-height: calc(100vh - 130px) !important;
                  overflow-y: auto !important;
                  overflow-x: hidden !important;
                  -webkit-overflow-scrolling: touch !important;
                  padding-right: 4px !important;
                  scrollbar-width: thin !important;
                }
                .cf-canvas-channel-item.is-overflow-hidden {
                  display: none !important;
                }
                .cf-canvas-more-btn {
                  width: 44px !important;
                  height: 44px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  background-color: #374151 !important;
                  color: #ffffff !important;
                  font-size: 13px !important;
                  font-weight: 700 !important;
                  cursor: pointer !important;
                  border: none !important;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.18) !important;
                  transition: transform 0.15s ease, background-color 0.15s ease !important;
                }
                .cf-canvas-more-btn:hover {
                  transform: scale(1.06) !important;
                  background-color: #1f2937 !important;
                }
                .cf-canvas-more-btn.is-expanded {
                  background-color: #5271ff !important;
                }
              }
              @media (min-width: 641px) {
                .cf-canvas-more-item {
                  display: none !important;
                }
              }

              /* Framefic Watermark Badge - Under Toggle Button */
              .cf-canvas-wm-wrap {
                position: absolute !important;
                top: calc(100% + 6px) !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                margin: 0 !important;
                width: max-content !important;
                max-width: max-content !important;
                box-sizing: border-box !important;
                background: transparent !important;
                user-select: none !important;
                pointer-events: auto !important;
                overflow: visible !important;
                z-index: 60 !important;
              }
              .framefic-wm-link {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 4px !important;
                padding: 3px 8px 3px 5px !important;
                border-radius: 999px !important;
                background: rgba(255, 255, 255, 0.94) !important;
                border: 1px solid rgba(0, 0, 0, 0.08) !important;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04) !important;
                text-decoration: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', Helvetica, Arial, sans-serif !important;
                font-size: 10px !important;
                line-height: 1 !important;
                cursor: pointer !important;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
                box-sizing: border-box !important;
                width: max-content !important;
                max-width: max-content !important;
                overflow: visible !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
              }
              .framefic-wm-link:hover {
                transform: translateY(-1px) scale(1.02) !important;
                border-color: rgba(82, 113, 255, 0.5) !important;
                background: #ffffff !important;
                box-shadow: 0 4px 12px rgba(82, 113, 255, 0.22) !important;
              }
              .framefic-wm-icon {
                width: 12px !important;
                height: 12px !important;
                min-width: 12px !important;
                min-height: 12px !important;
                max-width: 12px !important;
                max-height: 12px !important;
                border-radius: 3px !important;
                background: linear-gradient(135deg, #5271ff 0%, #3557ff 100%) !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 1px 2px rgba(82, 113, 255, 0.35) !important;
                flex-shrink: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
              }
              .framefic-wm-icon svg {
                width: 7.5px !important;
                height: 7.5px !important;
                min-width: 7.5px !important;
                min-height: 7.5px !important;
                max-width: 7.5px !important;
                max-height: 7.5px !important;
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .framefic-wm-text {
                color: #64748b !important;
                font-size: 10px !important;
                font-weight: 500 !important;
                letter-spacing: 0.1px !important;
                white-space: nowrap !important;
                word-break: keep-all !important;
                line-height: 1 !important;
                display: inline-block !important;
                flex-shrink: 0 !important;
                transition: color 0.2s ease !important;
                text-shadow: none !important;
              }
              .framefic-wm-link:hover .framefic-wm-text {
                color: #3b82f6 !important;
              }
              .framefic-wm-brand {
                color: #0f172a !important;
                font-size: 10px !important;
                font-weight: 700 !important;
                letter-spacing: 0.15px !important;
                white-space: nowrap !important;
                word-break: keep-all !important;
                line-height: 1 !important;
                display: inline-block !important;
                flex-shrink: 0 !important;
                transition: color 0.2s ease !important;
                text-shadow: none !important;
              }
              .framefic-wm-link:hover .framefic-wm-brand {
                color: #1d4ed8 !important;
              }

              /* Framer Dark Theme Compatibility */
              body[data-framer-theme="dark"] .framefic-wm-link,
              [data-theme="dark"] .framefic-wm-link,
              .dark .framefic-wm-link {
                background: rgba(15, 23, 42, 0.88) !important;
                border-color: rgba(255, 255, 255, 0.16) !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important;
              }

              body[data-framer-theme="dark"] .framefic-wm-link:hover,
              [data-theme="dark"] .framefic-wm-link:hover,
              .dark .framefic-wm-link:hover {
                background: rgba(30, 41, 59, 0.95) !important;
                border-color: rgba(82, 113, 255, 0.6) !important;
                box-shadow: 0 4px 14px rgba(82, 113, 255, 0.3) !important;
              }

              body[data-framer-theme="dark"] .framefic-wm-text,
              [data-theme="dark"] .framefic-wm-text,
              .dark .framefic-wm-text {
                color: #94a3b8 !important;
                text-shadow: none !important;
              }

              body[data-framer-theme="dark"] .framefic-wm-link:hover .framefic-wm-text,
              [data-theme="dark"] .framefic-wm-link:hover .framefic-wm-text,
              .dark .framefic-wm-link:hover .framefic-wm-text {
                color: #93c5fd !important;
              }

              body[data-framer-theme="dark"] .framefic-wm-brand,
              [data-theme="dark"] .framefic-wm-brand,
              .dark .framefic-wm-brand {
                color: #ffffff !important;
                text-shadow: none !important;
              }

              body[data-framer-theme="dark"] .framefic-wm-link:hover .framefic-wm-brand,
              [data-theme="dark"] .framefic-wm-link:hover .framefic-wm-brand,
              .dark .framefic-wm-link:hover .framefic-wm-brand {
                color: #ffffff !important;
              }
            \`}</style>
            <div className="cf-launcher-watermark-wrap" style={launcherWatermarkWrapStyle}>
                <button
                    type="button"
                    className="cf-main-btn"
                    style={mainBtnStyle}
                    onClick={(e) => {
                        e.stopPropagation()
                        flushPendingChimeIfQueued()
                        const nextOpen = !isOpen
                        setIsOpen(nextOpen)
                        if (isOpen) {
                            setSelectedAgent(null)
                            setNavDirection("forward")
                        }
                    }}
                    aria-label={ariaLabel}
                    aria-expanded={isOpen}
                >
                    <div className={"cf-icon-rotator" + (isOpen ? " is-open" : "")}>
                        {renderLauncherIcon(launcherIcon, isOpen, isLocked)}
                    </div>
                    {hasPillLabel ? (
                        <span className="cf-pill-text">
                            {isOpen ? "Close" : launcherText}
                        </span>
                    ) : null}
                    {showBadge && !isOpen ? (
                        <span className="cf-badge-counter">
                            {badgeText}
                        </span>
                    ) : null}
                </button>

                {showBranding && !isLocked ? (
                    <div
                        className="cf-canvas-wm-wrap"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <a
                            href="https://framefic.com/chat-bubbles"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="framefic-wm-link"
                            title="Made with Chat Bubbles"
                        >
                            <span className="framefic-wm-icon">
                                <svg width="7" height="7" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.2 5V3.4C2.2 2.74 2.74 2.2 3.4 2.2H5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M11 2.2H12.6C13.26 2.2 13.8 2.74 13.8 3.4V5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2.2 11V12.6C2.2 13.26 2.74 13.8 3.4 13.8H5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M11 13.8H12.6C13.26 13.8 13.8 13.26 13.8 12.6V11" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <rect x="4.4" y="4.6" width="7.2" height="6.8" rx="1.6" fill="#ffffff" />
                                </svg>
                            </span>
                            <span className="framefic-wm-text">Made with</span>
                            <span className="framefic-wm-brand">Chat Bubbles</span>
                        </a>
                    </div>
                ) : null}
            </div>

            {!isLocked && greetingEnabled && greetingVisible && !greetingDismissed && !isOpen ? (
                <div
                    className="cf-canvas-greeting"
                    style={greetingPosStyle}
                    onClick={() => {
                        flushPendingChimeIfQueued()
                        setIsOpen(true)
                    }}
                >
                    <span>{greetingText}</span>
                    <button
                        type="button"
                        className="cf-canvas-greeting-close"
                        aria-label="Close"
                        onClick={(e) => {
                            e.stopPropagation()
                            cancelPendingChime()
                            setGreetingDismissed(true)
                        }}
                    >
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                    </button>
                </div>
            ) : null}

            {isOpen && widgetMode === "modal" ? (
                <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                    <div style={modalInnerContentStyle}>
                        <div className="cf-canvas-modal-header" style={headerWrapStyle}>
                            <div className="cf-canvas-modal-top">
                                {selectedAgent ? (
                                    <button
                                        type="button"
                                        className="cf-header-btn cf-header-back-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setNavDirection("backward")
                                            setSelectedAgent(null)
                                        }}
                                        aria-label="Back to agent list"
                                    >
                                        <svg
                                            width="11"
                                            height="11"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M9.5 4L5.5 8l4 4" />
                                        </svg>
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    className="cf-header-btn cf-header-close-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsOpen(false)
                                        setSelectedAgent(null)
                                        setNavDirection("forward")
                                    }}
                                    aria-label="Close chat"
                                >
                                    <svg
                                        width="11"
                                        height="11"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                                    </svg>
                                </button>
                            </div>
                            <div
                                key={selectedAgent ? "header-agent-" + selectedAgent.id : "header-main"}
                                className={"cf-canvas-header-info" + (selectedAgent ? " cf-view-slide-forward" : (navDirection === "backward" ? " cf-view-slide-backward" : ""))}
                            >
                                <h3 className="cf-canvas-modal-h3">
                                    {selectedAgent ? selectedAgent.name : modalTitle}
                                </h3>
                                <p className="cf-canvas-modal-p">
                                    {selectedAgent ? selectedAgent.role : modalSubtitle}
                                </p>
                                {!selectedAgent && (modalResponseTime || (scheduleEnabled && isOffline)) ? (
                                    <span className={"cf-canvas-response-badge" + (isOffline ? " offline" : "")}>
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.2l2.2 1.3"/></svg>
                                        <span>{isOffline ? (scheduleOfflineText || "Back tomorrow at 9:00 AM") : modalResponseTime}</span>
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        {!selectedAgent ? (
                            <div
                                key="agents-list"
                                className={"cf-canvas-agents-wrap" + (navDirection === "backward" ? " cf-view-slide-backward" : "")}
                            >
                                {agents.map((agent: any) => {
                                    const agentBadgeBgStyle: React.CSSProperties = {
                                        background: agent.color,
                                    }
                                    return (
                                        <div
                                            key={agent.id}
                                            className="cf-canvas-agent-card"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setNavDirection("forward")
                                                setSelectedAgent(agent)
                                                setCustomMessage(agent.message || "")
                                            }}
                                        >
                                            <div className="cf-canvas-agent-av-wrap">
                                                <img
                                                    src={agent.avatar}
                                                    alt={agent.name}
                                                    className="cf-canvas-agent-av-img"
                                                />
                                                <span
                                                    className={"cf-canvas-agent-av-badge" + (isOffline ? " offline" : "")}
                                                    style={isOffline ? { background: "#6b7280" } : agentBadgeBgStyle}
                                                >
                                                    {renderChannelIcon(agent.channelId, 11)}
                                                </span>
                                            </div>
                                            <div className="cf-canvas-agent-info">
                                                <div className="cf-canvas-agent-name-row">
                                                    <span className="cf-canvas-agent-name">{agent.name}</span>
                                                    {agent.online !== false && !isOffline ? (
                                                        <span className="cf-canvas-agent-online-dot" />
                                                    ) : null}
                                                </div>
                                                <div className="cf-canvas-agent-role">
                                                    {agent.role}{isOffline ? " • Offline" : ""}
                                                </div>
                                            </div>
                                            <span className="cf-canvas-agent-arrow">
                                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5L10.5 8L6 12.5"/></svg>
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div
                                key={"chat-view-" + selectedAgent.id}
                                className="cf-canvas-chat-wrap cf-view-slide-forward"
                            >
                                <div className="cf-canvas-chat-bubble">
                                    {modalChatBubble || selectedAgent.message || "We typically reply within a few minutes. How can we help you today?"}
                                </div>
                                <input
                                    type="text"
                                    className="cf-canvas-chat-input"
                                    placeholder={selectedAgent.message ? selectedAgent.message : "Type your message..."}
                                    maxLength={500}
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                />
                                <a
                                    href={(() => {
                                        const msg = customMessage.trim() || (selectedAgent.message || "").trim()
                                        const rawVal = String(selectedAgent.value || "").trim()
                                        if (selectedAgent.channelId === "whatsapp") {
                                            const clean = rawVal.replace(/[^0-9]/g, "")
                                            return clean ? "https://wa.me/" + clean + (msg ? "?text=" + encodeURIComponent(msg) : "") : "https://wa.me/"
                                        }
                                        if (selectedAgent.channelId === "telegram") {
                                            const handle = rawVal.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "")
                                            return handle ? "https://t.me/" + handle + (msg ? "?text=" + encodeURIComponent(msg) : "") : "https://t.me/"
                                        }
                                        if (selectedAgent.channelId === "email") {
                                            const cleanEmail = rawVal.replace(/[^a-zA-Z0-9._%+\-@]/g, "")
                                            const emailParams: string[] = []
                                            const activeSub = (selectedAgent as any).emailSubject || emailSubject || ""
                                            if (activeSub && activeSub.trim()) emailParams.push("subject=" + encodeURIComponent(activeSub.trim()))
                                            if (msg) emailParams.push("body=" + encodeURIComponent(msg))
                                            const emailQuery = emailParams.length > 0 ? "?" + emailParams.join("&") : ""
                                            return cleanEmail ? "mailto:" + cleanEmail + emailQuery : "mailto:"
                                        }
                                        return selectedAgent.url || "#"
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cf-canvas-start-btn"
                                    style={headerWrapStyle}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (enableAnalytics && typeof window !== "undefined") {
                                            try {
                                                if (Array.isArray((window as any).dataLayer)) {
                                                    (window as any).dataLayer.push({
                                                        event: "chat_bubbles_click",
                                                        channel: selectedAgent.channelId,
                                                        channel_label: selectedAgent.channelLabel || selectedAgent.channelId,
                                                        agent_name: selectedAgent.name,
                                                    })
                                                }
                                                if (typeof (window as any).gtag === "function") {
                                                    (window as any).gtag("event", "chat_bubbles_click", {
                                                        channel: selectedAgent.channelId,
                                                        channel_label: selectedAgent.channelLabel || selectedAgent.channelId,
                                                        agent_name: selectedAgent.name,
                                                    })
                                                }
                                                window.dispatchEvent(new CustomEvent("chat_bubbles_interaction", {
                                                    detail: {
                                                        channel: selectedAgent.channelId,
                                                        channelLabel: selectedAgent.channelLabel || selectedAgent.channelId,
                                                        agentName: selectedAgent.name,
                                                    }
                                                }))
                                            } catch {}
                                        }
                                        if (closeAfterClick) {
                                            setIsOpen(false)
                                            setSelectedAgent(null)
                                            setNavDirection("forward")
                                        }
                                    }}
                                >
                                    {modalStartChatText}
                                </a>
                            </div>
                        )}
                    </div>

                    {isLocked ? (
                        <div className="cf-canvas-pro-locked-overlay" style={proLockedModalOverlayStyle}>
                            <div style={proLockedIconWrapStyle}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#708AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <div style={proLockedTitleStyle}>PRO Feature Locked</div>
                            <div style={proLockedDescStyle}>
                                Upgrade this site to a PRO plan in the Chat Bubbles plugin to activate.
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {isOpen && widgetMode === "buttons" ? (
                <>
                    <div className="cf-canvas-buttons-container" style={buttonsContainerWithLockStyle}>
                        {channels.map((channel, idx) => {
                            const channelItemStyle: React.CSSProperties = {
                                flexDirection: isRight ? "row-reverse" : "row",
                            }
                            const channelBtnStyle: React.CSSProperties = {
                                borderRadius: radius,
                                backgroundColor: channel.color,
                                color: "#ffffff",
                            }
                            const isCapped = Boolean(mobileCapChannels ?? true) && channels.length > 4 && !mobileExpanded && idx >= 4
                            return (
                                <div
                                    key={channel.id}
                                    className={"cf-canvas-channel-item" + (isCapped ? " is-overflow-hidden" : "")}
                                    style={channelItemStyle}
                                >
                                    <a
                                        href={channel.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => {
                                            if (enableAnalytics && typeof window !== "undefined") {
                                                try {
                                                    if (Array.isArray((window as any).dataLayer)) {
                                                        (window as any).dataLayer.push({ event: "chat_bubbles_click", channel: channel.id, channel_label: channel.label })
                                                    }
                                                    if (typeof (window as any).gtag === "function") {
                                                        (window as any).gtag("event", "chat_bubbles_click", { channel: channel.id, channel_label: channel.label })
                                                    }
                                                    window.dispatchEvent(new CustomEvent("chat_bubbles_interaction", { detail: { channel: channel.id, channelLabel: channel.label } }))
                                                } catch {}
                                            }
                                            if (closeAfterClick) setIsOpen(false)
                                        }}
                                        className="cf-channel-btn"
                                        style={channelBtnStyle}
                                    >
                                        <div className="cf-canvas-icon-inner">
                                            {renderChannelIcon(channel.id, 22)}
                                        </div>
                                    </a>
                                    {showLabels ? (
                                        <span className="cf-canvas-channel-label">
                                            {channel.label}
                                        </span>
                                    ) : null}
                                </div>
                            )
                        })}

                        {Boolean(mobileCapChannels ?? true) && channels.length > 4 ? (
                            (() => {
                                const moreItemStyle: React.CSSProperties = {
                                    flexDirection: isRight ? "row-reverse" : "row",
                                }
                                const moreBtnStyle: React.CSSProperties = {
                                    borderRadius: radius,
                                }
                                return (
                                    <div
                                        className="cf-canvas-channel-item cf-canvas-more-item"
                                        style={moreItemStyle}
                                    >
                                        <button
                                            type="button"
                                            className={"cf-canvas-more-btn" + (mobileExpanded ? " is-expanded" : "")}
                                            style={moreBtnStyle}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setMobileExpanded(!mobileExpanded)
                                            }}
                                            aria-label={mobileExpanded ? "Show less channels" : "Show more channels"}
                                        >
                                            {mobileExpanded ? "−" : "+" + (channels.length - 4)}
                                        </button>
                                        {showLabels ? (
                                            <span className="cf-canvas-channel-label">
                                                {mobileExpanded ? "Show Less" : "+" + (channels.length - 4) + " More"}
                                            </span>
                                        ) : null}
                                    </div>
                                )
                            })()
                        ) : null}
                    </div>

                    {isLocked ? (
                        <div className="cf-canvas-pro-locked-overlay" style={proLockedButtonsOverlayStyle}>
                            <div style={proLockedIconWrapStyle}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#708AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <div style={proLockedTitleStyle}>PRO Feature Locked</div>
                            <div style={proLockedDescStyle}>
                                Upgrade this site to a PRO plan in the Chat Bubbles plugin to activate.
                            </div>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    )
}

ChatBubbles.defaultProps = {
    width: 60,
    height: 60,
    canvasPreview: "modal",
    widgetMode: ${JSON.stringify(config.widgetMode || "modal")},
}

addPropertyControls(ChatBubbles, {
    canvasPreview: {
        type: ControlType.Enum,
        title: "Canvas State",
        options: ["modal", "chat", "closed"],
        optionTitles: ["Open Modal", "Agent Chat", "Launcher Button"],
        defaultValue: "modal",
            },
    widgetMode: {
        type: ControlType.Enum,
        title: "Widget Mode",
        options: ["modal", "buttons"],
        optionTitles: ["Live Chat Modal", "Icon Buttons"],
        defaultValue: ${JSON.stringify(config.widgetMode || "modal")},
            },
    modalTheme: {
        type: ControlType.Enum,
        title: "Modal Theme",
        options: ["whatsapp", "messenger", "telegram", "instagram", "tiktok", "wechat", "dark", "custom"],
        optionTitles: ["WhatsApp Green", "Messenger Blue", "Telegram Sky", "Instagram Gradient", "TikTok Dark", "WeChat Green", "Modern Dark", "Custom"],
        defaultValue: ${JSON.stringify(config.modalTheme || "whatsapp")},
        hidden(props: any) {
            return props.widgetMode === "buttons"
        },
    },
    modalCustomGradient: {
        type: ControlType.String,
        title: "Custom Gradient",
        defaultValue: ${JSON.stringify(config.modalCustomGradient || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)")},
        hidden(props: any) {
            return props.widgetMode === "buttons" || props.modalTheme !== "custom"
        },
    },
    modalTitle: {
        type: ControlType.String,
        title: "Modal Title",
        defaultValue: ${JSON.stringify(config.modalTitle || "Hi there!")},
        hidden(props: any) {
            return props.widgetMode === "buttons"
        },
    },
    modalSubtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: ${JSON.stringify(config.modalSubtitle || "Welcome to our live chat! Feel free to ask any questions.")},
        hidden(props: any) {
            return props.widgetMode === "buttons"
        },
    },
    modalResponseTime: {
        type: ControlType.String,
        title: "Response Tag",
        defaultValue: ${JSON.stringify(config.modalResponseTime || "We typically reply within a few minutes")},
        hidden(props: any) {
            return props.widgetMode === "buttons"
        },
    },
    modalChatBubble: {
        type: ControlType.String,
        title: "Greeting Msg",
        defaultValue: ${JSON.stringify(config.modalChatBubble || "We typically reply within a few minutes. How can we help you today?")},
        hidden(props: any) {
            return props.widgetMode === "buttons"
        },
    },
    modalStartChatText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: ${JSON.stringify(config.modalStartChatText || "Start chat")},
        hidden(props: any) {
            return props.widgetMode === "buttons"
        },
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottom-right", "bottom-left", "top-right", "top-left"],
        optionTitles: ["Bottom Right", "Bottom Left", "Top Right", "Top Left"],
        defaultValue: ${JSON.stringify(config.position || "bottom-right")},
            },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["stack", "grid", "horizontal"],
        optionTitles: ["Stack (Vertical)", "Grid (2 Columns)", "Horizontal"],
        defaultValue: ${JSON.stringify(config.layout || "stack")},
        hidden(props: any) {
            return props.widgetMode === "modal"
        },
    },
    animation: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["pop", "bounce", "slide", "pulse", "none"],
        optionTitles: ["Pop In", "Bounce", "Slide Up", "Pulse Glow", "None"],
        defaultValue: ${JSON.stringify(config.animation || "pop")},
            },
    buttonColor: {
        type: ControlType.Color,
        title: "Launcher Color",
        defaultValue: ${JSON.stringify(config.buttonColor || "#25D366")},
            },
    buttonShape: {
        type: ControlType.Enum,
        title: "Button Shape",
        options: ["circle", "rounded", "pill"],
        optionTitles: ["Circle", "Rounded", "Pill"],
        defaultValue: ${JSON.stringify(config.buttonShape || "circle")},
            },
    launcherText: {
        type: ControlType.String,
        title: "Button Label",
        defaultValue: "Chat",
        hidden(props: any) {
            return props.buttonShape !== "pill"
        },
    },
    launcherIcon: {
        type: ControlType.Enum,
        title: "Button Icon",
        options: ["chat", "whatsapp", "messenger", "telegram", "instagram", "phone", "email", "support"],
        optionTitles: ["Live Chat", "WhatsApp", "Messenger", "Telegram", "Instagram", "Phone", "Email", "Headset Support"],
        defaultValue: ${JSON.stringify(config.launcherIcon || "chat")},
            },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: ${Boolean(config.showLabels)},
        hidden(props: any) {
            return props.widgetMode === "modal"
        },
    },
    mobileCapChannels: {
        type: ControlType.Boolean,
        title: "Mobile Cap (4+)",
        defaultValue: ${Boolean(config.mobileCapChannels ?? true)},
        hidden(props: any) {
            return props.widgetMode === "modal"
        },
    },
    closeOnOutsideClick: {
        type: ControlType.Boolean,
        title: "Outside Click",
        defaultValue: ${Boolean(config.closeOnOutsideClick ?? true)},
            },
    closeOnEscape: {
        type: ControlType.Boolean,
        title: "Escape Key",
        defaultValue: ${Boolean(config.closeOnEscape ?? true)},
            },
    closeAfterClick: {
        type: ControlType.Boolean,
        title: "Close on Click",
        defaultValue: ${Boolean(config.closeAfterClick ?? true)},
            },
    autoOpen: {
        type: ControlType.Boolean,
        title: "Auto Open",
        defaultValue: ${Boolean(config.autoOpen)},
            },
    autoOpenDelay: {
        type: ControlType.Number,
        title: "Auto Open Delay (ms)",
        defaultValue: ${Number(config.autoOpenDelay ?? 1200)},
        min: 0,
        max: 30000,
        step: 500,
        hidden(props: any) {
            return !props.autoOpen
        },
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: ${JSON.stringify(config.ariaLabel || "Open chat options")},
            },
    showBadge: {
        type: ControlType.Boolean,
        title: "Badge",
        defaultValue: ${Boolean(config.showBadge)},
            },
    badgeText: {
        type: ControlType.String,
        title: "Badge Text",
        defaultValue: ${JSON.stringify(config.badgeText || "1")},
        hidden(props: any) {
            return !props.showBadge
        },
    },
    greetingEnabled: {
        type: ControlType.Boolean,
        title: "Greeting Bubble",
        defaultValue: ${Boolean(config.greetingEnabled)},
            },
    greetingText: {
        type: ControlType.String,
        title: "Greeting Text",
        defaultValue: ${JSON.stringify(config.greetingText || "Need help? Chat with us.")},
        hidden(props: any) {
            return !props.greetingEnabled
        },
    },
    enableSound: {
        type: ControlType.Boolean,
        title: "Notification Sound",
        defaultValue: ${Boolean(config.enableSound)},
            },
    greetingDelay: {
        type: ControlType.Number,
        title: "Greeting Delay (ms)",
        min: 0,
        max: 30000,
        step: 500,
        defaultValue: ${Number(config.greetingDelay ?? 2000)},
        hidden: (props: any) => !props.greetingEnabled,
    },
    whatsapp: {
        type: ControlType.String,
        title: "WhatsApp",
        placeholder: "+1234567890",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "whatsapp")?.value || "")},
            },
    whatsappMessage: {
        type: ControlType.String,
        title: "WA Message",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "whatsapp")?.message || "Hello! I would like to know more.")},
            },
    messenger: {
        type: ControlType.String,
        title: "Messenger",
        placeholder: "username",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "messenger")?.value || "")},
            },
    telegram: {
        type: ControlType.String,
        title: "Telegram",
        placeholder: "username",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "telegram")?.value || "")},
            },
    telegramMessage: {
        type: ControlType.String,
        title: "TG Message",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "telegram")?.message || "Hello!")},
            },
    instagram: {
        type: ControlType.String,
        title: "Instagram",
        placeholder: "username",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "instagram")?.value || "")},
            },
    tiktok: {
        type: ControlType.String,
        title: "TikTok",
        placeholder: "username",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "tiktok")?.value || "")},
            },
    wechat: {
        type: ControlType.String,
        title: "WeChat",
        placeholder: "wechat_id",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "wechat")?.value || "")},
            },
    viber: {
        type: ControlType.String,
        title: "Viber",
        placeholder: "+1234567890",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "viber")?.value || "")},
            },
    line: {
        type: ControlType.String,
        title: "LINE",
        placeholder: "line_id",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "line")?.value || "")},
            },
    signal: {
        type: ControlType.String,
        title: "Signal",
        placeholder: "username or link",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "signal")?.value || "")},
            },
    phone: {
        type: ControlType.String,
        title: "Phone",
        placeholder: "+1234567890",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "phone")?.value || "")},
            },
    sms: {
        type: ControlType.String,
        title: "SMS",
        placeholder: "+1234567890",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "sms")?.value || "")},
            },
    smsMessage: {
        type: ControlType.String,
        title: "SMS Default Text",
        placeholder: "Hello! I have a question.",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "sms")?.message || "")},
            },
    email: {
        type: ControlType.String,
        title: "Email",
        placeholder: "hello@example.com",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "email")?.value || "")},
            },
    emailSubject: {
        type: ControlType.String,
        title: "Email Subject",
        placeholder: "Inquiry from website",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "email")?.emailSubject || "")},
            },
    emailMessage: {
        type: ControlType.String,
        title: "Email Message",
        placeholder: "Hello! I have a question...",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "email")?.message || "")},
            },
    discord: {
        type: ControlType.String,
        title: "Discord",
        placeholder: "https://discord.gg/yourserver",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "discord")?.value || "")},
            },
    slack: {
        type: ControlType.String,
        title: "Slack",
        placeholder: "https://join.slack.com/...",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "slack")?.value || "")},
            },
    teams: {
        type: ControlType.String,
        title: "Teams",
        placeholder: "user@company.com",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "teams")?.value || "")},
            },
    x: {
        type: ControlType.String,
        title: "X (Twitter)",
        placeholder: "username",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "x")?.value || "")},
            },
    linkedin: {
        type: ControlType.String,
        title: "LinkedIn",
        placeholder: "in/username or company/name",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "linkedin")?.value || "")},
            },
    maps: {
        type: ControlType.String,
        title: "Google Maps",
        placeholder: "Store address or maps link",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "maps")?.value || "")},
            },
    custom: {
        type: ControlType.String,
        title: "Custom URL",
        placeholder: "https://example.com/chat",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "custom")?.value || "")},
            },
    customLabel: {
        type: ControlType.String,
        title: "Custom Label",
        placeholder: "Custom",
        defaultValue: ${JSON.stringify(config.channels.find((c) => c.id === "custom")?.label || "Custom")},
            },
    scrollTriggerEnabled: {
        type: ControlType.Boolean,
        title: "Scroll Trigger",
        defaultValue: ${Boolean(config.scrollTriggerEnabled)},
            },
    scrollTriggerPercent: {
        type: ControlType.Number,
        title: "Scroll Depth %",
        min: 5,
        max: 95,
        step: 5,
        defaultValue: ${Number(config.scrollTriggerPercent ?? 25)},
        hidden: (props: any) => !props.scrollTriggerEnabled,
    },
    scrollTriggerTarget: {
        type: ControlType.Enum,
        title: "Scroll Target",
        options: ["launcher", "greeting"],
        optionTitles: ["Reveal Launcher", "Reveal Greeting"],
        defaultValue: ${JSON.stringify(config.scrollTriggerTarget || "launcher")},
        hidden: (props: any) => !props.scrollTriggerEnabled,
    },
    exitIntentEnabled: {
        type: ControlType.Boolean,
        title: "Exit-Intent (Desktop)",
        defaultValue: ${Boolean(config.exitIntentEnabled)},
            },
    exitIntentAction: {
        type: ControlType.Enum,
        title: "Exit Action",
        options: ["modal", "greeting"],
        optionTitles: ["Pop Open Chat", "Show Greeting"],
        defaultValue: ${JSON.stringify(config.exitIntentAction || "modal")},
        hidden: (props: any) => !props.exitIntentEnabled,
    },
    scheduleEnabled: {
        type: ControlType.Boolean,
        title: "Operating Hours",
        defaultValue: ${Boolean(config.scheduleEnabled)},
            },
    scheduleStart: {
        type: ControlType.String,
        title: "Opening Time",
        defaultValue: ${JSON.stringify(config.scheduleStart || "09:00")},
        hidden: (props: any) => !props.scheduleEnabled,
    },
    scheduleEnd: {
        type: ControlType.String,
        title: "Closing Time",
        defaultValue: ${JSON.stringify(config.scheduleEnd || "18:00")},
        hidden: (props: any) => !props.scheduleEnabled,
    },
    scheduleOfflineAction: {
        type: ControlType.Enum,
        title: "Offline Action",
        options: ["badge", "hide"],
        optionTitles: ["Offline Badge", "Hide Widget"],
        defaultValue: ${JSON.stringify(config.scheduleOfflineAction || "badge")},
        hidden: (props: any) => !props.scheduleEnabled,
    },
    scheduleOfflineText: {
        type: ControlType.String,
        title: "Offline Message",
        defaultValue: ${JSON.stringify(config.scheduleOfflineText || "Back tomorrow at 9:00 AM")},
        hidden: (props: any) => !props.scheduleEnabled || props.scheduleOfflineAction === "hide",
    },
    showOn: {
        type: ControlType.String,
        title: "Where To Show",
        defaultValue: ${JSON.stringify(config.showOn || "Every page")},
            },
    canvasPagePath: {
        type: ControlType.String,
        title: "Canvas Page Path",
        defaultValue: "",
        hidden: () => true,
    },
    targetingMode: {
        type: ControlType.Enum,
        title: "Targeting Mode",
        options: ["show", "hide"],
        optionTitles: ["Show Only on Paths", "Hide on Paths"],
        defaultValue: ${JSON.stringify(config.targetingMode || "show")},
        hidden: (props: any) => props.showOn !== "custom",
    },
    targetingRules: {
        type: ControlType.String,
        title: "Targeting Paths",
        placeholder: "/pricing, /checkout, /blog/*",
        defaultValue: ${JSON.stringify(config.targetingRules || "")},
        hidden: (props: any) => props.showOn !== "custom",
    },
    agentsData: {
        type: ControlType.String,
        title: "Agents Data",
        defaultValue: ${JSON.stringify(JSON.stringify(config.agents || []))},
        hidden: () => true,
    },
    scheduleDaysData: {
        type: ControlType.String,
        title: "Schedule Days Data",
        defaultValue: ${JSON.stringify(JSON.stringify(config.scheduleDays || [1, 2, 3, 4, 5]))},
        hidden: () => true,
    },
    enableAnalytics: {
        type: ControlType.Boolean,
        title: "Widget Analytics",
        defaultValue: ${Boolean(config.enableAnalytics !== false)},
            },
    customizationNote: {
        type: ControlType.Enum,
        title: "Note",
        options: ["explore"],
        optionTitles: ["Explore more customization with our plugin editor panel"],
        defaultValue: "explore",
        description: "Explore more customization with our plugin editor panel",
            },
})
`
}

export function buildControlPayload(config: ChatConfig) {
    return {
        canvasPreview: "modal",
        widgetMode: config.widgetMode || "modal",
        modalTheme: config.modalTheme || "whatsapp",
        modalCustomGradient: config.modalCustomGradient || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        modalTitle: config.modalTitle || "Hi there!",
        modalSubtitle: config.modalSubtitle || "Welcome to our live chat! Feel free to ask any questions.",
        modalResponseTime: config.modalResponseTime || "We typically reply within a few minutes",
        modalChatBubble: config.modalChatBubble || "We typically reply within a few minutes. How can we help you today?",
        modalStartChatText: config.modalStartChatText || "Start chat",
        position: config.position || "bottom-right",
        layout: config.layout || "stack",
        animation: config.animation || "pop",
        buttonColor: config.buttonColor || "#25D366",
        buttonShape: config.buttonShape || "circle",
        launcherText: "Chat",
        launcherIcon: config.launcherIcon || "chat",
        showLabels: Boolean(config.showLabels),
        mobileShowLabels: Boolean(config.mobileShowLabels ?? false),
        mobileOffsetX: Number(config.mobileOffsetX ?? 16),
        mobileOffsetY: Number(config.mobileOffsetY ?? 16),
        mobileCapChannels: Boolean(config.mobileCapChannels ?? true),
        closeOnOutsideClick: Boolean(config.closeOnOutsideClick ?? true),
        closeOnEscape: Boolean(config.closeOnEscape ?? true),
        closeAfterClick: Boolean(config.closeAfterClick ?? true),
        autoOpen: Boolean(config.autoOpen),
        greetingEnabled: Boolean(config.greetingEnabled),
        greetingText: config.greetingText || "Need help? Chat with us.",
        enableSound: Boolean(config.enableSound),
        showBadge: Boolean(config.showBadge),
        badgeText: config.badgeText || "1",
        enableAnalytics: Boolean(config.enableAnalytics !== false),
        scrollTriggerEnabled: Boolean(config.scrollTriggerEnabled),
        scrollTriggerPercent: Number(config.scrollTriggerPercent ?? 25),
        scrollTriggerTarget: config.scrollTriggerTarget || "launcher",
        exitIntentEnabled: Boolean(config.exitIntentEnabled),
        exitIntentAction: config.exitIntentAction || "modal",
        scheduleEnabled: Boolean(config.scheduleEnabled),
        scheduleStart: config.scheduleStart || "09:00",
        scheduleEnd: config.scheduleEnd || "18:00",
        scheduleOfflineAction: config.scheduleOfflineAction || "badge",
        scheduleOfflineText: config.scheduleOfflineText || "Back tomorrow at 9:00 AM",
        targetingEnabled: Boolean(config.targetingEnabled),
        showOn: config.showOn || "Every page",
        targetingMode: config.targetingMode || "show",
        targetingRules: config.targetingRules || "",
        whatsapp: config.channels.find((c) => c.id === "whatsapp")?.value || "",
        whatsappMessage: config.channels.find((c) => c.id === "whatsapp")?.message || "Hello! I would like to know more.",
        messenger: config.channels.find((c) => c.id === "messenger")?.value || "",
        telegram: config.channels.find((c) => c.id === "telegram")?.value || "",
        telegramMessage: config.channels.find((c) => c.id === "telegram")?.message || "Hello!",
        instagram: config.channels.find((c) => c.id === "instagram")?.value || "",
        tiktok: config.channels.find((c) => c.id === "tiktok")?.value || "",
        wechat: config.channels.find((c) => c.id === "wechat")?.value || "",
        viber: config.channels.find((c) => c.id === "viber")?.value || "",
        line: config.channels.find((c) => c.id === "line")?.value || "",
        signal: config.channels.find((c) => c.id === "signal")?.value || "",
        phone: config.channels.find((c) => c.id === "phone")?.value || "",
        sms: config.channels.find((c) => c.id === "sms")?.value || "",
        smsMessage: config.channels.find((c) => c.id === "sms")?.message || "",
        email: config.channels.find((c) => c.id === "email")?.value || "",
        emailSubject: config.channels.find((c) => c.id === "email")?.emailSubject || "",
        emailMessage: config.channels.find((c) => c.id === "email")?.message || "",
        discord: config.channels.find((c) => c.id === "discord")?.value || "",
        slack: config.channels.find((c) => c.id === "slack")?.value || "",
        teams: config.channels.find((c) => c.id === "teams")?.value || "",
        x: config.channels.find((c) => c.id === "x")?.value || "",
        linkedin: config.channels.find((c) => c.id === "linkedin")?.value || "",
        maps: config.channels.find((c) => c.id === "maps")?.value || "",
        custom: config.channels.find((c) => c.id === "custom")?.value || "",
        customLabel: config.channels.find((c) => c.id === "custom")?.label || "Custom",
        agentsData: JSON.stringify(config.agents || []),
        scheduleDaysData: JSON.stringify(config.scheduleDays || [1, 2, 3, 4, 5]),
    }
}

let debouncedCodeFileTimer: any = null
export function scheduleDebouncedCodeFileSync(config: ChatConfig) {
    if (debouncedCodeFileTimer) clearTimeout(debouncedCodeFileTimer)
    debouncedCodeFileTimer = setTimeout(async () => {
        await syncCodeFileNow(config)
    }, 2000)
}

export async function syncCodeFileNow(config: ChatConfig): Promise<void> {
    if (debouncedCodeFileTimer) {
        clearTimeout(debouncedCodeFileTimer)
        debouncedCodeFileTimer = null
    }
    try {
        if (typeof (framer as any).isAllowedTo === "function") {
            const allowed = await (framer as any).isAllowedTo("CodeFile.setFileContent")
            if (!allowed) return
        }
        const siteInfo = await getSiteInfo().catch(() => null)
        const code = generateComponentCode(
            config,
            siteInfo?.siteId,
            siteInfo?.siteUrl,
            cachedIsTrial,
            !cachedHasAccess
        )
        const files = await framer.getCodeFiles()
        const file = files.find((f) => f.name === "ChatBubbles.tsx" || f.name === "ChatBubbles" || f.name === "Chatfic")
        if (file) {
            await file.setFileContent(code)
        }
    } catch {}
}

/**
 * Live synchronizes changes made in the plugin shell immediately to existing canvas instances.
 * Crucial: Updates property controls via node.setAttributes for instant zero-flash sync,
 * and debounces or immediately syncs code file so published code is always in sync!
 */
export async function syncCanvasInstance(config: ChatConfig, immediateCodeSync: boolean = false): Promise<boolean> {
    try {
        if (typeof (framer as any).isAllowedTo === "function") {
            try {
                await (framer as any).isAllowedTo("setAttributes", "getNodesWithType", "getNode")
            } catch {}
        }
        const instances = (await framer.getNodesWithType("ComponentInstanceNode")) as any[]
        const chatBubblesNodes = instances?.filter(isChatBubblesInstance) || []

        const controlPayload = buildControlPayload(config)

        if (chatBubblesNodes.length > 0) {
            for (const node of chatBubblesNodes) {
                if (typeof node.setAttributes === "function") {
                    await node.setAttributes({
                        controls: controlPayload,
                    })
                }
            }
        }

        if (immediateCodeSync) {
            await syncCodeFileNow(config)
        } else {
            scheduleDebouncedCodeFileSync(config)
        }
        return true
    } catch {
        return false
    }
}

export async function insertCanvasComponent(
    config: ChatConfig,
    hasAccess: boolean = cachedHasAccess,
    isTrial: boolean = cachedIsTrial
): Promise<{ success: boolean; message: string }> {
    cachedHasAccess = hasAccess
    cachedIsTrial = isTrial
    const siteInfo = await getSiteInfo().catch(() => null)
    const code = generateComponentCode(
        config,
        siteInfo?.siteId,
        siteInfo?.siteUrl,
        isTrial,
        !hasAccess
    )
    const fileName = "ChatBubbles.tsx"

    try {
        if (typeof (framer as any).isAllowedTo === "function") {
            try {
                await (framer as any).isAllowedTo(
                    "CodeFile.setFileContent",
                    "createCodeFile",
                    "addComponentInstance",
                    "setSelection",
                    "setAttributes",
                    "getNodesWithType",
                    "getNode",
                    "setParent",
                    "removeNodes2",
                    "Node.remove"
                )
            } catch {}
        }
        const files = await framer.getCodeFiles()
        let file = files.find((f) => f.name === fileName || f.name === "ChatBubbles" || f.name === "Chatfic")

        if (file) {
            await file.setFileContent(code)
        } else {
            file = await framer.createCodeFile(fileName, code, { editViaPlugin: true })
        }

        const controlPayload = buildControlPayload(config)

        // Find all web pages and design pages in the project
        const webPages = ((await framer.getNodesWithType("WebPageNode")) as any[]) || []
        const designPages = ((await framer.getNodesWithType("DesignPageNode")) as any[]) || []
        const allPages = [...webPages, ...designPages]

        // Find all existing Chat Bubbles instances in the project
        const existingInstances = ((await framer.getNodesWithType("ComponentInstanceNode")) as any[]) || []
        const existingNodes = existingInstances.filter(isChatBubblesInstance)

        const componentExport = file.exports.find((exp) => exp.type === "component")
        if (!componentExport || !("insertURL" in componentExport)) {
            return {
                success: true,
                message: "Chat Bubbles component created in your Code Assets! You can drag it onto any page.",
            }
        }

        const targetShowOn = config.showOn || "Every page"

        let targetPages: any[] = []
        if (targetShowOn === "Every page") {
            targetPages = allPages
        } else if (targetShowOn === "Home page") {
            const homePage = allPages.find((p: any) => {
                if ("path" in p && p.path) return p.path === "/" || p.path === ""
                if ("name" in p && p.name) return p.name.toLowerCase() === "home" || p.name.toLowerCase() === "index"
                return false
            }) || allPages[0]
            if (homePage) targetPages = [homePage]
        } else if (targetShowOn === "custom") {
            const rawRules = String(config.targetingRules || "")
                .split(",")
                .flatMap((part: string) => part.split(String.fromCharCode(10)))
                .flatMap((part: string) => part.split(";"))
                .map((r) => r.trim().toLowerCase())
                .filter(Boolean)
            if (rawRules.length === 0) {
                targetPages = allPages
            } else {
                targetPages = allPages.filter((p: any) => {
                    const path = (("path" in p && p.path) ? p.path : ("/" + (p.name || ""))).toLowerCase()
                    return rawRules.some((rule) => {
                        if (rule === "*" || rule === "/*") return true
                        const clean = rule.startsWith("/") ? rule : "/" + rule
                        if (clean === path) return true
                        if (clean.endsWith("/*") && path.startsWith(clean.slice(0, -2) + "/")) return true
                        if (clean.endsWith("*") && path.startsWith(clean.slice(0, -1))) return true
                        return false
                    })
                })
            }
        } else {
            const cleanTarget = targetShowOn.toLowerCase().replace(/^\/+/, "")
            const targetPage = allPages.find((p: any) => {
                if ("path" in p && p.path) {
                    const cleanP = String(p.path).toLowerCase().replace(/^\/+/, "")
                    if (p.path === targetShowOn || cleanP === cleanTarget) return true
                }
                if ("name" in p && p.name) {
                    const cleanN = String(p.name).toLowerCase().replace(/^\/+/, "")
                    if (p.name === targetShowOn || ("/" + cleanN) === targetShowOn || cleanN === cleanTarget) return true
                }
                if ("id" in p && p.id === targetShowOn) return true
                return false
            })
            if (targetPage) {
                targetPages = [targetPage]
            } else {
                try {
                    const selection = await framer.getSelection()
                    if (selection && selection.length > 0) {
                        let currentId = selection[0].id
                        while (currentId) {
                            const node = (await framer.getNode(currentId)) as any
                            if (!node) break
                            if (node.type === "WebPageNode" || node.type === "DesignPageNode") {
                                targetPages = [node]
                                break
                            }
                            currentId = node.parentId
                        }
                    }
                } catch {}
            }
        }

        // Map which pages already contain a Chat Bubbles instance
        const nodePageMap = new Map<any, { pageId: string | null; pagePath: string }>()
        const pagesWithThisWidget = new Set<string>()

        for (const inst of existingNodes) {
            let currentId = inst.id
            let pageId: string | null = null
            let pagePath = "/"
            while (currentId) {
                const node = (await framer.getNode(currentId)) as any
                if (!node) break
                if (node.type === "WebPageNode" || node.type === "DesignPageNode") {
                    pageId = node.id
                    pagePath = ("path" in node && node.path) ? node.path : ("/" + (node.name || "").replace(/^\/+/, ""))
                    break
                }
                currentId = node.parentId
            }
            if (pageId) {
                pagesWithThisWidget.add(pageId)
            }
            nodePageMap.set(inst, { pageId, pagePath })
        }

        // Keep all existing instances; their runtime targeting hides them on non-matching pages
        const remainingNodes: any[] = [...existingNodes]

        // Insert instances on any target pages missing the widget
        const missingPages = targetPages.filter((p) => !pagesWithThisWidget.has(p.id))
        let newlyInsertedCount = 0
        for (const p of missingPages) {
            const pagePath = ("path" in p && p.path) ? p.path : ("/" + (p.name || "").replace(/^\/+/, ""))
            try {
                const instance = (await framer.addComponentInstance({
                    url: componentExport.insertURL,
                    parentId: p.id,
                    attributes: {
                        controls: controlPayload,
                    },
                } as any)) as any
                if (instance?.id) {
                    remainingNodes.push(instance)
                    nodePageMap.set(instance, { pageId: p.id, pagePath })
                    pagesWithThisWidget.add(p.id)
                    newlyInsertedCount++
                }
            } catch (err) {
                console.warn("[ChatBubbles] Failed to insert component onto page:", p.name || p.id, err)
            }
        }

        // Fallback: If no pages exist in project or couldn't insert into page, insert onto canvas root/selection
        if (remainingNodes.length === 0) {
            let fallbackParentId: string | undefined = undefined
            try {
                const selection = await framer.getSelection()
                if (selection && selection.length > 0) {
                    fallbackParentId = selection[0].id
                }
            } catch {}
            const instance = (await framer.addComponentInstance({
                url: componentExport.insertURL,
                parentId: fallbackParentId,
                attributes: {
                    controls: controlPayload,
                },
            } as any)) as any
            if (instance?.id) {
                remainingNodes.push(instance)
                newlyInsertedCount++
            }
        }

        // Update control properties on all remaining instances, preserving their canvasPagePath!
        for (const node of remainingNodes) {
            const pageInfo = nodePageMap.get(node)
            const pagePath = pageInfo?.pagePath || "/"
            if (typeof node.setAttributes === "function") {
                await node.setAttributes({
                    controls: {
                        ...controlPayload,
                        canvasPagePath: pagePath,
                    },
                })
            }
        }

        if (remainingNodes[0]?.id) {
            try {
                await framer.setSelection([remainingNodes[0].id])
            } catch {}
        }

        let feedbackMsg = "Chat Bubbles component updated on canvas!"
        if (newlyInsertedCount > 0) {
            if (targetShowOn === "Every page") {
                feedbackMsg = `Chat Bubbles component inserted onto ${newlyInsertedCount} page(s)!`
            } else {
                feedbackMsg = `Chat Bubbles component inserted on ${targetShowOn}!`
            }
        } else if (remainingNodes.length > 0) {
            feedbackMsg = targetShowOn === "Every page"
                ? "Chat Bubbles component updated across your pages!"
                : `Chat Bubbles component targeting updated to ${targetShowOn}!`
        }

        return {
            success: true,
            message: feedbackMsg,
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to insert component onto canvas.",
        }
    }
}

export function isChatBubblesInstance(node: any): boolean {
    if (!node) return false
    if (node.componentName === "ChatBubbles" || node.componentName === "Chatfic") return true
    if (typeof node.name === "string" && (node.name.includes("ChatBubbles") || node.name.includes("Chatfic"))) return true
    if (typeof node.insertURL === "string" && (node.insertURL.includes("ChatBubbles") || node.insertURL.includes("Chatfic"))) return true
    if (typeof node.componentIdentifier === "string" && (node.componentIdentifier.includes("ChatBubbles") || node.componentIdentifier.includes("Chatfic"))) return true
    return false
}

export const isChatficInstance = isChatBubblesInstance

export async function getCanvasInstancesCount(): Promise<number> {
    try {
        const instances = (await framer.getNodesWithType("ComponentInstanceNode")) as any[]
        if (!instances) return 0
        return instances.filter(isChatBubblesInstance).length
    } catch {
        return 0
    }
}

export async function removeAllCanvasInstances(): Promise<number> {
    try {
        const instances = (await framer.getNodesWithType("ComponentInstanceNode")) as any[]
        if (!instances || instances.length === 0) return 0
        let removed = 0
        for (const inst of instances) {
            if (isChatBubblesInstance(inst)) {
                if (typeof inst.remove === "function") {
                    await inst.remove()
                    removed++
                }
            }
        }
        return removed
    } catch (e) {
        console.warn("Failed to remove canvas instances:", e)
        return 0
    }
}

export { removeAllCanvasInstances as removeCanvasInstances }

