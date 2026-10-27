# Framer Marketplace Compliance: Violations & Solution Plan

**Plugin:** [Chat Bubbles](https://www.framer.com/community/resources/plugins/chat-bubbles)  
**Flagged File:** `/index-BXdj_R6B.mjs`  
**Verdict:** ❌ **Legitimate Rejection** (Framer's automated scanner correctly flagged privacy and shared storage violations).

---

## 1. Executive Summary

| Framer Review Finding | Valid? | Why Framer Flagged It | Core Solution |
| :--- | :---: | :--- | :--- |
| **1. External Data Transmission**<br>*(Project, site, user & editor context sent off-platform)* | **YES** | User ID, user email, project URLs, page tree, and code file counts are sent to `app.framefic.com` via silent background `useEffect` calls on launch and inside the generated canvas component. | Strip `getCurrentUser()`, delete background startup calls, remove canvas code telemetry, and make backend calls strictly on-demand (user clicks). |
| **2. Sensitive State in Shared Storage**<br>*(Auth, trial, or subscription in shared storage)* | **YES** | Pro/Trial flags (`isPro`, `isTrial`, `subscriptionLocked`, `IS_SUBSCRIBED`) are injected into shared canvas node controls and code files visible to all project collaborators. | Keep `framer.setPluginData()` strictly for UI design config (colors, channels). Store auth tokens and user plan status only in browser `localStorage`. |

---

## 2. Issue 1: External Data Transmission (Audit & Fixes)

> **Framer Policy:** *"People using the plugin should not have project metadata or user-related information sent off-platform unless strictly necessary for the feature they are using."*

| # | File & Location | What Violated (Trigger) | Data Transmitted | Required Solution |
| :-: | :--- | :--- | :--- | :--- |
| **1** | [`src/lib/framer/project.ts`](file:///d:/Framefic/chat-bubbles/src/lib/framer/project.ts#L16-L56) | Calls `(framer as any).getCurrentUser()`, `getPublishInfo()`. | Designer email, user name, user ID, staging/production URLs. | **Remove `getCurrentUser()` and URLs.** `getSiteInfo()` should return only `siteId` (`projectInfo.id`). Gather email only when user types it into Auth/Checkout modal. |
| **2** | [`src/features/payment/hooks/usePaymentFlow.ts`](file:///d:/Framefic/chat-bubbles/src/features/payment/hooks/usePaymentFlow.ts#L78-L116)<br>*(Lines 184–197)* | `useEffect` fires **automatically on mount** to query `/api/subscription-status`. | `siteId`, `userId`, `userEmail`, `siteUrl`, and project file count (`componentsCount`). | **Delete mount `useEffect`.** Delete `componentsCount` scanning. Only check subscription when user explicitly clicks "Manage Subscription" or "Upgrade". |
| **3** | [`src/App.tsx`](file:///d:/Framefic/chat-bubbles/src/App.tsx#L357-L409) | `useEffect` fires **automatically on launch** to check trial eligibility and starts trial. | `siteId`, `userId`, `userEmail`. | **Delete auto-trial `useEffect`.** Provide a manual "Start 7-Day Free Trial" button in the UI that triggers trial creation only when clicked. |
| **4** | [`src/features/auth/hooks/useAuth.ts`](file:///d:/Framefic/chat-bubbles/src/features/auth/hooks/useAuth.ts#L110-L117)<br>[`src/features/auth/services/authService.ts`](file:///d:/Framefic/chat-bubbles/src/features/auth/services/authService.ts#L259-L272) | Background call to `POST /api/user/site-info` on mount / OTP verify. | `siteId`, `siteUrl`, `framerUserId`. | **Delete `updateSiteInfo()`.** Authentication must only handle username/email/token, without linking designer project context. |
| **5** | [`src/framer/canvas-component-service.ts`](file:///d:/Framefic/chat-bubbles/src/framer/canvas-component-service.ts#L3488-L3507) | Crawls parent nodes (`WebPageNode`, `DesignPageNode`) during canvas sync. | Canvas page hierarchy path (`canvasPagePath`). | **Remove parent node crawling.** Do not probe or bind editor page hierarchy into component properties. |
| **6** | [`src/framer/canvas-component-service.ts`](file:///d:/Framefic/chat-bubbles/src/framer/canvas-component-service.ts#L85-L153) | Generated canvas component `ChatBubbles.tsx` has `checkSubscriptionFromServer()`. | Pings `/api/subscription-status?siteId=` on every canvas render and preview. | **Delete `checkSubscriptionFromServer()`.** Canvas component must be 100% self-contained presentation code with zero external phone-home requests. |
| **7** | [`src/framer/canvas-component-service.ts`](file:///d:/Framefic/chat-bubbles/src/framer/canvas-component-service.ts#L242-L268)<br>[`src/widget/widget-template.ts`](file:///d:/Framefic/chat-bubbles/src/widget/widget-template.ts#L259-L275) | Fires `sendBeacon` / `fetch` to `/api/analytics/track` on view and clicks. | `widgetId`, `siteDomain`, `siteUrl`, `eventType`. | **Remove backend analytics beaconing.** If analytics are provided, allow users to input their own GA/Pixel IDs; never silently send events to `app.framefic.com`. |

---

## 3. Issue 2: Sensitive State in Shared Storage (Audit & Fixes)

> **Framer Policy:** *"Plugin data is visible across collaborators, which makes it unsuitable for sensitive or user-specific account state. Please keep account, session, and subscription state out of shared plugin data."*

| # | Storage Type | Where in Code | Sensitive State Leaked | Required Solution |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Canvas Node Attributes**<br>*(Shared with all project collaborators & remixes)* | [`src/framer/canvas-component-service.ts`](file:///d:/Framefic/chat-bubbles/src/framer/canvas-component-service.ts#L3430-L3431)<br>*(Lines 3502–3507)* | `isPro: Boolean(...)`<br>`isTrial: Boolean(...)`<br>`subscriptionLocked: "locked"` | **Remove `isPro`, `isTrial`, and `subscriptionLocked`** from `buildControlPayload` and component property controls. Component must never store user license status. |
| **2** | **Project Code File**<br>*(Shared project asset)* | [`src/framer/canvas-component-service.ts`](file:///d:/Framefic/chat-bubbles/src/framer/canvas-component-service.ts#L77-L78) | Hardcodes:<br>`const IS_SUBSCRIBED = true/false;`<br>`const IS_TRIAL = true/false;` into `ChatBubbles.tsx`. | **Delete `IS_SUBSCRIBED` and `IS_TRIAL`** from generated code file template. Code components should render whatever channels the user configured. |
| **3** | **Plugin Permissions** | [`src/framer/canvas-component-service.ts`](file:///d:/Framefic/chat-bubbles/src/framer/canvas-component-service.ts#L3553)<br>[`src/main.tsx`](file:///d:/Framefic/chat-bubbles/src/main.tsx#L55-L69) | Over-declares `"setPluginData"`, `"getPluginData"`, `"setCustomCode"`, `"getCustomCode"`. | **Clean up `isAllowedTo`.** Remove `"setCustomCode"`, `"getCustomCode"`. Ensure `"setPluginData"` is strictly scoped to [`src/core/storage.ts`](file:///d:/Framefic/chat-bubbles/src/core/storage.ts). |
| **4** | **Shared Plugin Data**<br>`framer.setPluginData()` | [`src/core/storage.ts`](file:///d:/Framefic/chat-bubbles/src/core/storage.ts#L164-L207) | `CONFIG_KEY` (`scb_config_v1`) | **Audit `ChatConfig`:** Verify it contains **ONLY** visual configuration (theme, channels, button sizes, agent names, colors). Ensure zero auth tokens, user emails, or subscription flags are ever passed to `saveConfig()`. |
| **5** | **User Session & Entitlements** | [`src/features/auth/services/authService.ts`](file:///d:/Framefic/chat-bubbles/src/features/auth/services/authService.ts#L32-L45) | Auth token & user profile | **Keep strictly in `localStorage` (`chat_bubbles_auth_token`).** Gate Pro features purely in the plugin UI modal/tabs for the active user; never write license status into project data. |

---

## 4. Implementation Checklist by File

| Target File | Exact Actions to Take | Status |
| :--- | :--- | :---: |
| [`src/lib/framer/project.ts`](file:///d:/Framefic/chat-bubbles/src/lib/framer/project.ts) | • Remove `(framer as any).getCurrentUser()`.<br>• Remove `publishInfo.staging.url`.<br>• Return only `{ siteId: projectInfo?.id ?? "chat_bubbles_project" }`. | [x] |
| [`src/framer/canvas-component-service.ts`](file:///d:/Framefic/chat-bubbles/src/framer/canvas-component-service.ts) | • Remove `checkSubscriptionFromServer` and `useSubscriptionCheck` from code template.<br>• Remove `/api/analytics/track` beaconing code.<br>• Remove `isPro`, `isTrial`, and `subscriptionLocked` from controls and `buildControlPayload`.<br>• Remove parent node traversal for `canvasPagePath`. | [x] |
| [`src/features/payment/hooks/usePaymentFlow.ts`](file:///d:/Framefic/chat-bubbles/src/features/payment/hooks/usePaymentFlow.ts) | • Remove automatic startup `useEffect` calling `refreshSubscriptionStatus()`.<br>• Remove `componentsCount` code file scanning.<br>• Trigger subscription checks strictly on user click ("Manage Subscription" or checkout). | [x] |
| [`src/App.tsx`](file:///d:/Framefic/chat-bubbles/src/App.tsx) | • Remove mount `useEffect` running `checkTrialStatus()`.<br>• Gate Pro tabs in the UI; show upgrade/trial modal on user interaction instead of automatic side-effects. | [x] |
| [`src/features/auth/hooks/useAuth.ts`](file:///d:/Framefic/chat-bubbles/src/features/auth/hooks/useAuth.ts) | • Remove calls to `updateSiteInfo()`.<br>• Keep auth state purely local in `localStorage`. | [x] |
| [`src/main.tsx`](file:///d:/Framefic/chat-bubbles/src/main.tsx) | • Remove `"setCustomCode"` and `"getCustomCode"` from `isAllowedTo()`. | [x] |
| [`src/framer/custom-code-service.ts`](file:///d:/Framefic/chat-bubbles/src/framer/custom-code-service.ts) | • Delete unused file (dead code referencing `setCustomCode` and `widget-template.ts`). | [x] |

---

## 5. Resubmission Steps

1. **Build & Inspect:**
   ```powershell
   npm run build
   ```
   Verify that `dist/index-*.mjs` does **not** contain `getCurrentUser`, `/api/analytics/track`, `componentsCount`, `isTrial`, or `IS_SUBSCRIBED`.
2. **Pack Bundle:**
   ```powershell
   npm run pack
   ```
3. **Submit Update:**
   * Go to **Framer Developer Dashboard** → **Chat Bubbles**.
   * Click **Publish a new version** (do not remove the listing).
   * Upload `plugin.zip`. The automated scanner will re-evaluate and approve once the violations are resolved.
