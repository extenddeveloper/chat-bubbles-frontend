import type { ChatConfig } from "../types"
import { ICONS } from "./icons"
import { MODAL_THEME_GRADIENTS } from "../core/config"
import { resolveSafeChannelUrl, safeJsonStringify, sanitizeAvatarUrl } from "../core/sanitize"
import { SVG_AVATAR_PRESETS } from "../core/avatars"

const DEFAULT_FALLBACK_AVATAR = SVG_AVATAR_PRESETS[0]

const getUrl = resolveSafeChannelUrl

function buildChannelMap(config: ChatConfig): string {
    const channels = config.channels
        .filter((channel) => channel.enabled && channel.value.trim())
        .map((channel) => ({
            ...channel,
            icon: ICONS[channel.id] ?? ICONS.custom,
            url: getUrl(channel.id, channel.value, channel.message, channel.emailSubject),
        }))

    return safeJsonStringify(channels)
}

function buildAgentMap(config: ChatConfig): string {
    const channelMap = new Map(config.channels.map((c) => [c.id, c]))

    const agents = (config.agents && config.agents.length > 0 ? config.agents : [])
        .map((agent) => {
            const channel = channelMap.get(agent.channelId)
            const rawVal = agent.value || channel?.value || ""
            const rawMsg = agent.message || channel?.message || config.modalChatBubble || ""
            const rawSub = agent.emailSubject || channel?.emailSubject || ""
            return {
                id: agent.id,
                name: agent.name,
                role: agent.role,
                avatar: sanitizeAvatarUrl(agent.avatar),
                channelId: agent.channelId,
                color: channel?.color || "#25D366",
                icon: ICONS[agent.channelId] ?? ICONS.custom,
                url: getUrl(agent.channelId, rawVal, rawMsg, rawSub),
                value: rawVal,
                message: rawMsg,
                emailSubject: rawSub,
                online: agent.online !== false,
            }
        })

    return safeJsonStringify(agents)
}

export function buildWidgetCode(config: ChatConfig): string {
    const channelData = buildChannelMap(config)
    const agentData = buildAgentMap(config)
    const gradient = config.modalTheme === "custom" && config.modalCustomGradient
        ? config.modalCustomGradient
        : MODAL_THEME_GRADIENTS[config.modalTheme] || MODAL_THEME_GRADIENTS.whatsapp

    const settings = safeJsonStringify({
        enabled: config.enabled,
        widgetMode: config.widgetMode || "modal",
        modalTheme: config.modalTheme || "whatsapp",
        modalGradient: gradient,
        modalTitle: config.modalTitle || "Hi there!",
        modalSubtitle: config.modalSubtitle || "Welcome to our live chat! Feel free to ask any questions.",
        modalResponseTime: config.modalResponseTime || "We typically reply within a few minutes",
        modalChatBubble: config.modalChatBubble || "We typically reply within a few minutes. How can we help you today?",
        modalStartChatText: config.modalStartChatText || "Start chat",
        position: config.position,
        layout: config.layout,
        buttonShape: config.buttonShape,
        animation: config.animation,
        iconStyle: config.iconStyle,
        buttonSize: config.buttonSize,
        iconSize: config.iconSize,
        gap: config.gap,
        offsetX: config.offsetX,
        offsetY: config.offsetY,
        background: config.background,
        buttonColor: config.buttonColor,
        labelColor: config.labelColor,
        labelBackground: config.labelBackground,
        panelBackground: config.panelBackground,
        panelText: config.panelText,
        shadow: config.shadow,
        showLabels: config.showLabels,
        showChannelNames: config.showChannelNames,
        showBadge: config.showBadge,
        badgeText: config.badgeText,
        greetingEnabled: config.greetingEnabled,
        greetingText: config.greetingText,
        greetingDelay: config.greetingDelay,
        autoOpen: config.autoOpen,
        autoOpenDelay: config.autoOpenDelay,
        closeAfterClick: config.closeAfterClick,
        closeOnOutsideClick: config.closeOnOutsideClick,
        closeOnEscape: config.closeOnEscape,
        mobileShowLabels: config.mobileShowLabels,
        mobileOffsetX: config.mobileOffsetX,
        mobileOffsetY: config.mobileOffsetY,
        mobileCapChannels: config.mobileCapChannels ?? true,
        ariaLabel: config.ariaLabel,
        enableAnalytics: config.enableAnalytics !== false,
        scrollTriggerEnabled: Boolean(config.scrollTriggerEnabled),
        scrollTriggerPercent: Number(config.scrollTriggerPercent ?? 25),
        scrollTriggerTarget: config.scrollTriggerTarget || "launcher",
        exitIntentEnabled: Boolean(config.exitIntentEnabled),
        exitIntentAction: config.exitIntentAction || "modal",
        scheduleEnabled: Boolean(config.scheduleEnabled),
        scheduleDays: Array.isArray(config.scheduleDays) ? config.scheduleDays : [1, 2, 3, 4, 5],
        scheduleStart: config.scheduleStart || "09:00",
        scheduleEnd: config.scheduleEnd || "18:00",
        scheduleOfflineAction: config.scheduleOfflineAction || "badge",
        scheduleOfflineText: config.scheduleOfflineText || "Back tomorrow at 9:00 AM",
        targetingEnabled: Boolean(config.targetingEnabled),
        showOn: config.showOn || "Every page",
        targetingMode: config.targetingMode || "show",
        targetingRules: config.targetingRules || "",
    })

    return `<script>
(function(){
  "use strict";
  var SETTINGS = ${settings};
  var CHANNELS = ${channelData};
  var AGENTS = ${agentData};
  var ROOT_ID = "scb-pro-widget-root";
  var STYLE_ID = "scb-pro-widget-style";

  if (!SETTINGS.enabled || (!CHANNELS.length && !AGENTS.length)) return;

  /* 1. Page / URL Targeting Filter */
  if (SETTINGS.targetingEnabled) {
    try {
      var curPath = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase().trim() : "/";
      var curHref = (window.location && window.location.href) ? window.location.href.toLowerCase() : "";
      var showOn = SETTINGS.showOn || "Every page";

      if (showOn !== "Every page") {
        var normPath = function(p) {
          var s = (p || "").trim().toLowerCase();
          if (s === "home page") return "";
          while (s.indexOf("/") === 0) s = s.substring(1);
          while (s.length > 0 && s.lastIndexOf("/") === s.length - 1) s = s.slice(0, -1);
          return s;
        };
        var currentNorm = normPath(curPath);

        if (showOn === "Home page") {
          var isHome = (currentNorm === "" || currentNorm === "index" || currentNorm === "index.html" || currentNorm === "home");
          if (!isHome) return;
        } else if (showOn !== "custom") {
          var targetNorm = normPath(showOn);
          if (currentNorm !== targetNorm) return;
        } else if (SETTINGS.targetingRules) {
          var rawRules = String(SETTINGS.targetingRules).split(/[\r\n,;]+/);
          var rules = [];
          for (var rIdx = 0; rIdx < rawRules.length; rIdx++) {
            var rTrim = rawRules[rIdx].trim().toLowerCase();
            if (rTrim) rules.push(rTrim);
          }
          if (rules.length > 0) {
            var isMatch = rules.some(function(ruleInput) {
              var rule = ruleInput;
              if (rule === "*" || rule === "/*") return true;
              if (rule.indexOf("://") !== -1 || rule.indexOf(".") !== -1) {
                if (curHref === rule || curHref === rule + "/") return true;
                if (rule.slice(-1) === "*" && curHref.indexOf(rule.slice(0, -1)) === 0) return true;
                try {
                  var parsed = new URL(rule.indexOf("://") !== -1 ? rule : "https://" + rule);
                  rule = parsed.pathname;
                } catch(e) {}
              }
              var cleanRule = rule.indexOf("/") === 0 ? rule : "/" + rule;
              var isHomeRule = cleanRule === "/" || cleanRule === "/home" || cleanRule === "/index";
              var isHomePath = curPath === "/" || curPath === "" || curPath === "/home" || curPath === "/index";
              if (isHomeRule && isHomePath) return true;

              if (cleanRule.slice(-2) === "/*") {
                var prefix = cleanRule.slice(0, -2);
                return curPath === prefix || curPath === prefix + "/" || curPath.indexOf(prefix + "/") === 0;
              }
              if (cleanRule.slice(-1) === "*") {
                var prefix = cleanRule.slice(0, -1);
                return curPath.indexOf(prefix) === 0;
              }
              var ruleNoSlash = cleanRule.replace(/\/+$/, "");
              var pathNoSlash = curPath.replace(/\/+$/, "");
              return curPath === cleanRule || pathNoSlash === ruleNoSlash;
            });
            if (SETTINGS.targetingMode === "hide" && isMatch) return;
            if (SETTINGS.targetingMode === "show" && !isMatch) return;
          }
        }
      }
    } catch(e) {}
  }

  /* 2. Operating Hours & Days Schedule Check */
  var isOnline = true;
  if (SETTINGS.scheduleEnabled) {
    try {
      var now = new Date();
      var currentDay = now.getDay();
      var days = Array.isArray(SETTINGS.scheduleDays) ? SETTINGS.scheduleDays : [1, 2, 3, 4, 5];
      if (days.indexOf(currentDay) === -1) {
        isOnline = false;
      } else {
        var curMinutes = now.getHours() * 60 + now.getMinutes();
        var sParts = String(SETTINGS.scheduleStart || "09:00").split(":");
        var eParts = String(SETTINGS.scheduleEnd || "18:00").split(":");
        var sMins = (parseInt(sParts[0], 10) || 9) * 60 + (parseInt(sParts[1], 10) || 0);
        var eMins = (parseInt(eParts[0], 10) || 18) * 60 + (parseInt(eParts[1], 10) || 0);
        if (sMins <= eMins) {
          isOnline = (curMinutes >= sMins && curMinutes < eMins);
        } else {
          isOnline = (curMinutes >= sMins || curMinutes < eMins);
        }
      }
    } catch(e) {
      isOnline = true;
    }

    if (!isOnline && SETTINGS.scheduleOfflineAction === "hide") {
      return;
    }
  }

  /* 3. Deduplicated anonymous view tracking for site visitors (using temporary sessionStorage) */
  if (SETTINGS.enableAnalytics && typeof window !== "undefined") {
    try {
      var sessionKey = "chat_bubbles_viewed";
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "true");
        try {
          var storageKey = "chat_bubbles_analytics_data_v1";
          var raw = localStorage.getItem(storageKey);
          var store = raw ? JSON.parse(raw) : { days: {}, totalViews: 0, totalClicks: 0 };
          var now = new Date();
          var dateKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
          if (!store.days) store.days = {};
          if (!store.days[dateKey]) store.days[dateKey] = { views: 0, clicks: 0, channels: {} };
          store.days[dateKey].views = (store.days[dateKey].views || 0) + 1;
          store.totalViews = (store.totalViews || 0) + 1;
          localStorage.setItem(storageKey, JSON.stringify(store));
        } catch(e){}
        if (typeof window.gtag === "function") {
          window.gtag("event", "chat_bubbles_view", {
            event_category: "Chat Bubbles",
            event_label: "widget_view"
          });
        }
        if (Array.isArray(window.dataLayer)) {
          window.dataLayer.push({
            event: "chat_bubbles_view",
            event_category: "Chat Bubbles"
          });
        }
        try {
          var payload = JSON.stringify({
            widgetId: window.location.hostname || "chat-bubbles-default",
            siteDomain: window.location.hostname,
            siteUrl: window.location.href,
            eventType: "view"
          });
          var isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
          var targetEndpoint = isLocalhost
            ? "http://localhost:3000/api/analytics/track"
            : "https://app.framefic.com/chat-bubbles/api/analytics/track";
          if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
            navigator.sendBeacon(targetEndpoint, new Blob([payload], { type: "application/json" }));
          } else {
            fetch(targetEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payload,
              mode: "cors"
            }).catch(function(){});
          }
        } catch(e){}
      }
    } catch(e) {}
  }

  var existing = document.getElementById(ROOT_ID);
  if (existing) existing.remove();
  var oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();

  var root = document.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("data-scb-pro", "1");

  var style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = \`
    #\${ROOT_ID}{position:fixed;z-index:2147483000;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:\${SETTINGS.gap}px;pointer-events:none}
    #\${ROOT_ID}.bottom-right{right:\${SETTINGS.offsetX}px;bottom:\${SETTINGS.offsetY}px;align-items:flex-end}
    #\${ROOT_ID}.bottom-left{left:\${SETTINGS.offsetX}px;bottom:\${SETTINGS.offsetY}px;align-items:flex-start}
    #\${ROOT_ID}.top-right{right:\${SETTINGS.offsetX}px;top:\${SETTINGS.offsetY}px;align-items:flex-end;flex-direction:column-reverse}
    #\${ROOT_ID}.top-left{left:\${SETTINGS.offsetX}px;top:\${SETTINGS.offsetY}px;align-items:flex-start;flex-direction:column-reverse}

    /* Layout Variations */
    #\${ROOT_ID}.horizontal{flex-direction:row;align-items:center}
    #\${ROOT_ID}.horizontal.bottom-right,#\${ROOT_ID}.horizontal.top-right{flex-direction:row-reverse}
    #\${ROOT_ID}.horizontal .scb-list{flex-direction:row;align-items:center}
    #\${ROOT_ID}.horizontal.bottom-right .scb-list,#\${ROOT_ID}.horizontal.top-right .scb-list{flex-direction:row-reverse}
    #\${ROOT_ID}.grid .scb-list{display:grid;grid-template-columns:repeat(2,auto);gap:\${SETTINGS.gap}px}

    /* Greeting bubble */
    #\${ROOT_ID} .scb-greeting{pointer-events:auto;display:flex;align-items:center;gap:10px;max-width:min(320px,calc(100vw - 32px));padding:10px 14px;border-radius:14px;background:\${SETTINGS.panelBackground};color:\${SETTINGS.panelText};box-shadow:\${SETTINGS.shadow};font-size:13px;line-height:1.4;animation:scb-greet .35s ease both}
    #\${ROOT_ID} .scb-greeting button{border:0;background:transparent;color:inherit;opacity:.55;cursor:pointer;padding:2px;line-height:1;font-size:16px}

    /* Classic button list */
    #\${ROOT_ID} .scb-list{display:flex;flex-direction:column;gap:\${SETTINGS.gap}px;pointer-events:none;opacity:0;visibility:hidden;transform:translateY(8px) scale(.96);transition:opacity .22s ease,transform .22s ease,visibility .22s}
    #\${ROOT_ID}.open .scb-list{pointer-events:auto;opacity:1;visibility:visible;transform:none}
    #\${ROOT_ID} .scb-item{display:flex;align-items:center;gap:9px;pointer-events:auto}
    #\${ROOT_ID}.left .scb-item{flex-direction:row}
    #\${ROOT_ID} .scb-label{max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:7px 10px;border-radius:9px;background:\${SETTINGS.labelBackground};color:\${SETTINGS.labelColor};font-size:12px;font-weight:600;box-shadow:0 7px 20px rgba(0,0,0,.13);opacity:0;transform:translateX(6px);transition:opacity .18s ease,transform .18s ease}
    #\${ROOT_ID}.open .scb-item:hover .scb-label,#\${ROOT_ID}.open .scb-item:focus-within .scb-label{opacity:1;transform:none}

    /* Mobile Layout Constraint & More Expander */
    @media (max-width: 640px) {
      #\${ROOT_ID} .scb-list {
        max-height: calc(100vh - 130px);
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        padding-right: 4px;
        scrollbar-width: thin;
      }
      #\${ROOT_ID} .scb-list::-webkit-scrollbar { width: 4px; }
      #\${ROOT_ID} .scb-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
      #\${ROOT_ID} .scb-list:not(.mobile-expanded) .scb-item.scb-overflow-item {
        display: none !important;
      }
      #\${ROOT_ID} .scb-more-item {
        display: flex;
        align-items: center;
        gap: 9px;
        pointer-events: auto;
      }
      #\${ROOT_ID} .scb-more-button {
        width: \${SETTINGS.buttonSize}px;
        height: \${SETTINGS.buttonSize}px;
        background: #374151;
        color: #ffffff;
        border: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        box-shadow: \${SETTINGS.shadow};
        transition: transform .18s ease, background .18s ease;
      }
      #\${ROOT_ID} .scb-more-button:hover {
        transform: scale(1.06);
        background: #1f2937;
      }
      #\${ROOT_ID} .scb-more-button.is-expanded {
        background: \${SETTINGS.buttonColor};
      }
    }
    @media (min-width: 641px) {
      #\${ROOT_ID} .scb-more-item {
        display: none !important;
      }
    }

    /* Live Chat Modal Card */
    #\${ROOT_ID} .scb-modal{width:360px;max-width:calc(100vw - 32px);max-height:calc(100vh - 110px);background:#ffffff;border-radius:24px;box-shadow:0 22px 55px rgba(0,0,0,.22),0 8px 20px rgba(0,0,0,.08);overflow:hidden;display:flex;flex-direction:column;pointer-events:none;opacity:0;visibility:hidden;transform:translateY(16px) scale(.96);transition:opacity .25s cubic-bezier(.16,1,.3,1),transform .25s cubic-bezier(.16,1,.3,1),visibility .25s}
    #\${ROOT_ID}.open .scb-modal{pointer-events:auto;opacity:1;visibility:visible;transform:none}

    .scb-modal-header{background:\${SETTINGS.modalGradient};padding:22px 20px 20px;color:#ffffff;border-radius:24px 24px 0 0;position:relative;display:flex;flex-direction:column;gap:6px}
    .scb-modal-header-top{display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:12px}
    .scb-modal-back-btn{background:rgba(255,255,255,.22);border:0;border-radius:50%;width:28px;height:28px;color:#ffffff;display:flex;align-items:center;justify-content:center;padding:0;margin:0;cursor:pointer;transition:background .15s;animation:scbFadeScale .22s cubic-bezier(.16,1,.3,1) both}
    .scb-modal-back-btn:hover{background:rgba(255,255,255,.35)}
    .scb-modal-back-btn svg{width:11px;height:11px;display:block;margin:0}
    .scb-modal-close-btn{background:rgba(255,255,255,.22);border:0;border-radius:50%;width:28px;height:28px;color:#ffffff;display:flex;align-items:center;justify-content:center;padding:0;margin:0;cursor:pointer;transition:background .15s;margin-left:auto !important}
    .scb-modal-close-btn:hover{background:rgba(255,255,255,.35)}
    .scb-modal-close-btn svg{width:11px;height:11px;display:block;margin:0}
    .scb-modal-header-info{display:flex;flex-direction:column;gap:6px}
    .scb-modal-title{font-size:18px;font-weight:700;line-height:1.2;margin:0}
    .scb-modal-subtitle{font-size:13px;line-height:1.45;color:#ffffff;opacity:.92;margin:0}
    .scb-modal-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;width:max-content;backdrop-filter:blur(4px);margin-top:2px}

    /* Modal Body & Agents */
    .scb-modal-body{padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;background:#ffffff;max-height:340px}
    .scb-agent-card{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:#f9fafb;border:1px solid #f3f4f6;cursor:pointer;transition:background .15s,transform .15s,border-color .15s;text-decoration:none;color:inherit;outline:none}
    .scb-agent-card:hover{background:#f3f4f6;transform:translateY(-1px);border-color:#e5e7eb}
    .scb-agent-avatar-wrap{position:relative;width:42px;height:42px;flex-shrink:0}
    .scb-agent-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;display:block}
    .scb-agent-badge{position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;color:#ffffff;box-sizing:border-box;padding:0;margin:0;line-height:0;box-shadow:0 1px 3px rgba(0,0,0,.12)}
    .scb-agent-badge svg{width:10px;height:10px;display:block;margin:0 auto;flex-shrink:0}
    .scb-agent-badge[data-channel="telegram"] svg{transform:translate(-0.5px, 0.5px)}
    .scb-agent-badge[data-channel="whatsapp"] svg{transform:translate(0.3px, -0.3px)}
    .scb-agent-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
    .scb-agent-name-row{display:flex;align-items:center;gap:6px}
    .scb-agent-name{font-size:14px;font-weight:600;color:#111827}
    .scb-agent-online-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,.25);flex-shrink:0;display:inline-block}
    .scb-agent-role{font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .scb-agent-arrow{color:#9ca3af;font-size:14px;transition:transform .18s ease;display:flex;align-items:center}
    .scb-agent-card:hover .scb-agent-arrow{transform:translateX(2px)}

    /* Direct Chat View inside Modal */
    .scb-chat-view{padding:18px 16px;display:flex;flex-direction:column;gap:14px}
    .scb-chat-bubble{background:#f3f4f6;color:#1f2937;padding:12px 14px;border-radius:16px 16px 16px 4px;font-size:13px;line-height:1.45;max-width:90%;box-shadow:0 1px 3px rgba(0,0,0,.04);animation:scb-pop .25s ease both}
    .scb-chat-input{width:100%;padding:10px 12px;border-radius:12px;border:1px solid #e5e7eb;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box;transition:border-color .15s}
    .scb-chat-input:focus{border-color:\${SETTINGS.buttonColor}}
    .scb-start-btn{background:\${SETTINGS.modalGradient};color:#ffffff;border:0;border-radius:999px;padding:13px 20px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;box-shadow:0 10px 24px rgba(0,0,0,.16);transition:transform .18s,filter .18s;outline:none}
    .scb-start-btn:hover{transform:translateY(-2px);filter:brightness(1.06)}

    /* Launcher buttons */
    #\${ROOT_ID} .scb-button{width:\${SETTINGS.buttonSize}px;height:\${SETTINGS.buttonSize}px;display:grid;place-items:center;border:0;padding:0;cursor:pointer;text-decoration:none;color:#fff;background:var(--scb-color);box-shadow:\${SETTINGS.shadow};transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;position:relative;flex:0 0 auto;outline:none}
    #\${ROOT_ID} .scb-button svg{width:\${SETTINGS.iconSize}px;height:\${SETTINGS.iconSize}px;display:block;fill:#ffffff !important;color:#ffffff !important}
    #\${ROOT_ID} .scb-button svg path{fill:#ffffff !important}
    #\${ROOT_ID} .circle{border-radius:50%}
    #\${ROOT_ID} .rounded{border-radius:16px}
    #\${ROOT_ID} .pill{border-radius:999px;width:auto;min-width:\${SETTINGS.buttonSize}px;padding:0 18px}
    #\${ROOT_ID} .scb-main{pointer-events:auto}
    #\${ROOT_ID} .scb-main .scb-button{background:\${SETTINGS.buttonColor}}
    #\${ROOT_ID} .scb-main-icon{transition:transform .25s ease}
    #\${ROOT_ID}.open .scb-main-icon{transform:rotate(45deg)}
    #\${ROOT_ID} .scb-badge{position:absolute;right:-3px;top:-3px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#ef4444;color:#fff;border:2px solid #fff;font-size:10px;font-weight:700;display:grid;place-items:center}

    /* Accessibility / Keyboard Focus Styles */
    #\${ROOT_ID} button:focus-visible,
    #\${ROOT_ID} a:focus-visible,
    #\${ROOT_ID} input:focus-visible,
    #\${ROOT_ID} .scb-agent-card:focus-visible{
      outline: 2px solid #2563eb !important;
      outline-offset: 2px !important;
    }

    /* Animation Presets */
    @keyframes scb-pop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
    @keyframes scb-bounce{0%{opacity:0;transform:translateY(16px) scale(.85)}60%{opacity:1;transform:translateY(-4px) scale(1.03)}100%{opacity:1;transform:none}}
    @keyframes scb-slide{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
    @keyframes scb-pulse{0%,100%{transform:scale(1);box-shadow:\${SETTINGS.shadow}}50%{transform:scale(1.08);box-shadow:0 0 20px \${SETTINGS.buttonColor}}}
    @keyframes scb-greet{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
    @keyframes scbSlideInRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
    @keyframes scbSlideInLeft{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
    @keyframes scbFadeScale{from{opacity:0;transform:scale(.75)}to{opacity:1;transform:scale(1)}}

    .scb-view-slide-forward{animation:scbSlideInRight .28s cubic-bezier(.16,1,.3,1) both !important;will-change:transform,opacity !important}
    .scb-view-slide-backward{animation:scbSlideInLeft .28s cubic-bezier(.16,1,.3,1) both !important;will-change:transform,opacity !important}

    #\${ROOT_ID}.anim-pop.open .scb-modal, #\${ROOT_ID}.anim-pop.open .scb-list{animation:scb-pop .25s cubic-bezier(.16,1,.3,1) both}
    #\${ROOT_ID}.anim-bounce.open .scb-modal, #\${ROOT_ID}.anim-bounce.open .scb-list{animation:scb-bounce .35s cubic-bezier(.34,1.56,.64,1) both}
    #\${ROOT_ID}.anim-slide.open .scb-modal, #\${ROOT_ID}.anim-slide.open .scb-list{animation:scb-slide .28s cubic-bezier(.16,1,.3,1) both}
    #\${ROOT_ID}.anim-pulse:not(.open) .scb-main .scb-button{animation:scb-pulse 2.2s infinite ease-in-out}
    #\${ROOT_ID}.anim-none.open .scb-modal, #\${ROOT_ID}.anim-none.open .scb-list{animation:none;opacity:1;visibility:visible;transform:none}

    /* Mobile Responsive Offsets and Label Control */
    @media (max-width:640px){
      #\${ROOT_ID}.bottom-right,#\${ROOT_ID}.bottom-left{right:\${SETTINGS.mobileOffsetX}px;bottom:\${SETTINGS.mobileOffsetY}px;left:auto}
      #\${ROOT_ID}.top-right,#\${ROOT_ID}.top-left{right:\${SETTINGS.mobileOffsetX}px;top:\${SETTINGS.mobileOffsetY}px;left:auto}
      #\${ROOT_ID} .scb-modal{width:calc(100vw - 32px);max-height:80vh}
      \${!SETTINGS.mobileShowLabels ? \`#\${ROOT_ID} .scb-label{display:none !important}\` : ""}
    }

    /* Reduced Motion */
    @media (prefers-reduced-motion: reduce){
      #\${ROOT_ID} *, #\${ROOT_ID} *::before, #\${ROOT_ID} *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    }

    /* Behavioral Triggers & Offline Styling */
    #\${ROOT_ID}.scb-scroll-hidden{opacity:0 !important;pointer-events:none !important;transform:translateY(24px) !important;transition:opacity .35s ease,transform .35s ease !important}
    #\${ROOT_ID}.scb-scroll-visible{opacity:1 !important;pointer-events:auto !important;transform:none !important}
    .scb-modal-badge.offline{background:rgba(0,0,0,.28);color:rgba(255,255,255,.92)}
    .scb-agent-badge.offline{background:#6b7280 !important}
  \`;

  document.head.appendChild(style);

  function create(tag, className){
    var el = document.createElement(tag);
    if(className) el.className = className;
    return el;
  }

  function formatDynamicUrl(rawUrl){
    if(!rawUrl) return "";
    try {
      var curUrl = encodeURIComponent(window.location.href);
      var curTitle = encodeURIComponent(document.title);
      return rawUrl
        .replace(/%7Burl%7D|%7Bpage_url%7D|\{url\}|\{page_url\}/gi, curUrl)
        .replace(/%7Btitle%7D|%7Bpage_title%7D|\{title\}|\{page_title\}/gi, curTitle);
    } catch(e){
      return rawUrl;
    }
  }

  function trackClick(channelId, channelLabel, agentName, targetUrl){
    if(!SETTINGS.enableAnalytics) return;
    try {
      var storageKey = "chat_bubbles_analytics_data_v1";
      var raw = localStorage.getItem(storageKey);
      var store = raw ? JSON.parse(raw) : { days: {}, totalViews: 0, totalClicks: 0 };
      var now = new Date();
      var dateKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
      if (!store.days) store.days = {};
      if (!store.days[dateKey]) store.days[dateKey] = { views: 0, clicks: 0, channels: {} };
      store.days[dateKey].clicks = (store.days[dateKey].clicks || 0) + 1;
      if (!store.days[dateKey].channels) store.days[dateKey].channels = {};
      store.days[dateKey].channels[channelId] = (store.days[dateKey].channels[channelId] || 0) + 1;
      store.totalClicks = (store.totalClicks || 0) + 1;
      localStorage.setItem(storageKey, JSON.stringify(store));
    } catch(e){}
    try {
      if(typeof window.gtag === "function"){
        window.gtag("event", "chat_bubbles_click", {
          event_category: "Chat Bubbles",
          event_label: channelLabel || channelId,
          channel_id: channelId,
          channel_name: channelLabel || channelId,
          agent_name: agentName || "",
          target_url: targetUrl || ""
        });
      }
      if(Array.isArray(window.dataLayer)){
        window.dataLayer.push({
          event: "chat_bubbles_click",
          channel: channelId,
          channel_name: channelLabel || channelId,
          agent: agentName || "",
          target_url: targetUrl || ""
        });
      }
    } catch(e){}
    try {
      var clickPayload = JSON.stringify({
        widgetId: window.location.hostname || "chat-bubbles-default",
        siteDomain: window.location.hostname,
        siteUrl: window.location.href,
        eventType: "click",
        channelId: channelId || ""
      });
      var isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      var targetEndpoint = isLocalhost
        ? "http://localhost:3000/api/analytics/track"
        : "https://app.framefic.com/chat-bubbles/api/analytics/track";
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(targetEndpoint, new Blob([clickPayload], { type: "application/json" }));
      } else {
        fetch(targetEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: clickPayload,
          mode: "cors"
        }).catch(function(){});
      }
    } catch(e){}
  }

  var activeAgent = null;
  var navDirection = "forward";

  function openDirectChat(agent){
    navDirection = "forward";
    activeAgent = agent;
    render();
  }

  function backToList(){
    navDirection = "backward";
    activeAgent = null;
    render();
  }

  function toggleMenu(){
    var isOpen = root.classList.contains("open");
    if(isOpen){
      closeMenu();
    } else {
      navDirection = "forward";
      root.classList.add("open");
      var btn = root.querySelector(".scb-main .scb-button");
      if(btn) btn.setAttribute("aria-expanded","true");
    }
  }

  function closeMenu(restoreFocus){
    root.classList.remove("open");
    activeAgent = null;
    navDirection = "forward";
    var btn = root.querySelector(".scb-main .scb-button");
    if(btn){
      btn.setAttribute("aria-expanded","false");
      if(restoreFocus) btn.focus();
    }
  }

  function render(){
    root.innerHTML = "";
    root.className = SETTINGS.position + " " + SETTINGS.layout + " anim-" + SETTINGS.animation + (SETTINGS.position.indexOf("left") >= 0 ? " left" : "") + (root.classList.contains("open") ? " open" : "");

    // 1. Modal Mode (Webflow Style)
    if(SETTINGS.widgetMode === "modal"){
      var modal = create("div","scb-modal");

      var header = create("div","scb-modal-header");
      var headerTop = create("div","scb-modal-header-top");

      if(activeAgent){
        var backBtn = create("button","scb-modal-back-btn");
        backBtn.type = "button";
        backBtn.setAttribute("aria-label", "Back to team");
        backBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M9.5 4L5.5 8l4 4"/></svg>';
        backBtn.onclick = backToList;
        headerTop.appendChild(backBtn);
      }

      var closeBtn = create("button","scb-modal-close-btn");
      closeBtn.type = "button";
      closeBtn.setAttribute("aria-label", "Close chat");
      closeBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>';
      closeBtn.onclick = closeMenu;
      headerTop.appendChild(closeBtn);
      header.appendChild(headerTop);

      var headerInfo = create("div", "scb-modal-header-info" + (activeAgent ? " scb-view-slide-forward" : (navDirection === "backward" ? " scb-view-slide-backward" : "")));

      if(!activeAgent){
        var title = create("h3","scb-modal-title");
        title.textContent = SETTINGS.modalTitle;
        headerInfo.appendChild(title);

        var subtitle = create("p","scb-modal-subtitle");
        subtitle.textContent = SETTINGS.modalSubtitle;
        headerInfo.appendChild(subtitle);

        var responseBadgeText = SETTINGS.modalResponseTime;
        if(SETTINGS.scheduleEnabled && !isOnline){
          responseBadgeText = SETTINGS.scheduleOfflineText || "Back tomorrow at 9:00 AM";
        }
        if(responseBadgeText){
          var badge = create("span","scb-modal-badge" + (!isOnline ? " offline" : ""));
          badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px;"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.2l2.2 1.3"/></svg>' + responseBadgeText;
          headerInfo.appendChild(badge);
        }
      } else {
        var agentTitle = create("h3","scb-modal-title");
        agentTitle.textContent = activeAgent.name;
        headerInfo.appendChild(agentTitle);

        var agentSubtitle = create("p","scb-modal-subtitle");
        agentSubtitle.textContent = activeAgent.role;
        headerInfo.appendChild(agentSubtitle);
      }

      header.appendChild(headerInfo);
      modal.appendChild(header);

      if(!activeAgent){
        var body = create("div","scb-modal-body" + (navDirection === "backward" ? " scb-view-slide-backward" : ""));
        var listToRender = AGENTS.length ? AGENTS : CHANNELS.map(function(c, i){
          return {
            id: c.id,
            name: c.label + " Team",
            role: "Customer Support",
            avatar: ${JSON.stringify(DEFAULT_FALLBACK_AVATAR)},
            channelId: c.id,
            color: c.color,
            icon: c.icon,
            url: c.url,
            value: c.value,
            message: c.message
          };
        });

        listToRender.forEach(function(agent){
          var card = create("div","scb-agent-card");
          card.setAttribute("role", "button");
          card.setAttribute("tabindex", "0");
          card.setAttribute("aria-label", "Chat with " + agent.name + ", " + agent.role);
          card.onclick = function(){ openDirectChat(agent); };
          card.onkeydown = function(e){
            if(e.key === "Enter" || e.key === " "){
              e.preventDefault();
              openDirectChat(agent);
            }
          };

          var avatarWrap = create("div","scb-agent-avatar-wrap");
          var avatar = create("img","scb-agent-avatar");
          var rawAvatar = agent.avatar || "";
          avatar.src = (rawAvatar.indexOf("http://") === 0 || rawAvatar.indexOf("https://") === 0 || rawAvatar.indexOf("data:image/") === 0)
            ? rawAvatar
            : ${JSON.stringify(DEFAULT_FALLBACK_AVATAR)};
          avatar.alt = agent.name;
          avatarWrap.appendChild(avatar);

          var badge = create("span","scb-agent-badge" + (!isOnline ? " offline" : ""));
          badge.setAttribute("data-channel", agent.channelId || "");
          badge.style.background = (!isOnline ? "#6b7280" : (agent.color || "#25D366"));
          badge.innerHTML = agent.icon || "";
          avatarWrap.appendChild(badge);
          card.appendChild(avatarWrap);

          var info = create("div","scb-agent-info");
          var nameRow = create("div","scb-agent-name-row");
          var name = create("span","scb-agent-name");
          name.textContent = agent.name;
          nameRow.appendChild(name);

          if (agent.online !== false && isOnline) {
            var dot = create("span", "scb-agent-online-dot");
            nameRow.appendChild(dot);
          }
          info.appendChild(nameRow);

          var role = create("div","scb-agent-role");
          role.textContent = agent.role + (!isOnline ? " • Offline" : "");
          info.appendChild(role);
          card.appendChild(info);

          var arrow = create("span","scb-agent-arrow");
          arrow.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5L10.5 8L6 12.5"/></svg>';
          card.appendChild(arrow);

          body.appendChild(card);
        });
        modal.appendChild(body);
      } else {
        var chatView = create("div","scb-chat-view scb-view-slide-forward");
        var bubble = create("div","scb-chat-bubble");
        bubble.textContent = activeAgent.message || SETTINGS.modalChatBubble;
        chatView.appendChild(bubble);

        var input = create("input","scb-chat-input");
        input.type = "text";
        input.placeholder = activeAgent.message || "Type your message...";
        input.value = activeAgent.message || "";
        input.maxLength = 500;
        chatView.appendChild(input);

        var startBtn = create("a","scb-start-btn");
        startBtn.textContent = SETTINGS.modalStartChatText;
        startBtn.target = "_blank";
        startBtn.rel = "noopener noreferrer";
        var agentUrl = formatDynamicUrl(activeAgent.url || "");
        startBtn.href = (!/^javascript:/i.test(agentUrl)) ? agentUrl : "#";

        input.oninput = function(){
          var cleanVal = String(activeAgent.value || "").trim();
          var rawMsg = input.value.trim()
            .replace(/\{url\}|\{page_url\}/gi, window.location.href)
            .replace(/\{title\}|\{page_title\}/gi, document.title);
          var encMsg = encodeURIComponent(rawMsg);
          if(activeAgent.channelId === "whatsapp"){
            startBtn.href = "https://wa.me/" + cleanVal.replace(/[^0-9]/g,"") + (encMsg ? "?text=" + encMsg : "");
          } else if(activeAgent.channelId === "telegram"){
            startBtn.href = "https://t.me/" + cleanVal.replace(/^@/,"").replace(/[^a-zA-Z0-9._-]/g,"") + (encMsg ? "?text=" + encMsg : "");
          } else if(activeAgent.channelId === "sms"){
            startBtn.href = "sms:" + cleanVal.replace(/[^0-9+]/g,"") + (encMsg ? "?body=" + encMsg : "");
          } else if(activeAgent.channelId === "email"){
            var emailParams = [];
            var cleanSub = String(activeAgent.emailSubject || "").trim();
            if (cleanSub) emailParams.push("subject=" + encodeURIComponent(cleanSub));
            if (encMsg) emailParams.push("body=" + encMsg);
            startBtn.href = "mailto:" + cleanVal.replace(/[^a-zA-Z0-9._%+\-@]/g,"") + (emailParams.length ? "?" + emailParams.join("&") : "");
          }
        };

        startBtn.onclick = function(){
          trackClick(activeAgent.channelId, activeAgent.channelId, activeAgent.name, startBtn.href);
          if(SETTINGS.closeAfterClick) closeMenu();
        };

        chatView.appendChild(startBtn);
        modal.appendChild(chatView);
      }

      root.appendChild(modal);
    } else {
      // 2. Classic Icon Buttons Mode
      var list = create("div","scb-list");
      var mobileExpanded = false;
      var hasOverflow = CHANNELS.length > 4 && (SETTINGS.mobileCapChannels !== false);

      CHANNELS.forEach(function(channel,index){
        var item = create("div","scb-item" + (hasOverflow && index >= 4 ? " scb-overflow-item" : ""));
        item.style.setProperty("--scb-color", channel.color || "#111827");
        var label = create("span","scb-label");
        label.textContent = SETTINGS.showChannelNames ? channel.label : "";
        if(!SETTINGS.showLabels) label.style.display = "none";

        var link = create("a","scb-button " + SETTINGS.buttonShape);
        var chUrl = formatDynamicUrl(channel.url || "");
        link.href = (!/^javascript:/i.test(chUrl)) ? chUrl : "#";
        link.setAttribute("aria-label", channel.label);
        link.style.setProperty("--scb-color", channel.color || "#111827");
        link.innerHTML = channel.icon || "";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.onclick = function(){
          trackClick(channel.id, channel.label, "", link.href);
          if(SETTINGS.closeAfterClick) closeMenu();
        };

        if(root.classList.contains("left")){
          item.appendChild(link);
          if(SETTINGS.showLabels) item.appendChild(label);
        } else {
          if(SETTINGS.showLabels) item.appendChild(label);
          item.appendChild(link);
        }
        list.appendChild(item);
      });

      if(hasOverflow){
        var moreItem = create("div","scb-more-item");
        var moreLabel = create("span","scb-label");
        moreLabel.textContent = "+" + (CHANNELS.length - 4) + " More";
        if(!SETTINGS.showLabels) moreLabel.style.display = "none";

        var moreBtn = create("button","scb-more-button " + SETTINGS.buttonShape);
        moreBtn.type = "button";
        moreBtn.setAttribute("aria-label", "Show more channels");
        moreBtn.textContent = "+" + (CHANNELS.length - 4);
        moreBtn.onclick = function(e){
          e.stopPropagation();
          mobileExpanded = !mobileExpanded;
          if(mobileExpanded){
            list.classList.add("mobile-expanded");
            moreBtn.classList.add("is-expanded");
            moreBtn.textContent = "−";
            moreLabel.textContent = "Show Less";
          } else {
            list.classList.remove("mobile-expanded");
            moreBtn.classList.remove("is-expanded");
            moreBtn.textContent = "+" + (CHANNELS.length - 4);
            moreLabel.textContent = "+" + (CHANNELS.length - 4) + " More";
          }
        };

        if(root.classList.contains("left")){
          moreItem.appendChild(moreBtn);
          if(SETTINGS.showLabels) moreItem.appendChild(moreLabel);
        } else {
          if(SETTINGS.showLabels) moreItem.appendChild(moreLabel);
          moreItem.appendChild(moreBtn);
        }
        list.appendChild(moreItem);
      }
      root.appendChild(list);
    }

    // Floating Main Launcher
    var main = create("div","scb-main");
    var mainButton = create("button","scb-button " + SETTINGS.buttonShape);
    mainButton.type = "button";
    mainButton.setAttribute("aria-label", SETTINGS.ariaLabel);
    mainButton.setAttribute("aria-expanded", root.classList.contains("open") ? "true" : "false");
    mainButton.style.background = SETTINGS.buttonColor;
    mainButton.innerHTML = '<svg class="scb-main-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.9 14.6L2 22l5.4-1.1A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4-1.1l-.4-.2-3.2.7.7-3.1-.2-.4A8 8 0 1 1 12 20Zm4.4-5.4c-.2-.1-1.2-.6-1.4-.6-.2-.1-.3-.1-.5.1l-.6.7c-.1.2-.2.2-.4.1-1.4-.7-2.4-1.8-3.1-3.1-.1-.2 0-.3.1-.4l.5-.6c.1-.2.1-.3 0-.5l-.6-1.4c-.1-.4-.3-.3-.5-.3h-.4c-.2 0-.5.1-.6.3-.6.6-.8 1.4-.8 2.2 0 .2.1.4.1.6.4 1.4 1.2 2.7 2.3 3.7 1.1 1 2.4 1.8 3.9 2.3.8.2 1.5.3 2.1.1.7-.1 1.4-.6 1.6-1.2.1-.3.1-.6 0-.7-.2-.1-.4-.2-.7-.3Z"/></svg>';

    if(SETTINGS.showBadge){
      var badgeEl = create("span","scb-badge");
      badgeEl.textContent = SETTINGS.badgeText || "1";
      mainButton.appendChild(badgeEl);
    }

    mainButton.onclick = function(){
      onUserGestureAudio();
      toggleMenu();
    };
    main.appendChild(mainButton);
    root.appendChild(main);
  }

  document.body.appendChild(root);
  render();

  var audioCtx = null;
  var pendingChime = false;
  var pendingChimeExpires = 0;
  var lastChimePlayed = 0;

  function getAudioCtx(){
    if(!audioCtx || audioCtx.state === "closed"){
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if(AudioCtx) {
        try { audioCtx = new AudioCtx(); } catch(e){}
      }
    }
    return audioCtx;
  }

  function unlockAudio(ctx){
    if(!ctx) return;
    if(ctx.state === "suspended"){
      ctx.resume().catch(function(){});
    }
    try {
      var buf = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch(e){}
  }

  function playChimeTone(ctx){
    try {
      var t = ctx.currentTime;
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, t);
      gain1.gain.setValueAtTime(0.0001, t);
      gain1.gain.linearRampToValueAtTime(0.24, t + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.22);

      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, t + 0.08);
      gain2.gain.setValueAtTime(0.0001, t + 0.08);
      gain2.gain.linearRampToValueAtTime(0.28, t + 0.095);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.40);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t + 0.08);
      osc2.stop(t + 0.40);
    } catch(e){}
  }

  function triggerNotificationSound(){
    if(!SETTINGS.enableSound) return;
    var now = Date.now();
    if(now - lastChimePlayed < 1200) return;
    var ctx = getAudioCtx();
    if(!ctx) return;
    if(ctx.state === "running"){
      playChimeTone(ctx);
      lastChimePlayed = now;
      pendingChime = false;
      pendingChimeExpires = 0;
    } else {
      pendingChime = true;
      pendingChimeExpires = now + 15000;
      ctx.resume().then(function(){
        if(ctx.state === "running"){
          var cNow = Date.now();
          if(cNow - lastChimePlayed < 1200) return;
          playChimeTone(ctx);
          lastChimePlayed = cNow;
          pendingChime = false;
          pendingChimeExpires = 0;
        }
      }).catch(function(){
        pendingChime = true;
      });
    }
  }

  function onUserGestureAudio(){
    var ctx = getAudioCtx();
    if(ctx) unlockAudio(ctx);
    if(pendingChime){
      var now = Date.now();
      if(pendingChimeExpires && now > pendingChimeExpires){
        pendingChime = false;
        pendingChimeExpires = 0;
        return;
      }
      if(now - lastChimePlayed < 1200) return;
      if(ctx && ctx.state === "running"){
        playChimeTone(ctx);
        lastChimePlayed = now;
        pendingChime = false;
        pendingChimeExpires = 0;
      } else if(ctx){
        ctx.resume().then(function(){
          if(ctx.state === "running"){
            var cNow = Date.now();
            if(cNow - lastChimePlayed < 1200) return;
            playChimeTone(ctx);
            lastChimePlayed = cNow;
            pendingChime = false;
            pendingChimeExpires = 0;
          }
        }).catch(function(){});
      }
    }
  }

  if(SETTINGS.enableSound){
    ["pointerdown", "mousedown", "touchstart", "click", "keydown", "scroll", "wheel"].forEach(function(evt){
      window.addEventListener(evt, onUserGestureAudio, { passive: true, capture: true });
    });
  }

  var greetingDisplayed = false;
  function showGreetingBubble(){
    if(greetingDisplayed || root.classList.contains("open")) return;
    if(!SETTINGS.greetingEnabled || !SETTINGS.greetingText) return;
    greetingDisplayed = true;

    var greet = create("div","scb-greeting");
    var greetSpan = create("span");
    greetSpan.textContent = SETTINGS.greetingText;
    var dismissBtn = create("button");
    dismissBtn.type = "button";
    dismissBtn.setAttribute("aria-label", "Dismiss");
    dismissBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
    dismissBtn.onclick = function(){
      greet.remove();
      pendingChime = false;
      pendingChimeExpires = 0;
    };
    greet.appendChild(greetSpan);
    greet.appendChild(dismissBtn);
    greet.onclick = function(){
      onUserGestureAudio();
      toggleMenu();
    };
    root.insertBefore(greet, root.firstChild);

    if(SETTINGS.enableSound){
      triggerNotificationSound();
    }
  }

  function getScrollPercentage(){
    var docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    ) - window.innerHeight;
    if(docHeight <= 0) return 100;
    return ((window.pageYOffset || document.documentElement.scrollTop) / docHeight) * 100;
  }

  /* 3. Scroll Depth Trigger */
  var scrollTriggerFired = false;
  if(SETTINGS.scrollTriggerEnabled){
    if(SETTINGS.scrollTriggerTarget === "greeting"){
      function onScrollGreeting(){
        if(greetingDisplayed) {
          window.removeEventListener("scroll", onScrollGreeting);
          return;
        }
        if(getScrollPercentage() >= SETTINGS.scrollTriggerPercent){
          window.removeEventListener("scroll", onScrollGreeting);
          showGreetingBubble();
        }
      }
      window.addEventListener("scroll", onScrollGreeting, { passive: true });
      onScrollGreeting();
    } else {
      // Launcher target: hide initially, reveal upon reaching scroll depth threshold
      root.classList.add("scb-scroll-hidden");
      function onScrollLauncher(){
        if(scrollTriggerFired) {
          window.removeEventListener("scroll", onScrollLauncher);
          return;
        }
        if(getScrollPercentage() >= SETTINGS.scrollTriggerPercent){
          scrollTriggerFired = true;
          window.removeEventListener("scroll", onScrollLauncher);
          root.classList.remove("scb-scroll-hidden");
          root.classList.add("scb-scroll-visible");
          if(SETTINGS.greetingEnabled && SETTINGS.greetingText){
            setTimeout(showGreetingBubble, SETTINGS.greetingDelay || 2500);
          }
        }
      }
      window.addEventListener("scroll", onScrollLauncher, { passive: true });
      onScrollLauncher();
    }
  } else {
    // Normal greeting delay when scroll depth trigger is disabled
    if(SETTINGS.greetingEnabled && SETTINGS.greetingText){
      setTimeout(showGreetingBubble, SETTINGS.greetingDelay || 2500);
    }
  }

  /* 4. Desktop Exit-Intent Trigger */
  if(SETTINGS.exitIntentEnabled){
    var exitIntentFired = false;
    function onExitIntent(e){
      if(exitIntentFired) return;
      if(e.clientY <= 15){
        exitIntentFired = true;
        document.removeEventListener("mouseleave", onExitIntent);
        // Reveal launcher if it was hidden by scroll depth
        root.classList.remove("scb-scroll-hidden");
        root.classList.add("scb-scroll-visible");

        if(SETTINGS.exitIntentAction === "greeting"){
          showGreetingBubble();
        } else {
          if(!root.classList.contains("open")){
            toggleMenu();
          }
        }
      }
    }
    if(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches){
      document.addEventListener("mouseleave", onExitIntent);
    }
  }

  if(SETTINGS.autoOpen){
    setTimeout(function(){
      if(!root.classList.contains("scb-scroll-hidden")){
        toggleMenu();
      }
    }, SETTINGS.autoOpenDelay || 1200);
  }

  root.addEventListener("click", function(e){
    e.stopPropagation();
  });

  if(SETTINGS.closeOnOutsideClick){
    document.addEventListener("click", function(e){
      if(!e.target || !document.contains(e.target)) return;
      if(!root.contains(e.target)) closeMenu();
    });
  }

  if(SETTINGS.closeOnEscape){
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && root.classList.contains("open")){
        closeMenu(true);
      }
    });
  }
})();
</script>`;
}
