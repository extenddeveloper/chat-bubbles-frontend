# How to get started with Chat Bubbles

This guide walks you through setting up your first floating chat button in Framer, connecting your favorite messaging apps, and publishing the widget to your live website in just a few minutes.

## Before you start

Make sure you have an active project open in your Framer desktop app or web browser, because you will insert your chat component directly onto your project canvas.

## Video tutorial

[Add Getting Started Video Tutorial]

## Step 1: Open the Chat Bubbles plugin in Framer

Open your Framer project, click the **Plugins** icon in the top toolbar or press `Shift + I`, and search for **Chat Bubbles**. Click the plugin name to launch the configuration window.

[Add Plugin Launch Window Screenshot]

When the window opens, you will see the **Home** tab with an overview card showing your active widget mode, your active channel count, and your support team count.

## Step 2: Choose your widget experience mode

Click the **Design** tab in the top navigation bar and look under **Widget Experience Mode** to decide how your visitors will interact when clicking your floating button:

- Select **Live Chat Modal** if you want a modern chat popup with your team member avatars, a custom header gradient, and an introductory greeting bubble.
- Select **Icon Buttons** if you prefer a classic floating menu that expands directly into a list of social platform buttons.

[Add Widget Experience Mode Selection Screenshot]

Clicking either card updates your widget mode immediately so you can preview the layout as you work.

## Step 3: Enter your primary messaging details

Click the **Builder** tab in the top navigation bar, then make sure the **Channels** sub-tab is selected. You will see a list of 19 supported communication platforms with **WhatsApp**, **Messenger**, and **Telegram** enabled by default.

[Add Channels Tab Overview Screenshot]

Find your preferred platform and enter your contact information:

1. For **WhatsApp**, enter your phone number with your international country code in the input field, such as `+1 234 567 8900`.
2. Expand the card to add a **Pre-filled Welcome Message** if you want your visitors to start conversations with a ready-made greeting.
3. Use the toggle switch on the right side of any channel card to enable or disable that platform.

[Add WhatsApp Channel Configuration Screenshot]

## Step 4: Insert the component onto your Framer canvas

Once your contact details are in place, scroll to the bottom of the plugin window and click the **Insert into Canvas** button.

[Add Insert into Canvas Button Screenshot]

The plugin will generate a clean Framer component and place it on your active canvas. A notification banner will confirm that your component has been created. You can drag the component into your main layout frame or leave it anchored to your page.

## Step 5: Publish your site and test the live chat

Click the **Publish** button in the top right corner of your Framer interface, then open your live website URL in a new browser tab.

[Add Published Site Preview Screenshot]

You will see your floating chat button anchored cleanly to the bottom right corner of your screen. Click the button to confirm that your messaging modal opens and that clicking your channel launches the correct conversation.

## Check that it works

To verify that your setup is working properly:

1. Visit your published site on both desktop and mobile devices.
2. Click the floating chat button to open the modal or button menu.
3. Click your **WhatsApp** or social channel button. Your browser should open the corresponding chat app with your phone number or profile pre-loaded.
4. If you have analytics enabled in **Settings**, reopen the plugin after testing and click the **Analytics** tab to see your test clicks recorded in real time.

## Troubleshooting

- **The button does not appear after publishing:** Check your Framer layers panel to ensure the Chat Bubbles component is inside your primary page frame rather than positioned off-canvas.
- **WhatsApp shows an invalid phone number error:** Verify that your phone number includes your international country code without any special symbols, brackets, or leading zeros.
- **You want to change your colors or button position:** Reopen the plugin, adjust your settings in the **Design** or **Settings** tabs, and click **Update Component** to refresh your canvas instance without replacing it.

## What to read next

- [Configuring Messaging Channels](configure-messaging-channels.md)
- [Adding Support Team Agents](add-support-team-agents.md)
- [Customizing Widget Design](customize-widget-design.md)
- [Tracking Conversion Analytics](track-conversion-analytics.md)
