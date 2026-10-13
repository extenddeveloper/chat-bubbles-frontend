# Chat Bubbles - WhatsApp & Social Chat Buttons for Framer

Frontend-first advanced social/chat floating widget for Framer.

## Requirements

- Node.js 22+ recommended
- A Framer project
- Framer Developer Tools enabled

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Then open Framer:

1. Enable Developer Tools.
2. Open Plugins.
3. Open Development Plugin.
4. Use the local development plugin.

## Build

```bash
npm run build
```

## What the plugin does

The plugin provides a configuration UI and installs a self-contained floating chat widget through Framer Custom Code at `bodyEnd`.

It does not require a backend.

## Main files

- `src/App.tsx` — plugin UI and state
- `src/main.tsx` — plugin entry
- `src/core/config.ts` — defaults and normalization
- `src/core/types.ts` — shared types
- `src/core/storage.ts` — Framer project plugin-data persistence
- `src/framer/custom-code-service.ts` — Custom Code API wrapper
- `src/widget/widget-template.ts` — live-site widget generator
- `src/ui/components/*` — reusable plugin controls
- `public/icon.svg` — plugin icon
- `PLAN.md` — implementation and future backend plan

## Backend/licensing

No licensing code is included yet. The structure intentionally keeps editor configuration separate from live widget code so license authentication can be added later.
