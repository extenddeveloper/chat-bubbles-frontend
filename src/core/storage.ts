import { framer } from "@framer/plugin"
import type { ChatConfig } from "../types"
import { AVATAR_PRESETS, DEFAULT_CHANNELS, normalizeConfig } from "./config"

const CONFIG_KEY = "scb_config_v1"
const INSTANCE_KEY = "scb_instance_installed_v1"

// Compact serializer: stores ONLY customized fields and short references
// Keeps total JSON well under 800 bytes, and chunks if size ever exceeds 1400 bytes
function compactConfig(config: ChatConfig): any {
    const defaultMap = new Map(DEFAULT_CHANNELS.map((d) => [d.id, d]))
    const channels = (config.channels || [])
        .filter((c) => {
            const def = defaultMap.get(c.id)
            if (!def) return true
            return (
                c.enabled !== def.enabled ||
                Boolean(c.value.trim()) ||
                Boolean(c.message && c.message.trim() !== (def.message || "")) ||
                c.color !== def.color
            )
        })
        .map((c) => ({
            id: c.id,
            enabled: c.enabled,
            value: c.value,
            ...(c.message ? { message: c.message } : {}),
            color: c.color,
        }))

    const agents = (config.agents || []).map((ag) => {
        let avatar = ag.avatar
        const presetIdx = AVATAR_PRESETS.indexOf(avatar)
        if (presetIdx !== -1) {
            avatar = "p:" + presetIdx
        }
        return {
            id: ag.id,
            name: ag.name,
            role: ag.role,
            avatar,
            channelId: ag.channelId,
            ...(ag.value ? { value: ag.value } : {}),
            ...(ag.message ? { message: ag.message } : {}),
            ...(ag.online !== undefined ? { online: ag.online } : {}),
        }
    })

    return {
        enabled: config.enabled,
        widgetMode: config.widgetMode,
        modalTheme: config.modalTheme,
        ...(config.modalCustomGradient ? { modalCustomGradient: config.modalCustomGradient } : {}),
        modalTitle: config.modalTitle,
        modalSubtitle: config.modalSubtitle,
        modalResponseTime: config.modalResponseTime,
        modalChatBubble: config.modalChatBubble,
        modalStartChatText: config.modalStartChatText,
        position: config.position,
        layout: config.layout,
        animation: config.animation,
        buttonShape: config.buttonShape,
        launcherIcon: config.launcherIcon,
        buttonSize: config.buttonSize,
        buttonColor: config.buttonColor,
        showBadge: config.showBadge,
        badgeText: config.badgeText,
        showLabels: config.showLabels,
        offsetX: config.offsetX,
        offsetY: config.offsetY,
        mobileShowLabels: config.mobileShowLabels,
        mobileOffsetX: config.mobileOffsetX,
        mobileOffsetY: config.mobileOffsetY,
        mobileCapChannels: config.mobileCapChannels,
        closeOnOutsideClick: config.closeOnOutsideClick,
        closeOnEscape: config.closeOnEscape,
        closeAfterClick: config.closeAfterClick,
        ariaLabel: config.ariaLabel,
        greetingEnabled: config.greetingEnabled,
        greetingText: config.greetingText,
        greetingDelay: config.greetingDelay,
        autoOpen: config.autoOpen,
        autoOpenDelay: config.autoOpenDelay,
        openInNewTab: config.openInNewTab,
        enableSound: config.enableSound,
        enableAnalytics: config.enableAnalytics,
        scrollTriggerEnabled: config.scrollTriggerEnabled,
        scrollTriggerPercent: config.scrollTriggerPercent,
        scrollTriggerTarget: config.scrollTriggerTarget,
        exitIntentEnabled: config.exitIntentEnabled,
        exitIntentAction: config.exitIntentAction,
        scheduleEnabled: config.scheduleEnabled,
        scheduleDays: config.scheduleDays,
        scheduleStart: config.scheduleStart,
        scheduleEnd: config.scheduleEnd,
        scheduleOfflineAction: config.scheduleOfflineAction,
        scheduleOfflineText: config.scheduleOfflineText,
        targetingEnabled: config.targetingEnabled,
        targetingMode: config.targetingMode,
        targetingRules: config.targetingRules,
        ...(config.widgetId ? { widgetId: config.widgetId } : {}),
        agents,
        channels,
    }
}

function decompactConfig(saved: any): Partial<ChatConfig> {
    if (!saved || typeof saved !== "object") return {}

    const agents = Array.isArray(saved.agents)
        ? saved.agents.map((ag: any) => {
              let avatar = ag.avatar
              if (typeof avatar === "string" && avatar.startsWith("p:")) {
                  const idx = parseInt(avatar.slice(2), 10)
                  if (!isNaN(idx) && AVATAR_PRESETS[idx]) {
                      avatar = AVATAR_PRESETS[idx]
                  }
              }
              return { ...ag, avatar }
          })
        : undefined

    return {
        ...saved,
        ...(agents ? { agents } : {}),
    }
}

async function ensurePermission(method: string): Promise<void> {
    try {
        if (typeof (framer as any).isAllowedTo === "function") {
            await (framer as any).isAllowedTo(method)
        }
    } catch {
        // Ignore check error
    }
}

export async function loadConfig(): Promise<ChatConfig> {
    try {
        await ensurePermission("getPluginData")
        const raw = await framer.getPluginData(CONFIG_KEY)
        if (!raw) return normalizeConfig(null)

        const parsed = JSON.parse(raw)
        // If legacy or current chunked metadata existed, reconstruct it
        if (parsed && typeof parsed.chunks === "number") {
            let fullJson = ""
            for (let i = 0; i < parsed.chunks; i++) {
                const chunk = await framer.getPluginData(`${CONFIG_KEY}_c${i}`)
                if (chunk) fullJson += chunk
            }
            if (fullJson) {
                return normalizeConfig(decompactConfig(JSON.parse(fullJson)))
            }
        }

        return normalizeConfig(decompactConfig(parsed))
    } catch (e) {
        console.warn("Could not load config from plugin data:", e)
        return normalizeConfig(null)
    }
}

export async function saveConfig(config: ChatConfig): Promise<void> {
    await ensurePermission("setPluginData")
    const sanitized = normalizeConfig(config)
    const compact = compactConfig(sanitized)
    const json = JSON.stringify(compact)

    const MAX_CHUNK_SIZE = 1400

    if (json.length <= MAX_CHUNK_SIZE) {
        // Direct save into CONFIG_KEY (under 1.4 kB, safely below 2 kB limit)
        await framer.setPluginData(CONFIG_KEY, json)

        // Purge any legacy chunks to immediately free storage
        for (let i = 0; i < 10; i++) {
            try {
                await framer.setPluginData(`${CONFIG_KEY}_c${i}`, null)
            } catch {
                // Ignore purge error
            }
        }
    } else {
        // Automatically slice into <= 1400 byte chunks so no single key exceeds Framer's 2 kB limit
        const chunks: string[] = []
        for (let i = 0; i < json.length; i += MAX_CHUNK_SIZE) {
            chunks.push(json.slice(i, i + MAX_CHUNK_SIZE))
        }

        for (let i = 0; i < chunks.length; i++) {
            await framer.setPluginData(`${CONFIG_KEY}_c${i}`, chunks[i])
        }

        // Store chunk count header in primary key
        await framer.setPluginData(CONFIG_KEY, JSON.stringify({ chunks: chunks.length }))

        // Purge any remaining stale chunks from previous larger saves
        for (let i = chunks.length; i < 10; i++) {
            try {
                await framer.setPluginData(`${CONFIG_KEY}_c${i}`, null)
            } catch {
                // Ignore purge error
            }
        }
    }
}

export async function getInstalledFlag(): Promise<boolean> {
    try {
        await ensurePermission("getPluginData")
        return (await framer.getPluginData(INSTANCE_KEY)) === "1"
    } catch {
        return false
    }
}

export async function setInstalledFlag(value: boolean): Promise<void> {
    try {
        await ensurePermission("setPluginData")
        await framer.setPluginData(INSTANCE_KEY, value ? "1" : "0")
    } catch (e) {
        console.warn("Could not set installed flag:", e)
    }
}
