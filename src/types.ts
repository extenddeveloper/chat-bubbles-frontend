export type ChannelId =
    | "whatsapp"
    | "messenger"
    | "instagram"
    | "telegram"
    | "tiktok"
    | "wechat"
    | "viber"
    | "line"
    | "signal"
    | "phone"
    | "sms"
    | "email"
    | "discord"
    | "slack"
    | "teams"
    | "x"
    | "linkedin"
    | "maps"
    | "custom"

export type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left"
export type WidgetLayout = "stack" | "grid" | "horizontal"
export type ButtonShape = "circle" | "rounded" | "pill"
export type AnimationPreset = "none" | "pop" | "bounce" | "pulse" | "slide"
export type IconStyle = "brand" | "simple"
export type WidgetMode = "modal" | "buttons"
export type ModalTheme = "whatsapp" | "messenger" | "telegram" | "instagram" | "tiktok" | "wechat" | "dark" | "custom"
export type LauncherIcon = "chat" | "whatsapp" | "messenger" | "telegram" | "instagram" | "phone" | "email" | "support"

export interface ChatChannel {
    id: ChannelId
    enabled: boolean
    label: string
    value: string
    message?: string
    color: string
    openInNewTab: boolean
}

export interface ChatAgent {
    id: string
    name: string
    role: string
    avatar: string
    channelId: ChannelId
    value?: string
    message?: string
    online?: boolean
}

export interface ChatConfig {
    enabled: boolean
    widgetMode: WidgetMode
    modalTheme: ModalTheme
    modalTitle: string
    modalSubtitle: string
    modalResponseTime: string
    modalChatBubble: string
    modalStartChatText: string
    modalCustomGradient: string
    agents: ChatAgent[]
    channels: ChatChannel[]
    position: WidgetPosition
    layout: WidgetLayout
    buttonShape: ButtonShape
    launcherIcon: LauncherIcon
    animation: AnimationPreset
    iconStyle: IconStyle
    buttonSize: number
    iconSize: number
    gap: number
    offsetX: number
    offsetY: number
    background: string
    buttonColor: string
    labelColor: string
    labelBackground: string
    panelBackground: string
    panelText: string
    shadow: string
    showLabels: boolean
    showChannelNames: boolean
    showBadge: boolean
    badgeText: string
    greetingEnabled: boolean
    greetingText: string
    greetingDelay: number
    autoOpen: boolean
    autoOpenDelay: number
    enableSound?: boolean
    enableAnalytics?: boolean
    openInNewTab?: boolean
    closeAfterClick: boolean
    closeOnOutsideClick: boolean
    closeOnEscape: boolean
    mobileShowLabels: boolean
    mobileOffsetX: number
    mobileOffsetY: number
    mobileCapChannels?: boolean
    ariaLabel: string
    // Behavioral Triggers & Smart Display
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
    targetingMode?: "show" | "hide"
    targetingRules?: string
}
