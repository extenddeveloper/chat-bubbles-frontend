# How to configure smart triggers and scheduling

This guide explains how to show your chat widget at high-converting moments using scroll depth and desktop exit-intent triggers, and how to set automated business hours to manage customer expectations.

## Before you start

Review your visitor habits and team availability so you can choose appropriate scroll percentages, exit actions, and office hours.

## Video tutorial

[Add Smart Triggers and Scheduling Video Tutorial]

## Step 1: Open Behavioral Triggers in Settings

Click the **Settings** tab in the top navigation bar, then scroll down to the section titled **Behavioral Triggers & Smart Display**.

[Add Behavioral Triggers Section Overview Screenshot]

You will find three independent automation tools: the **Scroll Depth Trigger**, the **Exit-Intent Trigger (Desktop)**, and the **Operating Hours & Days Schedule**.

## Step 2: Configure the scroll depth trigger

Locate the **Scroll Depth Trigger** card and turn on the toggle switch on the right side of the card header.

[Add Scroll Depth Trigger Card Screenshot]

When enabled, two configuration controls appear:

1. **Scroll Percentage Threshold:** Drag the slider between 5% and 95% to set how far down the page a visitor must scroll before triggering an action. A setting of 25% to 50% is effective for blogs and long product pages.
2. **Trigger Target:** Choose what happens when the visitor reaches that depth:
   - Select **Floating Launcher (Reveal Entire Widget)** to keep the chat button completely hidden until the visitor scrolls to your threshold.
   - Select **Greeting Bubble Only (Launcher Stays Visible)** to keep the launcher button visible immediately, but delay showing the speech bubble until the visitor scrolls down.

## Step 3: Enable the desktop exit-intent trigger

Locate the **Exit-Intent Trigger (Desktop)** card and turn on the toggle switch.

[Add Exit-Intent Trigger Card Screenshot]

This trigger uses mouse tracking technology on desktop computers to detect when a visitor cursor moves rapidly toward the browser tab bar or window close button:

- **Exit-Intent Action:** Choose the response that fits your marketing strategy:
  - Select **Pop Open Chat Window (High Conversion)** to open the full live chat modal and give leaving visitors an immediate opportunity to ask questions or request assistance before leaving.
  - Select **Display Greeting Bubble (Subtle Notice)** to pop up the smaller speech bubble with a parting question without covering the page.

## Step 4: Set your business operating hours and days

Locate the **Operating Hours & Days Schedule** card and turn on the toggle switch.

[Add Operating Hours Schedule Card Screenshot]

Configure your active work schedule using the controls:

1. **Operating Days:** Click individual day pills (**Mon**, **Tue**, **Wed**, **Thu**, **Fri**, **Sat**, **Sun**) to toggle active days, or click one of the quick preset buttons:
   - **Weekdays (Mon-Fri)** for standard office hours.
   - **Weekends** for Saturday and Sunday operations.
   - **All 7 Days** for continuous coverage.
2. **Opening Time** and **Closing Time:** Set the times when your team starts and finishes work each day, such as `09:00` and `18:00`.
3. **Outside Hours Action:** Decide what the widget does outside your operating hours:
   - Select **Show "Offline" Badge & Notice** to keep the widget available for messages while displaying an offline notice in the modal header.
   - Select **Hide Widget Completely** if you do not want visitors attempting to start chats when no team members are available to answer.
4. **Offline Badge Notice:** Enter a helpful note for visitors outside hours, such as `Back tomorrow at 9:00 AM`.

[Add Schedule Times and Offline Action Screenshot]

## Check that it works

Click **Update Component** in the bottom action bar, publish your Framer site, and test your triggers:

1. To test the **Scroll Depth Trigger**, open your live page and scroll slowly. Confirm that the launcher button or greeting bubble appears when you cross your configured scroll threshold.
2. To test the **Exit-Intent Trigger**, open your page on a desktop computer, wait three seconds, then move your mouse cursor smoothly toward the top browser tab bar. Confirm that your modal or speech bubble appears instantly.
3. To test the **Operating Hours Schedule**, temporarily set your closing time to five minutes in the past and reload your page to confirm that the offline notice or hiding rule takes effect.

## Troubleshooting

- **The exit-intent trigger does not fire on mobile phones:** Mobile devices do not have mouse cursors, so exit-intent detection runs exclusively on desktop browsers. Use the **Scroll Depth Trigger** or appearance delay timers for mobile visitors instead.
- **The widget hides during business hours:** Check that the time on your computer matches the opening and closing hours you entered, and confirm that the current day of the week is highlighted among your active operating days.
- **The scroll trigger fires too early:** Increase the **Scroll Percentage Threshold** slider to a higher number, such as 50% or 75%, so visitors have to read further down your page before seeing the widget.

## What to read next

- [Greetings and Sound Alerts](greetings-and-sound-alerts.md)
- [Page Targeting Rules](page-targeting-rules.md)
- [Tracking Conversion Analytics](track-conversion-analytics.md)
- [Troubleshooting and FAQ](troubleshooting-and-faq.md)
