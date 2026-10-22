# How to troubleshoot common issues and frequently asked questions

This guide provides quick answers and step-by-step solutions to the most common setup questions and edge cases when building chat widgets with Chat Bubbles in Framer.

## Before you start

Make sure you are running the latest version of the Chat Bubbles plugin in Framer, and confirm that your project has been published to test features in your live browser environment.

## Video tutorial

[Add Troubleshooting and FAQ Video Tutorial]

## Frequently asked questions

### 1. How should I format phone numbers for WhatsApp, Viber, and SMS?

Always enter phone numbers in international format, including your country code:

- For United States and Canada: `+1 234 567 8900`
- For United Kingdom: `+44 7911 123456`
- For Australia: `+61 412 345 678`
- For Germany: `+49 151 12345678`

Do not include leading zeros, dashes, or parentheses in the number field, because messaging services like WhatsApp Web use raw international digits to initiate chats.

[Add Phone Number Formatting Example Screenshot]

---

### 2. Why does the notification sound chime not play automatically on mobile phones?

Modern mobile operating systems, including iOS and Android, have strict browser autoplay policies designed to prevent unwanted audio playback. Mobile browsers require a visitor to interact with the page first, such as tapping or scrolling, before allowing web applications to produce sound.

Once your visitor begins interacting with your page, the synthesized greeting chime will play normally when your appearance delay timer triggers.

---

### 3. How does Chat Bubbles work across Framer responsive breakpoints?

Chat Bubbles is built to adapt automatically across Desktop, Tablet, and Mobile layouts:

- On desktop screens, your full channel list or live chat modal appears using your configured **Desktop Offset X (px)** and **Desktop Offset Y (px)** margins.
- On screens under 640 pixels wide, the widget applies your **Mobile Offset X (px)** and **Mobile Offset Y (px)** settings.
- If you have five or more channels active, the **Mobile Layout Constraint (Cap 4+)** feature automatically caps visible mobile buttons to your top four platforms and adds a clean `+ More` expand button, keeping your mobile screen tidy.

[Add Responsive Breakpoint Preview Screenshot]

---

### 4. What should I do if the Framer canvas displays a duplicate component warning?

If you see a notice on your canvas stating that a duplicate component has been detected, check your Framer layers list. You only need to place one Chat Bubbles component on your primary page frame:

1. Select your page frame in the layers panel.
2. Verify that you have only one instance of the Chat Bubbles component inserted.
3. If you have multiple breakpoint frames, such as separate Desktop, Tablet, and Mobile variants on the same page, keep the component within your primary shared frame so it inherits seamlessly across all screen sizes.

---

### 5. Why do my latest changes in the plugin not show on my live website?

Whenever you adjust settings in the plugin interface, remember to click the **Update Component** button located in the bottom action bar.

[Add Update Component Button Screenshot]

After the green confirmation banner appears, click the **Publish** button in the top right corner of Framer to build and push your new production bundle live.

---

### 6. Can I position the floating button in a different corner?

Yes. Open the **Settings** tab and look under **Widget Placement**. Click the **Screen Corner Position** dropdown to choose from four options:

- **Bottom Right (Recommended)**
- **Bottom Left**
- **Top Right**
- **Top Left**

[Add Screen Corner Position Dropdown Screenshot]

Selecting a different corner moves both the floating launcher and any opened menus or modals to that designated area.

---

### 7. Does the analytics tracker store personal visitor data or use tracking cookies?

No. The built-in analytics engine is designed for privacy. It counts anonymous page impressions and button clicks using lightweight aggregation, without storing personal visitor data, IP addresses, or tracking cookies. You can safely run Chat Bubbles on privacy-conscious websites without requiring cookie consent banners for the chat widget.

---

### 8. How do I transfer my PRO license to another Framer project?

Each Chat Bubbles license is attached to a specific Framer site ID. If you start a new Framer project and want to transfer your existing subscription:

1. Copy your original purchase invoice number or account email.
2. Reach out to the Framefic support team through the official website at `https://www.framefic.com/`.
3. Provide your new Framer project URL or site ID, and the team will re-assign your license so you can activate PRO on your new canvas.

---

## Check that it works

If you encountered an issue earlier and applied one of the fixes above:

1. Reopen the Chat Bubbles plugin window in Framer.
2. Verify your channel numbers, offsets, and triggers.
3. Click **Update Component** in the bottom action bar.
4. Publish your Framer site and reload your live page in an incognito window to verify that your fix resolved the issue.

## What to read next

- [Getting Started](getting-started.md)
- [Configuring Messaging Channels](configure-messaging-channels.md)
- [Customizing Widget Design](customize-widget-design.md)
- [Plans and Billing](plans-and-billing.md)
