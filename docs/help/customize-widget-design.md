# How to customize widget design

This guide walks you through styling every visual element of your chat widget, including the floating launcher button, menu layout, header gradients, entrance animations, and responsive mobile spacing.

## Before you start

Review your website color palette and typography so you can match your chat widget seamlessly to your existing design language.

## Video tutorial

[Add Customizing Widget Design Video Tutorial]

## Step 1: Select your widget mode

On the **Design** tab, review the **Widget Experience Mode** section:

- Choose **Live Chat Modal** to display an interactive popup window containing your header gradient, team member roster, speech bubble preview, and start chat action button.
- Choose **Icon Buttons** to expand your active channels as a floating icon list without opening a larger window.

[Add Widget Mode Switcher Screenshot]

Your selection here determines which design options appear in the **Design** tab.

## Step 2: Customize the modal header and theme gradient

Click the **Design** tab in the top navigation bar. Look under **Chat Window Header & Theme** to style your modal:

1. **Header Theme Gradient:** Select one of the curated brand gradients, such as **WhatsApp**, **Messenger**, **Telegram**, **Instagram**, **TikTok**, **WeChat**, or **Modern Dark**.
2. **Custom Gradient:** Select **Custom** to open the interactive gradient builder. You can pick your starting color, ending color, and rotation angle, or select from curated gradient swatches.
3. **Header Title:** Enter your main greeting, such as `Hi there!`.
4. **Response Time Badge:** Enter an encouraging turnaround time, such as `Typically replies in minutes` or `Online now`.
5. **Header Subtitle:** Enter a welcoming prompt that invites visitors to ask questions.

[Add Header Theme Gradient Screenshot]

## Step 3: Style the chat preview and call to action

Scroll down to the **Chat Preview & Start CTA** section:

- **Welcome Chat Bubble Message:** Enter the friendly message that appears inside the simulated chat bubble in your modal window, such as `Hello! How can someone assist today?`.
- **CTA Button Text:** Enter the label for the primary action button at the bottom of the modal, such as `Start chat` or `Send a message`.

[Add Chat Preview and CTA Settings Screenshot]

## Step 4: Configure the floating launcher button

In the **Floating Launcher Design** section, tailor the appearance of the button that sits permanently on your visitor screen:

1. **Toggle Button Icon:** Choose the icon that represents your business best, such as **Live Chat (Speech Bubble)**, **WhatsApp**, **Messenger**, **Telegram**, **Instagram**, **Phone Call**, **Email**, or **Customer Support (Headset)**.
2. **Button Shape:** Choose **Circle**, **Rounded Square**, or **Pill** to match the border radii of other buttons on your site.
3. **Button Size:** Choose **Small (46px)** for compact pages, **Medium (56px)** for standard layouts, or **Large (64px)** for high visibility.
4. **Launcher Default Color:** Select your brand accent color using the custom color picker.

[Add Floating Launcher Shape and Icon Screenshot]

## Step 5: Choose menu layout and entrance animations

If you use the **Icon Buttons** mode or want to adjust transition effects:

- **Button Menu Layout:** Choose **Stack (Vertical)** to display channels in an upright column, **Grid (2 Columns)** to save vertical space, or **Horizontal Row** to stretch buttons across the bottom.
- **Entrance Animation:** Select **Pop In** for a spring effect, **Playful Bounce** for a lively arrival, **Slide Up** for a smooth upward reveal, **Pulse Glow** for an eye-catching heartbeat, or **None (Instant)** for an immediate appearance.

[Add Menu Layout and Animation Settings Screenshot]

## Step 6: Adjust desktop and mobile corner offsets

Control the exact pixel distance between your floating button and the edges of the browser window:

1. **Desktop Offset X (px)** and **Desktop Offset Y (px):** Set horizontal and vertical margins for desktop screens, with default values of 24 pixels each.
2. **Mobile Offset X (px)** and **Mobile Offset Y (px):** Set separate margins for mobile screens under 640 pixels wide, with default values of 16 pixels each.
3. **Mobile Layout Constraint (Cap 4+):** Keep this toggle enabled if you have five or more channels active. It automatically limits visible mobile buttons to your top four channels and adds an expandable `+ More` button, keeping your mobile layout clean and uncluttered.

[Add Mobile Spacing and Cap Settings Screenshot]

## Step 7: Configure unread badges and accessibility labels

Add finishing touches for visitor engagement and accessibility:

- **Unread Notification Badge:** Turn on this toggle and enter a number such as `1` in the **Badge Text** field to display a red notification dot that catches the visitor eye.
- **Accessibility ARIA Label:** Enter clear screen reader text, such as `Open chat options`, so visitors using assistive technology can navigate your chat widget effortlessly.

[Add Notification Badge and ARIA Settings Screenshot]

## Check that it works

Click **Update Component** in the bottom action bar, publish your Framer site, and review your design:

1. Open your live site on desktop and resize your browser window to test mobile responsive breakpoints.
2. Check that your launcher button displays the correct icon, shape, color, and entrance animation.
3. Click the launcher to verify that your header gradient, title, response badge, and mobile four-channel constraint render smoothly.

## Troubleshooting

- **The launcher overlaps your sticky mobile footer:** Increase the **Mobile Offset Y (px)** value in the **Floating Launcher Design** section, then update your component and re-publish your site.
- **The custom gradient does not display:** Make sure you selected the **Custom** swatch in the **Header Theme Gradient** grid before adjusting colors in the gradient color picker.
- **Button labels do not appear on mobile:** Check the **Settings** tab and turn on the **Labels on Mobile** toggle if you want text labels displayed beside channel icons on smaller screens.

## What to read next

- [Configuring Messaging Channels](configure-messaging-channels.md)
- [Greetings and Sound Alerts](greetings-and-sound-alerts.md)
- [Smart Triggers and Scheduling](smart-triggers-and-scheduling.md)
- [Page Targeting Rules](page-targeting-rules.md)
