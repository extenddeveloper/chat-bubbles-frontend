# How to configure messaging channels

This guide helps you connect, customize, and organize your communication channels so your visitors can reach you through the messaging apps they already use and trust.

## Before you start

Gather your official social handles, customer support phone numbers, email addresses, and community invite links before you begin, because having these on hand makes entering your channel details quick and effortless.

## Video tutorial

[Add Configuring Messaging Channels Video Tutorial]

## Step 1: Open the Channels builder

Click the **Builder** tab in the top navigation bar, then select the **Channels** sub-tab. You will see a list of 19 supported platforms with their official brand icons, descriptive hints, and status toggles.

[Add Channels List Overview Screenshot]

Channels that are already enabled display an **Active** pill next to their title. You can click the arrow icon on the right side of any active card to expand or minimize its configuration options.

## Step 2: Enable your preferred platforms

Browse the list of supported channels and use the toggle switch on the right side of any platform to turn it on:

- **WhatsApp:** Direct chat via web or mobile app.
- **Messenger:** Direct chat through Facebook page or username.
- **Instagram:** Direct profile messaging.
- **Telegram:** Instant messaging via username or channel.
- **TikTok:** Profile connection for social engagement.
- **WeChat:** WeChat ID or QR code profile link.
- **Viber:** Direct messaging via verified phone number.
- **LINE:** Official or personal LINE account connection.
- **Signal:** Secure communication via profile handle or link.
- **Phone:** Direct phone dialer link for mobile and desktop callers.
- **SMS:** Mobile text messaging with ready-to-send messages.
- **Email:** Direct email client link with subject and body pre-filled.
- **Discord:** Community or server invite link.
- **Slack:** Team workspace or community channel invite URL.
- **Microsoft Teams:** Direct chat email or meeting link.
- **X (Twitter):** Profile link or direct message handle.
- **LinkedIn:** Personal profile or company page link.
- **Google Maps:** Direct link to your physical storefront or office location.
- **Custom URL Link:** Any external web address, booking page, or custom link protocol.

[Add Enable Channel Toggle Screenshot]

## Step 3: Enter your contact handle or number

In each enabled channel card, enter your handle or number in the primary input field. The placeholder text gives you a clear example of the expected format:

- For phone-based channels like **WhatsApp**, **Viber**, **Phone**, and **SMS**, enter your complete phone number including your country code, such as `+1 234 567 8900`.
- For handle-based platforms like **Instagram**, **Telegram**, and **TikTok**, enter your username without the `@` symbol.
- For **Messenger**, enter your public Facebook page name or profile username.

[Add Channel Handle Input Screenshot]

## Step 4: Customize your channel button colors

Every platform comes with its official brand color by default, but you can change any button color to match your website theme. Click the color circle in the **Button Color** field to open the color picker.

[Add Custom Color Picker Screenshot]

You can choose from the curated color palette, enter a custom HEX code, or use the interactive color gradient slider to find your ideal shade.

## Step 5: Add pre-filled messages and email subjects

For **WhatsApp**, **Telegram**, and **SMS**, you can fill in the **Pre-filled Welcome Message** field so that when visitors click the button, their chat window opens with a draft message already written for them.

[Add Pre-filled Welcome Message Screenshot]

You can make your messages dynamic by using two automatic placeholder tags:

- `{title}`: Inserts the title of the page the visitor is currently viewing.
- `{url}`: Inserts the full web address of the current page.

For example, typing `Hello! I have a question about {title} at {url}.` will automatically substitute your product or article name when the visitor clicks the button.

If you enable **Email**, you can enter a default **Email Subject** such as `Inquiry from website`, and write a template in the **Pre-filled Email Message Body** field so inquiries reach your inbox with structured context.

[Add Email Channel Configuration Screenshot]

## Step 6: Create custom links for external tools

If you use a third-party booking calendar, a knowledge base, or a custom web app, enable the **Custom URL Link** platform at the bottom of the list.

[Add Custom Channel Configuration Screenshot]

When configuring a custom link:

1. Enter your destination address in the **Custom URL Link** field, such as `https://calendly.com/your-team/30min`.
2. Enter a friendly name in the **Channel / Button Label** field, such as `Book a Call` or `Help Docs`.
3. Pick a custom **Button Color** to distinguish it from standard chat icons.
4. Use the **Open Link In** toggle to choose whether the link opens in a **New browser tab** or stays in the **Same browser tab**.

## Check that it works

After configuring your channels, click **Update Component** or **Insert into Canvas** in the bottom action bar. Publish your Framer site and test your buttons:

1. Click your floating chat button to open your channel list or modal.
2. Click each enabled channel to verify that it directs visitors to the correct profile, phone dialer, or messaging app.
3. Check that your pre-filled welcome text appears correctly in WhatsApp and that the `{title}` tag displays your page title.

## Troubleshooting

- **WhatsApp opens a blank chat without your pre-filled message:** Ensure you entered text into the **Pre-filled Welcome Message** field and updated your canvas component before publishing.
- **Your custom link does not open when clicked:** Check that your link begins with `https://` or `http://` so the browser recognizes it as a valid web destination.
- **You enabled a channel but it does not appear in the floating menu:** Verify that the channel has both its toggle turned on and a non-empty handle or URL entered into its primary field.

## What to read next

- [Adding Support Team Agents](add-support-team-agents.md)
- [Customizing Widget Design](customize-widget-design.md)
- [Greetings and Sound Alerts](greetings-and-sound-alerts.md)
- [Tracking Conversion Analytics](track-conversion-analytics.md)
