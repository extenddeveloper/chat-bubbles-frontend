# How to configure greetings and sound alerts

This guide shows you how to greet site visitors with proactive speech bubbles, audio chimes, and automatic timers that draw attention to your chat button without feeling intrusive.

## Before you start

Decide on a brief, welcoming message that encourages visitors to start a conversation, such as asking if they need help finding a product or choosing a pricing plan.

## Video tutorial

[Add Greetings and Sound Alerts Video Tutorial]

## Step 1: Enable the floating greeting bubble

Click the **Design** tab in the top navigation bar, scroll to the bottom of the **Floating Launcher Design** section, and locate **Greeting Bubble Preview**.

[Add Greeting Bubble Preview Toggle Screenshot]

Toggle on **Greeting Bubble Preview** to activate the feature. A new text input field labeled **Greeting Bubble Text** will appear below the toggle.

## Step 2: Write your greeting message

In the **Greeting Bubble Text** field, type a friendly, inviting sentence:

- For ecommerce stores: `Have a question about sizing or shipping? Start a live chat!`
- For agencies and service providers: `Looking for a custom quote? Talk to a specialist.`
- For general help: `Need help? Tap here to start chatting.`

[Add Greeting Bubble Text Field Screenshot]

This message appears in a small speech bubble next to your floating launcher button after visitors arrive on your website.

## Step 3: Set greeting appearance delay

Click the **Settings** tab in the top navigation bar and scroll down to the **Interaction & Behavior** section.

[Add Interaction and Behavior Section Screenshot]

Find the field labeled **Greeting Appearance Delay (Seconds)**. Enter the number of seconds you want the widget to wait after a page loads before popping up the speech bubble:

- Enter `2` or `3` seconds if you want visitors to see the prompt almost immediately.
- Enter `5` to `10` seconds if you prefer giving visitors time to start reading your page first.

## Step 4: Turn on the notification sound chime

In the same **Interaction & Behavior** section, find the setting labeled **Greeting Bubble Sound**.

[Add Greeting Bubble Sound Toggle Screenshot]

1. Click the toggle switch to enable sound alerts.
2. Click the **Test Sound** button beside the toggle to hear an instant preview of the synthesized notification chime.

When enabled, this subtle, pleasant audio chime plays at the exact moment your greeting bubble appears, attracting the visitor attention even if they are focused on reading another part of the page.

## Step 5: Configure auto-open and closing behavior

You can fine-tune how the chat widget responds to visitor interactions in the **Interaction & Behavior** section:

- **Auto-open on Load:** Turn on this toggle if you want your live chat modal or button menu to pop open automatically. When enabled, enter an **Auto-open Delay (Seconds)** to control the timing.
- **Close on Outside Click:** Keep this enabled so the widget closes whenever a visitor clicks anywhere outside the chat window.
- **Close on Escape Key:** Keep this enabled to allow visitors using desktop keyboards to dismiss the chat by pressing the `Escape` key.
- **Close After Clicking Channel:** Keep this enabled so the menu collapses cleanly after a visitor clicks a communication channel.
- **Open Channels in New Tab:** Keep this enabled so that when visitors click WhatsApp or Messenger, the app opens in a fresh browser tab while keeping your site open in the original tab.

[Add Auto-open and Close Settings Screenshot]

## Check that it works

Click **Update Component** in the bottom action bar, publish your Framer site, and open your live page:

1. Wait for the configured delay period without clicking anything.
2. Confirm that the greeting bubble appears beside the floating button with your custom text.
3. If sound is enabled, confirm that you hear the notification chime as the bubble appears.
4. Click outside the bubble or click your launcher to verify that opening and closing behaviors work as expected.

## Troubleshooting

- **The sound chime does not play on mobile devices:** Modern mobile web browsers such as Safari on iOS and Chrome on Android block audio until the visitor performs their first tap or scroll on the page. Once the visitor interacts with your site, audio plays normally.
- **The greeting bubble does not show up:** Check the **Design** tab to ensure the **Greeting Bubble Preview** toggle is turned on, and confirm in **Settings** that your appearance delay is set to a reasonable number of seconds.
- **The chat opens immediately when you load the page:** Check whether **Auto-open on Load** is enabled in the **Settings** tab. Turn it off if you only want the speech bubble to appear without expanding the full modal.

## What to read next

- [Customizing Widget Design](customize-widget-design.md)
- [Smart Triggers and Scheduling](smart-triggers-and-scheduling.md)
- [Page Targeting Rules](page-targeting-rules.md)
- [Tracking Conversion Analytics](track-conversion-analytics.md)
