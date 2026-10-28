# Framer Plugin Marketplace — Security, Privacy & Compliance Justification

**Plugin Name:** Chat Bubbles  
**Plugin ID:** `3eb9bd`  
**Developer:** Framefic  
**Target Platform:** Framer Plugin Marketplace (Canvas Mode)  
**Submission Version:** Updated Compliance Release  

---

## 1. Executive Summary for the Framer Review Team

Thank you for your constructive feedback. We have thoroughly reviewed the points raised by the automated code review and applied comprehensive architectural updates to our codebase:

1. **Strictly Minimized Data Transmission & Zero Editor Scraping**:
   - **Zero Editor / Window Scraping**: The plugin contains **zero** inspection or scraping of `document.referrer`, `window.location.ancestorOrigins`, or `window.top.location`. It does not parse or infer editor context URLs.
   - **Minimal Opaque Identifier for Project Scoping**: The only identifier accessed is the official opaque project UUID (`framer.getProjectInfo().id`), strictly to scope widget configuration storage in Framer project metadata and bind subscription/trial licenses to this specific project canvas. Designer personal details (`userName`, `userEmail`, `userId`) and editor URLs are intentionally not extracted on launch.
   - **Explicit User Action & Consent for Account/Trial Flows**: Free trial activation and account sign-in are triggered **only** upon explicit designer action via the in-plugin Auth Modal. A clear disclosure is prominently displayed before submission (*"By continuing, you agree to create a Framefic account to activate your trial and manage your chat bubble license."*).
   - **Anti-Abuse Justification**: Designer authentication is used strictly to enforce our "1 Free Trial per Designer" policy across canvases.

2. **Anonymous Live Site Performance Telemetry (CRO)**:
   - **Zero Visitor Tracking / PII Collection**: Telemetry on live published websites is strictly restricted to anonymous aggregate view and click counters for the widget.
   - **Zero Site/Project Identifiers**: Telemetry payloads transmit **no** `siteDomain`, **no** `window.location.hostname`, **no** `siteUrl`, and **no** Framer project UUIDs. Payloads contain strictly an opaque client-side widget ID and event type (`{ widgetId, eventType, channelId }`).
   - **Framer Canvas Isolation**: Telemetry is strictly guarded against running in the Framer designer canvas (`if (isCanvas || RenderTarget.current() === RenderTarget.canvas) return;`).
   - **Complete Creator Opt-Out**: Site creators have 100% control over analytics tracking via the **Widget Analytics** toggle in plugin settings and Framer property controls. Turning it off completely strips out telemetry network requests.
   - **Session Deduplication**: Views are deduplicated using temporary client `sessionStorage` (`cb_viewed_[widgetId]`), ensuring no repetitive network calls on page refresh.

3. **Stripe.js Runtime Dependency & Graceful Failure**:
   - Dynamic loading of Stripe.js (`@stripe/stripe-js`) is restricted exclusively to the Payment Modal when the user explicitly clicks "Upgrade". It is required by Stripe to render PCI-compliant Stripe Elements for direct in-plugin card entry.
   - **Graceful Failure**: If Stripe.js cannot load (e.g. ad-blockers, offline network, or firewall restrictions), the failure is cleanly caught, a non-blocking notification is displayed, and the canvas/plugin remains fully functional.

4. **Purge of Stale / Unused Authentication Code**:
   - We have audited and purged all legacy and unused authentication endpoints and helpers from the production bundle:
     - Deleted legacy password registration (`/api/auth/register`).
     - Deleted password reset endpoints (`/api/auth/forgot-password`, `/api/auth/verify-reset-code`, `/api/auth/reset-password`).
     - Deleted account existence check (`/api/auth/account-exists`).
     - Deleted unused social code exchange (`/api/auth/social-verify-code`).
     - Kept only the streamlined passwordless 6-digit email OTP flow and session validation.

5. **Zero `dangerouslySetInnerHTML`**:
   - The generated component code contains **zero** instances of `dangerouslySetInnerHTML`. All icons, badges, and gradient styles are rendered safely via static React SVG elements and CSS style objects.

---

## 2. Framer SDK API Usage & Data Justification Table

| Data / API Accessed | Exact Method in Code | Transmitted Over Network? | Purpose & Functionality | Why It Is Essential | Privacy & Security Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Framer Project ID (`siteId`)** | `framer.getProjectInfo().id` | **Yes** (Licensing Only) | Scopes widget configuration in `framer.setPluginData` and binds Pro subscription/trial licenses | Scopes widget settings so multiple Framer projects do not overwrite each other, and binds licenses to the canvas. | **Non-PII, System Identifier**.<br>An internal Framer UUID. Never exposed publicly. |
| **User Email & Name** | User-entered form inputs | **Yes** (Active Only) | Provided explicitly by the user in the Auth Modal for passwordless OTP verification | Enables creators to manage their subscription and access customer support. | **First-Party Authentication PII**.<br>Collected only with explicit designer consent; never shared with third parties. |
| **Component Code Files** | `framer.getCodeFiles()` | **No** (Local Canvas Only) | Checks if `ChatBubbles.tsx` already exists to update it cleanly in-place | Ensures updates in the plugin shell sync seamlessly without creating duplicate files. | **Local Project Structure**.<br>Zero external transmission. |
| **Canvas Node Insertion** | `framer.addComponentInstance()` | **No** (Local Canvas Only) | Inserts the generated `ChatBubbles` visual component instance onto the active page | Allows creators to place the chat widget directly onto their canvas. | **Local Canvas API**.<br>Zero external transmission. |
| **Canvas Page Nodes** | `framer.getNodesWithType("WebPageNode")` | **No** (Local Canvas Only) | Populates the "Show on page" targeting dropdown | Reads `node.name` to allow creators to target the widget to specific pages. | **Canvas Metadata**.<br>Zero external transmission. |
| **Project Shared Storage** | `framer.getPluginData()` / `framer.setPluginData()` | **No** (Local Canvas Only) | Multi-designer collaboration | Saves widget visual configuration (`scb_config_v1`) in project metadata so collaborating team members share identical settings. | **Framer Native Storage**.<br>Zero external transmission. |

---

## 3. Live Site Telemetry & Visitor Privacy Analysis

When a Framer site containing Chat Bubbles is published, the generated code component interacts with the backend strictly for conversion rate tracking:

### What Is Sent to the Server:
```json
{
  "widgetId": "cb_lq4x5k8",
  "eventType": "view" | "click",
  "channelId": "whatsapp"
}
```

### What Is NOT Collected:
- ❌ **NO IP Addresses** (not logged or stored)
- ❌ **NO Cookies or Tracking Pixels**
- ❌ **NO Browser Fingerprinting** (no canvas hash, screen size, user-agent profiling)
- ❌ **NO Cross-Site Tracking**
- ❌ **NO Project IDs, Site Domains, or Editor URLs**
- ❌ **NO Form Data, Keystrokes, or Visitor PII**

### Key Compliance Safeguards:
1. **Framer Canvas Isolation (`RenderTarget` Check)**:
   ```typescript
   if (isCanvas || RenderTarget.current() === RenderTarget.canvas) return;
   ```
2. **Creator Opt-Out Toggle**:
   ```typescript
   if (!enableAnalytics || !ANALYTICS_ENABLED) return;
   ```
3. **Session Deduplication**:
   ```typescript
   const sessionKey = "cb_viewed_" + WIDGET_ID;
   if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(sessionKey)) {
       sessionStorage.setItem(sessionKey, "true");
       // Single aggregate increment
   }
   ```

---

## 4. Framer Review Team AI Questionnaire — Direct Answers

**Q: Does this plugin collect Framer site data or user data?**  
**A:** No sensitive site or user data is collected passively. Project ID (`framer.getProjectInfo().id`) is used strictly to scope widget settings and bind subscription licenses. Designer email is collected only when the creator explicitly registers via the Auth Modal for trial or Pro license delivery. No canvas content, project assets, visitor PII, or browsing history is ever collected or monetized.

**Q: Does the published component make network requests?**  
**A:** Yes, only to record anonymous aggregate view and click counters (`{ widgetId, eventType, channelId }`) for the creator's conversion metrics dashboard. No IP addresses, visitor cookies, domains, or project IDs are tracked. Site owners can disable this entirely via the Widget Analytics toggle in Settings.

**Q: Why does the plugin require `createCodeFile` and `CodeFile.setFileContent`?**  
**A:** Chat Bubbles is a code component generator. It creates `ChatBubbles.tsx` directly in the user's project so the floating chat widgets render natively on Framer canvas with maximum performance and zero layout shift.

---

## 5. Reviewer Verification Checklist

- [x] **No Referrer / Window Scraping**: Zero references to `document.referrer`, `window.location`, or ancestor origins.
- [x] **Minimal Passive Payload**: Routine startup check sends only `siteId` for license validation.
- [x] **Explicit Consent**: Account & trial actions gated behind user-initiated submission with disclosure.
- [x] **Anti-Abuse Justified**: Account creation used strictly for "1 Trial per Designer" enforcement.
- [x] **Stripe.js Graceful Fallback**: Verified error boundaries and fallback UI in `PaymentModal.tsx`.
- [x] **Stale Code Purged**: Dead password endpoints, reset helpers, and unused social code completely deleted.
- [x] **Zero `dangerouslySetInnerHTML`**: All markup is 100% static React SVG components and CSS styles.
- [x] **Clean Production Build**: `npm run build` succeeds with zero errors and package is ready.
