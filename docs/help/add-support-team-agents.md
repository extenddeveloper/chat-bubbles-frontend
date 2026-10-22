# How to add support team agents

This guide explains how to build a welcoming team roster inside your live chat modal so visitors can choose the right person or department for their inquiry.

## Before you start

Make sure your widget experience mode is set to **Live Chat Modal** on the **Design** tab, because team agents appear specifically inside the interactive modal window. Also ensure you have enabled at least one channel on the **Channels** tab so your agents have platforms to receive messages.

## Video tutorial

[Add Adding Support Team Agents Video Tutorial]

## Step 1: Open the Support Team builder

Click the **Builder** tab in the top navigation bar, then click the **Support Team** sub-tab. You will see your active team roster with preset agents, along with their avatar photos, names, department roles, and assigned communication channels.

[Add Support Team Overview Screenshot]

Each agent card includes a gear icon to configure detailed settings, and a remove icon to delete the agent if needed.

## Step 2: Add a new team member

Click the **Add Team Member** button at the bottom of the list to open the new agent form.

[Add Add Team Member Form Screenshot]

Enter the basic details for your team member:

1. **Agent Name:** Enter the full name or display name of the specialist, such as `Emma Watson`.
2. **Role / Department:** Enter their job title or area of expertise, such as `Sales Specialist` or `Billing Support`.
3. **Assigned Channel:** Pick from your enabled channels in the dropdown menu so incoming messages route to the right platform.

## Step 3: Choose or upload an avatar photo

You can provide a friendly face for every agent using any of three avatar options in the **Avatar Photo** section:

- **Upload Image:** Click **Choose Image File** to upload a JPG, PNG, WebP, or SVG file from your computer. The photo uploads securely to the Framer content delivery network for fast global loading.
- **Presets:** Click the **Presets** tab and select one of ten professionally illustrated avatar icons for a polished look without taking your own photos.
- **Image URL:** Click the **Image URL** tab and paste a public image link if your team photos are already hosted online.

[Add Avatar Selection Options Screenshot]

Click **Add to Team** when finished to insert your new agent into the roster.

## Step 4: Configure direct numbers and custom greetings

To customize an agent's individual contact details, click the gear icon on their card to expand their advanced settings.

[Add Agent Advanced Settings Screenshot]

You can configure several personalized options:

- **Direct Channel Number or Handle:** If an agent has their own phone extension, WhatsApp number, or Telegram username, enter it here. Leaving this field blank means the agent will inherit the default number configured in the **Channels** tab.
- **Direct Pre-filled Message:** Write a personal greeting that pre-fills when visitors choose this specific agent, such as `Hi there! Emma here from billing. How can I help you today?`.
- **Direct Email Subject:** If the agent is assigned to email, you can customize the subject line for inquiries directed to them.

## Step 5: Set online and offline availability

Every agent card features an **Active / Online** toggle switch.

[Add Agent Online Status Toggle Screenshot]

- When toggled on, a vibrant green status dot appears on the agent avatar in your live chat modal, signaling to visitors that this team member is available to respond quickly.
- When toggled off, the status dot switches to an away indicator, letting visitors know the agent is currently offline.

Click **Done** at the bottom of the expanded card to collapse the settings once your changes are complete.

## Check that it works

After configuring your team, click **Update Component** in the bottom action bar, publish your Framer site, and open your live page:

1. Click the floating launcher button to open your live chat modal.
2. Verify that all team members appear in the roster with their correct avatars, names, roles, and status indicators.
3. Click an agent to verify that the conversation opens directly to their assigned channel and includes their custom greeting text.

## Troubleshooting

- **A channel does not appear in the Assigned Channel dropdown:** Make sure the channel is enabled on the **Channels** sub-tab first, because only active platforms appear in the team assignment menu.
- **An uploaded avatar does not display properly:** Verify that your image file is a valid JPG, PNG, or WebP format under 5 megabytes in size so that Framer can process the upload cleanly.
- **Changes to agent names do not appear on your published site:** Remember to click **Update Component** in the bottom bar and re-publish your Framer project to push your latest edits live.

## What to read next

- [Configuring Messaging Channels](configure-messaging-channels.md)
- [Customizing Widget Design](customize-widget-design.md)
- [Greetings and Sound Alerts](greetings-and-sound-alerts.md)
- [Smart Triggers and Scheduling](smart-triggers-and-scheduling.md)
