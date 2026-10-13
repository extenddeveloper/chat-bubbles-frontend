# Chat Bubbles — WhatsApp & Social Chat Buttons for Framer — Frontend MVP Plan

## Goal

Build a production-oriented Framer plugin that lets a designer configure a global floating social/chat widget and install it into the Framer site with one click.

The first release is frontend-only:
- No license server
- No account/login
- No remote API
- No analytics
- No backend dependency

Those concerns are deliberately isolated so they can be added later without rewriting the widget UI.

## Architecture

```text
Framer Plugin (React + TypeScript)
        |
        | stores project config
        v
Plugin Storage
        |
        | Apply
        v
Custom Code Service
        |
        | bodyEnd <script>...</script>
        v
Published Framer Site
        |
        v
Floating Chat Widget
```

Framer's Plugin API is used only in the editor. The actual live-site widget is generated as self-contained HTML/CSS/JS and installed with Framer Custom Code.

## Why Custom Code for the first version?

A global floating chat button is a site-level behavior. Custom Code allows the plugin to install one site-wide widget instead of requiring the designer to place a component on every page.

Later we can add an optional Code Component mode if needed.

## Current MVP Features

### Channels
- WhatsApp
- Facebook Messenger
- Instagram
- Telegram
- TikTok
- WeChat
- Viber
- LINE
- Signal
- Phone
- Email
- Custom URL

### Widget
- Floating button
- Expand/collapse menu
- Tooltip labels
- Channel-specific colors
- Compact and expanded layouts
- Bottom/right/left positioning
- Desktop/mobile offsets
- Button size
- Icon size
- Border radius
- Shadow
- Animation
- Unread badge
- Greeting bubble
- Greeting delay
- Auto-open
- Close after channel click
- Mobile label behavior
- Accessibility labels
- Reduced-motion support
- Escape key close
- Outside click close
- Keyboard focus support

### Plugin UI
- Dashboard
- Channels tab
- Design tab
- Behavior tab
- Live preview
- Save configuration
- Apply to site
- Remove from site
- Reset defaults
- Status indicator
- Future license placeholder

## Future Pro Architecture

```text
src/
  core/
    config.ts
    types.ts
    storage.ts
    licensing/
      license-service.ts       # future
  framer/
    custom-code-service.ts
    project-service.ts
  widget/
    widget-template.ts
    widget-runtime.ts          # future if externalized
  ui/
    components/
    screens/
```

Future backend:

```text
Plugin
  |
  +-- LicenseService
  |      |
  |      +-- activate
  |      +-- deactivate
  |      +-- validate
  |      +-- refresh
  |
  +-- TelemetryService (optional)
  |
  +-- UpdateService (optional)
```

## Important implementation decision

The widget code contains no secret and no license check. When licensing is introduced, license validation should gate plugin actions in the editor, not expose private API credentials in the published site.

## Release phases

### Phase 1 — Frontend MVP
This repository.

### Phase 2 — Pro polish
- Channel groups
- Custom icon upload
- Per-channel visibility rules
- Page targeting
- Device targeting
- Schedule
- RTL
- Advanced animation presets
- Multiple widget instances/profiles

### Phase 3 — Backend
- License activation
- Site/domain binding
- Subscription status
- Remote configuration
- Analytics
- Secure update channel

### Phase 4 — Marketplace
- Marketplace icon/screenshots
- Privacy policy
- Terms
- Support URL
- Permission review
- Production hosting
- Marketplace submission
