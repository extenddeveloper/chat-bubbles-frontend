import type { ChatAgent, ChatChannel, ChatConfig, ModalTheme } from "../types"
import { sanitizeConfig } from "./sanitize"

export const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
]

export const MODAL_THEME_GRADIENTS: Record<ModalTheme, string> = {
    whatsapp: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    messenger: "linear-gradient(135deg, #0084FF 0%, #00C6FF 100%)",
    telegram: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
    instagram: "linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)",
    tiktok: "linear-gradient(135deg, #111111 0%, #1f2937 60%, #FE2C55 100%)",
    wechat: "linear-gradient(135deg, #07C160 0%, #048843 100%)",
    dark: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    custom: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
}

export const DEFAULT_CHANNELS: ChatChannel[] = [
    { id: "whatsapp", enabled: true, label: "WhatsApp", value: "", message: "Hello! I'd like to know more.", color: "#25D366", openInNewTab: true },
    { id: "messenger", enabled: true, label: "Messenger", value: "", color: "#0084FF", openInNewTab: true },
    { id: "instagram", enabled: false, label: "Instagram", value: "", color: "#E1306C", openInNewTab: true },
    { id: "telegram", enabled: true, label: "Telegram", value: "", message: "Hello!", color: "#229ED9", openInNewTab: true },
    { id: "tiktok", enabled: false, label: "TikTok", value: "", color: "#111111", openInNewTab: true },
    { id: "wechat", enabled: false, label: "WeChat", value: "", color: "#07C160", openInNewTab: true },
    { id: "viber", enabled: false, label: "Viber", value: "", color: "#7360F2", openInNewTab: true },
    { id: "line", enabled: false, label: "LINE", value: "", color: "#06C755", openInNewTab: true },
    { id: "signal", enabled: false, label: "Signal", value: "", color: "#3A76F0", openInNewTab: true },
    { id: "phone", enabled: false, label: "Phone", value: "", color: "#111827", openInNewTab: false },
    { id: "sms", enabled: false, label: "SMS", value: "", message: "Hello! I have a question about {title}.", color: "#10B981", openInNewTab: false },
    { id: "email", enabled: false, label: "Email", value: "", color: "#EA4335", openInNewTab: false },
    { id: "discord", enabled: false, label: "Discord", value: "", color: "#5865F2", openInNewTab: true },
    { id: "slack", enabled: false, label: "Slack", value: "", color: "#4A154B", openInNewTab: true },
    { id: "teams", enabled: false, label: "Microsoft Teams", value: "", color: "#6264A7", openInNewTab: true },
    { id: "x", enabled: false, label: "X (Twitter)", value: "", color: "#000000", openInNewTab: true },
    { id: "linkedin", enabled: false, label: "LinkedIn", value: "", color: "#0A66C2", openInNewTab: true },
    { id: "maps", enabled: false, label: "Google Maps", value: "", color: "#EA4335", openInNewTab: true },
    { id: "custom", enabled: false, label: "Custom", value: "", color: "#111827", openInNewTab: true },
]

export const DEFAULT_AGENTS: ChatAgent[] = [
    {
        id: "agent-1",
        name: "Alex",
        role: "Support Manager",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        channelId: "whatsapp",
        online: true,
    },
    {
        id: "agent-2",
        name: "Sarah",
        role: "Customer Support",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        channelId: "messenger",
        online: true,
    },
    {
        id: "agent-3",
        name: "David",
        role: "Technical Team",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        channelId: "telegram",
        online: true,
    },
]

export const DEFAULT_CONFIG: ChatConfig = {
    enabled: true,
    widgetMode: "modal",
    modalTheme: "whatsapp",
    modalTitle: "Hi there!",
    modalSubtitle: "Welcome to our live chat! Feel free to ask any questions.",
    modalResponseTime: "We typically reply within a few minutes",
    modalChatBubble: "We typically reply within a few minutes. How can we help you today?",
    modalStartChatText: "Start chat",
    modalCustomGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    agents: DEFAULT_AGENTS,
    channels: DEFAULT_CHANNELS,
    position: "bottom-right",
    layout: "stack",
    buttonShape: "circle",
    launcherIcon: "chat",
    animation: "pop",
    iconStyle: "brand",
    buttonSize: 58,
    iconSize: 26,
    gap: 12,
    offsetX: 24,
    offsetY: 24,
    background: "#ffffff",
    buttonColor: "#25D366",
    labelColor: "#ffffff",
    labelBackground: "#111827",
    panelBackground: "#ffffff",
    panelText: "#111827",
    shadow: "0 16px 40px rgba(0,0,0,.18)",
    showLabels: true,
    showChannelNames: true,
    showBadge: true,
    badgeText: "1",
    greetingEnabled: true,
    greetingText: "Need help? Chat with us.",
    greetingDelay: 2500,
    autoOpen: false,
    autoOpenDelay: 1200,
    enableSound: false,
    enableAnalytics: true,
    openInNewTab: true,
    closeAfterClick: true,
    closeOnOutsideClick: true,
    closeOnEscape: true,
    mobileShowLabels: false,
    mobileOffsetX: 16,
    mobileOffsetY: 16,
    mobileCapChannels: true,
    ariaLabel: "Open chat options",
    scrollTriggerEnabled: false,
    scrollTriggerPercent: 25,
    scrollTriggerTarget: "launcher",
    exitIntentEnabled: false,
    exitIntentAction: "modal",
    scheduleEnabled: false,
    scheduleDays: [1, 2, 3, 4, 5],
    scheduleStart: "09:00",
    scheduleEnd: "18:00",
    scheduleOfflineAction: "badge",
    scheduleOfflineText: "Back tomorrow at 9:00 AM",
    targetingEnabled: false,
    targetingMode: "show",
    targetingRules: "",
}

export function normalizeConfig(input: Partial<ChatConfig> | null | undefined): ChatConfig {
    const source = input ?? {}
    const savedChannelsMap = new Map((source.channels || []).map((channel) => [channel.id, channel]))
    const defaultIds = new Set(DEFAULT_CHANNELS.map((c) => c.id))
    const extraChannels = (source.channels || []).filter((c) => !defaultIds.has(c.id))

    // Always ensure all 19 default platforms exist in their canonical order, overlaying saved user configs
    const channels = [
        ...DEFAULT_CHANNELS.map((defaultChannel) => {
            const saved = savedChannelsMap.get(defaultChannel.id)
            return saved ? { ...defaultChannel, ...saved } : defaultChannel
        }),
        ...extraChannels,
    ]

    const agents = Array.isArray(source.agents) && source.agents.length
        ? source.agents
        : DEFAULT_AGENTS

    return sanitizeConfig({
        ...DEFAULT_CONFIG,
        ...source,
        channels,
        agents,
    })
}

export function cloneDefaultConfig(): ChatConfig {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ChatConfig
}
