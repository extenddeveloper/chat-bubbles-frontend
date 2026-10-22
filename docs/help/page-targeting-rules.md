# How to configure page targeting rules

This guide walks you through controlling where your chat widget appears across your website, from showing it on every page to targeting specific product sections or hiding it on checkout flows.

## Before you start

List the pages on your site where you want visitors to see chat assistance, such as high-intent pricing or support pages, and note any pages where you prefer an uncluttered view, such as minimal landing pages.

## Video tutorial

[Add Page Targeting Rules Video Tutorial]

## Step 1: Open Page Targeting in Settings

Click the **Settings** tab in the top navigation bar, then scroll down to the fourth card under **Behavioral Triggers & Smart Display** titled **Page / URL Targeting Filter**.

[Add Page Targeting Filter Card Screenshot]

This card controls the visibility logic that runs in the visitor browser when each page loads.

## Step 2: Choose your display target

Click the dropdown menu labeled **Where the widget will be shown?**:

- Select **Every page** if you want your floating chat button to remain accessible across your entire site. This is the default setting for most websites.
- Select a specific Framer page name, such as `Home`, `Pricing`, or `Contact`, if you only want the chat widget to appear on that single page.
- Select **Custom URL Paths & Wildcards...** if you want advanced control over multiple URL paths and subdirectories.

[Add Where Widget Will Be Shown Dropdown Screenshot]

## Step 3: Select your custom targeting mode

When you select **Custom URL Paths & Wildcards...**, two additional configuration fields will appear:

[Add Custom Targeting Mode Fields Screenshot]

In the **Targeting Mode** dropdown, choose your filtering approach:

- Select **Show Widget Only on Listed Paths** to hide the widget by default and only display it on the specific URL paths you enter. This approach is helpful when you only want chat on high-intent sales pages.
- Select **Hide Widget on Listed Paths (Show Everywhere Else)** to keep the widget visible across your entire website except on the specific pages you list. This approach is ideal for hiding chat on checkout, thank you, or distraction-free webinar pages.

## Step 4: Enter your URL paths and wildcards

In the **URL Paths & Wildcards** textarea, enter the paths you want to target, separating each entry onto a new line or with a comma:

- **Exact path matching:** Enter the precise path starting with a forward slash, such as `/pricing` or `/checkout`.
- **Wildcard matching:** Add an asterisk symbol (`*`) to target an entire section or folder structure:
  - `/blog/*` targets every post inside your blog directory, such as `/blog/news` and `/blog/announcements`.
  - `/products/*` targets all product detail pages in your store.
  - `/account/*` targets all customer account sub-pages.

[Add URL Paths Textarea Screenshot]

For example, to display chat only on your pricing page and product catalog, select **Show Widget Only on Listed Paths** and type:

```text
/pricing
/products/*
```

## Check that it works

Click **Update Component** in the bottom action bar, publish your Framer site, and navigate through different pages:

1. Visit a URL that you included in your list. Confirm that the floating chat button appears cleanly in its designated corner.
2. Visit a URL that you excluded or left out of an inclusion list. Confirm that the widget remains completely hidden without leaving any blank placeholder frames.
3. Check browser console logs if needed to verify that the targeting evaluation executes without errors.

## Troubleshooting

- **The widget shows on pages you intended to exclude:** Ensure each path in your list begins with a leading forward slash, such as `/checkout` rather than `checkout`.
- **Wildcards do not match child pages:** Check that your wildcard entry ends with `/*` rather than just `*`, for example `/blog/*` instead of `/blog*`.
- **You selected a single Framer page from the dropdown but renamed it later:** If you rename a page inside Framer, reopen the plugin, select the updated page name from the **Where the widget will be shown?** dropdown, and click **Update Component**.

## What to read next

- [Smart Triggers and Scheduling](smart-triggers-and-scheduling.md)
- [Tracking Conversion Analytics](track-conversion-analytics.md)
- [Troubleshooting and FAQ](troubleshooting-and-faq.md)
