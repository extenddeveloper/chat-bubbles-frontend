import type { ChannelId, ChatAgent, ChatChannel, ChatConfig, ModalTheme } from "../types"
import { AVATAR_PRESETS, MODAL_THEME_GRADIENTS } from "./config"

/**
 * Strips HTML tags, removes dangerous control characters, and truncates to maxLength.
 * Preserves normal whitespace so users can type spaces in input fields.
 */
export function sanitizeText(value: unknown, maxLength = 250, fallback = ""): string {
    if (value === null || value === undefined) return fallback
    const str = String(value)
        // Remove HTML tags
        .replace(/<[^>]*>/g, "")
        // Remove dangerous control characters (excluding standard whitespace like space and tab)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")

    return str.slice(0, maxLength)
}

/**
 * Strips HTML tags from multiline text, preserves standard newlines and whitespace, and truncates to maxLength.
 */
export function sanitizeMultilineText(value: unknown, maxLength = 600, fallback = ""): string {
    if (value === null || value === undefined) return fallback
    const str = String(value)
        // Remove HTML tags
        .replace(/<[^>]*>/g, "")
        // Remove control characters except newline and tab
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")

    return str.slice(0, maxLength)
}

/**
 * Validates and sanitizes a URL to ensure safe protocols.
 * Explicitly rejects javascript:, data:, vbscript:, and file: schemes.
 */
export function sanitizeUrl(
    value: unknown,
    allowedProtocols: string[] = ["http:", "https:"],
    fallback = ""
): string {
    if (typeof value !== "string") return fallback
    const trimmed = value.trim()
    if (!trimmed) return fallback

    // Disallow dangerous pseudo-protocols even if hidden by whitespace or control chars
    const lower = trimmed.toLowerCase().replace(/[\s\u0000-\u001F]/g, "")
    if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:") ||
        lower.startsWith("vbscript:") ||
        lower.startsWith("file:")
    ) {
        return fallback
    }

    try {
        // If string does not contain a scheme, attempt to parse with https:// prefix if it looks like a domain
        let urlToParse = trimmed
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
            urlToParse = "https://" + trimmed
        }

        const parsed = new URL(urlToParse)
        if (allowedProtocols.includes(parsed.protocol)) {
            return parsed.toString()
        }
    } catch {
        // Invalid URL structure
    }

    return fallback
}

/**
 * Validates avatar image URLs. Strictly requires http: or https: protocol.
 * Falls back to the default avatar preset if invalid.
 */
export function sanitizeAvatarUrl(value: unknown, fallback: string = AVATAR_PRESETS[0]): string {
    if (typeof value !== "string" || !value.trim()) return fallback
    const trimmed = value.trim()

    // Allow preset references (e.g. "p:0")
    if (/^p:\d+$/.test(trimmed)) {
        return trimmed
    }

    // Allow safe data:image/ URIs for uploaded image previews/fallbacks
    if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
        return trimmed
    }

    const safeUrl = sanitizeUrl(trimmed, ["http:", "https:"], "")
    return safeUrl || fallback
}

/**
 * Sanitizes phone numbers: allows only +, digits, spaces, hyphens, and parentheses.
 */
export function sanitizePhone(value: unknown, maxLength = 30): string {
    if (typeof value !== "string") return ""
    return value
        .replace(/<[^>]*>/g, "")
        .replace(/[^\d+\s\-()]/g, "")
        .trim()
        .slice(0, maxLength)
}

/**
 * Sanitizes social handles (Telegram, Instagram, TikTok, Messenger, LINE).
 * Strips HTML tags, leading '@', and disallows characters outside [a-zA-Z0-9._-].
 */
export function sanitizeHandle(value: unknown, maxLength = 60): string {
    if (typeof value !== "string") return ""
    return value
        .trim()
        .replace(/<[^>]*>/g, "")
        .replace(/^@+/, "")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .slice(0, maxLength)
}

/**
 * Sanitizes email addresses: strips spaces, control chars, and angle brackets.
 */
export function sanitizeEmail(value: unknown, maxLength = 100): string {
    if (typeof value !== "string") return ""
    let email = value.trim().replace(/^mailto:/i, "")
    email = email.replace(/[^a-zA-Z0-9._%+\-@]/g, "").slice(0, maxLength)
    return email
}

/**
 * Validates and sanitizes CSS colors (hex, rgb, rgba, hsl, hsla, or standard safe keywords).
 */
export function sanitizeColor(value: unknown, fallback = "#25D366"): string {
    if (typeof value !== "string") return fallback
    const trimmed = value.trim()

    // Hex color: #fff or #ffffff or #ffffffff
    if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
        return trimmed
    }

    // rgb / rgba / hsl / hsla
    if (/^(rgb|rgba|hsl|hsla)\(\s*[\d.%\s,/-]+\s*\)$/i.test(trimmed)) {
        return trimmed
    }

    // Standard safe named colors
    if (/^[a-zA-Z]{3,20}$/.test(trimmed)) {
        return trimmed.toLowerCase()
    }

    return fallback
}

/**
 * Validates CSS gradient strings to prevent stylesheet/expression injection.
 */
export function sanitizeCssGradient(value: unknown, fallback: string = MODAL_THEME_GRADIENTS.whatsapp): string {
    if (typeof value !== "string") return fallback
    const trimmed = value.trim()

    // Must start with linear-gradient or radial-gradient
    if (!/^(linear-gradient|radial-gradient)\(/.test(trimmed)) {
        return fallback
    }

    // Reject dangerous keywords that could break CSS or execute scripts
    if (/[;{}"'<>`]|url\(|expression\(|javascript:/i.test(trimmed)) {
        return fallback
    }

    return trimmed
}

/**
 * Safely parses and clamps numeric values between min and max.
 */
export function sanitizeNumber(value: unknown, min: number, max: number, defaultValue: number): number {
    const num = Number(value)
    if (!Number.isFinite(num)) return defaultValue
    return Math.min(Math.max(num, min), max)
}

/**
 * Serializes data to JSON while safely escaping HTML/script characters.
 * Completely prevents script tag breakout (e.g. </script>) when embedded in HTML.
 */
export function safeJsonStringify(value: unknown): string {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029")
}

/**
 * Resolves a safe, validated destination URL for a given messaging channel.
 */
export function resolveSafeChannelUrl(channelId: ChannelId, rawValue: string, rawMessage?: string): string {
    const value = String(rawValue || "").trim()
    const message = sanitizeText(rawMessage, 300, "")
    const encode = (s: string) => encodeURIComponent(s)

    switch (channelId) {
        case "whatsapp": {
            const cleanDigits = value.replace(/[^0-9]/g, "")
            return cleanDigits
                ? "https://wa.me/" + cleanDigits + (message ? "?text=" + encode(message) : "")
                : "https://wa.me/"
        }
        case "messenger": {
            const handle = sanitizeHandle(value)
            return handle ? "https://m.me/" + handle : "https://m.me/"
        }
        case "instagram": {
            const handle = sanitizeHandle(value)
            return handle ? "https://instagram.com/" + handle : "https://instagram.com/"
        }
        case "telegram": {
            const handle = sanitizeHandle(value)
            return handle
                ? "https://t.me/" + handle + (message ? "?text=" + encode(message) : "")
                : "https://t.me/"
        }
        case "tiktok": {
            const handle = sanitizeHandle(value)
            return handle ? "https://www.tiktok.com/@" + handle : "https://www.tiktok.com/"
        }
        case "wechat": {
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return sanitizeUrl(value, ["http:", "https:"], "https://u.wechat.com/")
            }
            const handle = sanitizeHandle(value)
            return handle ? "https://u.wechat.com/" + handle : "https://u.wechat.com/"
        }
        case "viber": {
            const cleanDigits = value.replace(/[^0-9+]/g, "")
            return cleanDigits ? "viber://chat?number=" + encode(cleanDigits) : "viber://chat"
        }
        case "line": {
            const handle = sanitizeHandle(value)
            return handle ? "https://line.me/R/ti/p/~" + handle : "https://line.me/"
        }
        case "signal": {
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return sanitizeUrl(value, ["http:", "https:"], "https://signal.me/")
            }
            const handle = sanitizeHandle(value)
            return handle ? "https://signal.me/#p/" + encode(handle) : "https://signal.me/"
        }
        case "phone": {
            const cleanDigits = value.replace(/[^0-9+]/g, "")
            return cleanDigits ? "tel:" + cleanDigits : "tel:"
        }
        case "sms": {
            const cleanDigits = value.replace(/[^0-9+]/g, "")
            return cleanDigits
                ? "sms:" + cleanDigits + (message ? "?body=" + encode(message) : "")
                : "sms:"
        }
        case "email": {
            const cleanEmail = sanitizeEmail(value)
            return cleanEmail ? "mailto:" + cleanEmail : "mailto:"
        }
        case "discord": {
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return sanitizeUrl(value, ["http:", "https:"], "https://discord.com/")
            }
            const handle = sanitizeHandle(value)
            return handle ? "https://discord.gg/" + handle : "https://discord.com/"
        }
        case "slack": {
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return sanitizeUrl(value, ["http:", "https:"], "https://slack.com/")
            }
            const clean = sanitizeText(value, 120, "")
            return clean ? "https://" + clean : "https://slack.com/"
        }
        case "teams": {
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return sanitizeUrl(value, ["http:", "https:"], "https://teams.microsoft.com/")
            }
            const clean = sanitizeText(value, 120, "")
            return clean ? "https://teams.microsoft.com/l/chat/0/0?users=" + encode(clean) : "https://teams.microsoft.com/"
        }
        case "x": {
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return sanitizeUrl(value, ["http:", "https:"], "https://x.com/")
            }
            const handle = sanitizeHandle(value)
            return handle ? "https://x.com/" + handle : "https://x.com/"
        }
        case "linkedin": {
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return sanitizeUrl(value, ["http:", "https:"], "https://www.linkedin.com/")
            }
            const clean = sanitizeText(value, 120, "").replace(/^@+/, "")
            if (clean.startsWith("in/") || clean.startsWith("company/")) {
                return "https://www.linkedin.com/" + clean
            }
            return clean ? "https://www.linkedin.com/in/" + encode(clean) : "https://www.linkedin.com/"
        }
        case "maps": {
            if (value.startsWith("http://") || value.startsWith("https://")) {
                return sanitizeUrl(value, ["http:", "https:"], "https://maps.google.com/")
            }
            const query = sanitizeText(value, 200, "")
            return query ? "https://www.google.com/maps/search/?api=1&query=" + encode(query) : "https://maps.google.com/"
        }
        case "custom": {
            return sanitizeUrl(value, ["http:", "https:"], "")
        }
        default: {
            return sanitizeUrl(value, ["http:", "https:"], "")
        }
    }
}

/**
 * Sanitizes an individual channel configuration object.
 */
export function sanitizeChannel(channel: ChatChannel): ChatChannel {
    return {
        id: channel.id,
        enabled: Boolean(channel.enabled),
        label: sanitizeText(channel.label ?? channel.id, 40, channel.id),
        value: sanitizeText(channel.value, 150, ""),
        message: channel.message ? sanitizeMultilineText(channel.message, 300, "") : undefined,
        color: sanitizeColor(channel.color, "#25D366"),
        openInNewTab: channel.openInNewTab !== false,
    }
}

/**
 * Sanitizes an individual agent configuration object.
 */
export function sanitizeAgent(agent: ChatAgent): ChatAgent {
    const cleanValue = sanitizeText(agent.value, 150, "")
    const cleanMessage = agent.message ? sanitizeMultilineText(agent.message, 300, "") : undefined
    return {
        id: sanitizeText(agent.id, 50, "agent-" + Date.now()),
        name: sanitizeText(agent.name ?? "Support Agent", 60, "Support Agent"),
        role: sanitizeText(agent.role ?? "Customer Support", 80, "Customer Support"),
        avatar: sanitizeAvatarUrl(agent.avatar),
        channelId: agent.channelId || "whatsapp",
        value: cleanValue || undefined,
        message: cleanMessage,
        online: agent.online !== false,
    }
}

/**
 * Fully validates and sanitizes an entire ChatConfig object.
 */
export function sanitizeConfig(config: Partial<ChatConfig>): ChatConfig {
    const rawTheme = config.modalTheme as ModalTheme
    const validThemes: ModalTheme[] = [
        "whatsapp",
        "messenger",
        "telegram",
        "instagram",
        "tiktok",
        "wechat",
        "dark",
        "custom",
    ]
    const modalTheme: ModalTheme = validThemes.includes(rawTheme) ? rawTheme : "whatsapp"

    const validPositions = ["bottom-right", "bottom-left", "top-right", "top-left"] as const
    const position = validPositions.includes(config.position as any) ? config.position! : "bottom-right"

    const validShapes = ["circle", "rounded", "pill"] as const
    const buttonShape = validShapes.includes(config.buttonShape as any) ? config.buttonShape! : "circle"

    const validIcons = ["chat", "whatsapp", "messenger", "telegram", "instagram", "phone", "email", "support"] as const
    const launcherIcon = validIcons.includes(config.launcherIcon as any) ? config.launcherIcon! : "chat"

    const validLayouts = ["stack", "grid", "horizontal"] as const
    const layout = validLayouts.includes(config.layout as any) ? config.layout! : "stack"

    const validAnimations = ["none", "pop", "bounce", "pulse", "slide"] as const
    const animation = validAnimations.includes(config.animation as any) ? config.animation! : "pop"

    const validModes = ["modal", "buttons"] as const
    const widgetMode = validModes.includes(config.widgetMode as any) ? config.widgetMode! : "modal"

    const channels = Array.isArray(config.channels)
        ? config.channels.map(sanitizeChannel)
        : []

    const agents = Array.isArray(config.agents)
        ? config.agents.map(sanitizeAgent)
        : []

    const validScrollTargets = ["launcher", "greeting"] as const
    const scrollTriggerTarget = validScrollTargets.includes(config.scrollTriggerTarget as any)
        ? (config.scrollTriggerTarget as "launcher" | "greeting")
        : "launcher"

    const validExitIntentActions = ["modal", "greeting"] as const
    const exitIntentAction = validExitIntentActions.includes(config.exitIntentAction as any)
        ? (config.exitIntentAction as "modal" | "greeting")
        : "modal"

    const validOfflineActions = ["badge", "hide"] as const
    const scheduleOfflineAction = validOfflineActions.includes(config.scheduleOfflineAction as any)
        ? (config.scheduleOfflineAction as "badge" | "hide")
        : "badge"

    const validTargetingModes = ["show", "hide"] as const
    const targetingMode = validTargetingModes.includes(config.targetingMode as any)
        ? (config.targetingMode as "show" | "hide")
        : "show"

    const scheduleDays = Array.isArray(config.scheduleDays)
        ? config.scheduleDays.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6)
        : [1, 2, 3, 4, 5]

    return {
        enabled: Boolean(config.enabled ?? true),
        widgetMode,
        modalTheme,
        modalTitle: sanitizeText(config.modalTitle, 100, "Hi there!"),
        modalSubtitle: sanitizeText(
            config.modalSubtitle,
            250,
            "Welcome to our live chat! Feel free to ask any questions."
        ),
        modalResponseTime: sanitizeText(
            config.modalResponseTime,
            60,
            "We typically reply within a few minutes"
        ),
        modalChatBubble: sanitizeMultilineText(
            config.modalChatBubble,
            500,
            "We typically reply within a few minutes. How can we help you today?"
        ),
        modalStartChatText: sanitizeText(config.modalStartChatText, 50, "Start chat"),
        modalCustomGradient: sanitizeCssGradient(
            config.modalCustomGradient,
            "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        ),
        agents,
        channels,
        position,
        layout,
        buttonShape,
        launcherIcon,
        animation,
        iconStyle: config.iconStyle === "simple" ? "simple" : "brand",
        buttonSize: sanitizeNumber(config.buttonSize, 36, 100, 58),
        iconSize: sanitizeNumber(config.iconSize, 16, 60, 26),
        gap: sanitizeNumber(config.gap, 0, 50, 12),
        offsetX: sanitizeNumber(config.offsetX, 0, 300, 24),
        offsetY: sanitizeNumber(config.offsetY, 0, 300, 24),
        background: sanitizeColor(config.background, "#ffffff"),
        buttonColor: sanitizeColor(config.buttonColor, "#25D366"),
        labelColor: sanitizeColor(config.labelColor, "#ffffff"),
        labelBackground: sanitizeColor(config.labelBackground, "#111827"),
        panelBackground: sanitizeColor(config.panelBackground, "#ffffff"),
        panelText: sanitizeColor(config.panelText, "#111827"),
        shadow: sanitizeText(config.shadow, 100, "0 16px 40px rgba(0,0,0,.18)"),
        showLabels: Boolean(config.showLabels ?? true),
        showChannelNames: Boolean(config.showChannelNames ?? true),
        showBadge: Boolean(config.showBadge ?? true),
        badgeText: sanitizeText(config.badgeText, 10, "1"),
        greetingEnabled: Boolean(config.greetingEnabled ?? true),
        greetingText: sanitizeText(config.greetingText, 200, "Need help? Chat with us."),
        greetingDelay: sanitizeNumber(config.greetingDelay, 0, 60000, 2500),
        autoOpen: Boolean(config.autoOpen ?? false),
        autoOpenDelay: sanitizeNumber(config.autoOpenDelay, 0, 60000, 1200),
        enableSound: Boolean(config.enableSound ?? false),
        enableAnalytics: Boolean(config.enableAnalytics ?? true),
        openInNewTab: Boolean(config.openInNewTab ?? true),
        closeAfterClick: Boolean(config.closeAfterClick ?? true),
        closeOnOutsideClick: Boolean(config.closeOnOutsideClick ?? true),
        closeOnEscape: Boolean(config.closeOnEscape ?? true),
        mobileShowLabels: Boolean(config.mobileShowLabels ?? false),
        mobileOffsetX: sanitizeNumber(config.mobileOffsetX, 0, 200, 16),
        mobileOffsetY: sanitizeNumber(config.mobileOffsetY, 0, 200, 16),
        mobileCapChannels: Boolean(config.mobileCapChannels ?? true),
        ariaLabel: sanitizeText(config.ariaLabel, 80, "Open chat options"),
        scrollTriggerEnabled: Boolean(config.scrollTriggerEnabled ?? false),
        scrollTriggerPercent: sanitizeNumber(config.scrollTriggerPercent, 1, 100, 25),
        scrollTriggerTarget,
        exitIntentEnabled: Boolean(config.exitIntentEnabled ?? false),
        exitIntentAction,
        scheduleEnabled: Boolean(config.scheduleEnabled ?? false),
        scheduleDays: scheduleDays.length > 0 ? scheduleDays : [1, 2, 3, 4, 5],
        scheduleStart: sanitizeText(config.scheduleStart, 10, "09:00"),
        scheduleEnd: sanitizeText(config.scheduleEnd, 10, "18:00"),
        scheduleOfflineAction,
        scheduleOfflineText: sanitizeText(config.scheduleOfflineText, 100, "Back tomorrow at 9:00 AM"),
        targetingEnabled: Boolean(config.targetingEnabled ?? false),
        targetingMode,
        targetingRules: sanitizeMultilineText(config.targetingRules, 1000, ""),
    }
}
