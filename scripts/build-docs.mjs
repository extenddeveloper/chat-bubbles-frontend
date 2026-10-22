import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    BorderStyle,
    WidthType,
    AlignmentType,
    convertInchesToTwip,
    ShadingType
} from "docx"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")
const docsDir = path.join(rootDir, "docs")
const helpDir = path.join(docsDir, "help")
const featuresFile = path.join(docsDir, "highlighted-features", "features.md")

const orderedHelpFiles = [
    { file: "getting-started.md", title: "1. Getting Started" },
    { file: "configure-messaging-channels.md", title: "2. Configuring Messaging Channels" },
    { file: "add-support-team-agents.md", title: "3. Adding Support Team Agents" },
    { file: "customize-widget-design.md", title: "4. Customizing Widget Design" },
    { file: "greetings-and-sound-alerts.md", title: "5. Greetings and Sound Alerts" },
    { file: "smart-triggers-and-scheduling.md", title: "6. Smart Triggers and Scheduling" },
    { file: "page-targeting-rules.md", title: "7. Page Targeting Rules" },
    { file: "track-conversion-analytics.md", title: "8. Tracking Conversion Analytics" },
    { file: "plans-and-billing.md", title: "9. Plans and Billing" },
    { file: "troubleshooting-and-faq.md", title: "10. Troubleshooting and FAQ" },
]

// 1. Read README for glossary
const readmeRaw = fs.readFileSync(path.join(helpDir, "README.md"), "utf8")
// Extract Terms used in these docs
const termsMatch = readmeRaw.match(/## Terms used in these docs([\s\S]*?)## Suggested reading order/)
const termsContent = termsMatch ? termsMatch[1].trim() : ""

// 2. Read features.md
const featuresRaw = fs.readFileSync(featuresFile, "utf8")

// 3. Assemble full Markdown Document
let fullMarkdown = `# Chat Bubbles for Framer - Complete User Documentation & Feature Guide

A complete, step-by-step user manual and feature reference for Chat Bubbles, the multi-channel live chat and social contact button plugin for Framer.

---

## Table of Contents

- [Terms Used in These Docs](#terms-used-in-these-docs)
- [Part 1: Highlighted Features for App Store & Landing Page](#part-1-highlighted-features-for-app-store--landing-page)
- [Part 2: Step-by-Step User Guides](#part-2-step-by-step-user-guides)
  - [1. How to Get Started with Chat Bubbles](#1-how-to-get-started-with-chat-bubbles)
  - [2. How to Configure Messaging Channels](#2-how-to-configure-messaging-channels)
  - [3. How to Add Support Team Agents](#3-how-to-add-support-team-agents)
  - [4. How to Customize Widget Design](#4-how-to-customize-widget-design)
  - [5. How to Configure Greetings and Sound Alerts](#5-how-to-configure-greetings-and-sound-alerts)
  - [6. How to Configure Smart Triggers and Scheduling](#6-how-to-configure-smart-triggers-and-scheduling)
  - [7. How to Configure Page Targeting Rules](#7-how-to-configure-page-targeting-rules)
  - [8. How to Track Conversion Analytics](#8-how-to-track-conversion-analytics)
  - [9. How to Manage Plans and Billing](#9-how-to-manage-plans-and-billing)
  - [10. How to Troubleshoot Common Issues and Frequently Asked Questions](#10-how-to-troubleshoot-common-issues-and-frequently-asked-questions)

---

## Terms Used in These Docs

${termsContent}

---

# Part 1: Highlighted Features for App Store & Landing Page

${featuresRaw.replace(/^# Highlighted Features\s+/, "")}

---

# Part 2: Step-by-Step User Guides

`

orderedHelpFiles.forEach(({ file, title }) => {
    const content = fs.readFileSync(path.join(helpDir, file), "utf8")
    fullMarkdown += `\n\n---\n\n${content}\n`
})

// Write full markdown
const mdOutputPath = path.join(docsDir, "Chat-Bubbles-User-Documentation.md")
fs.writeFileSync(mdOutputPath, fullMarkdown, "utf8")
console.log("Created:", mdOutputPath)

// 4. Generate HTML version
function markdownToHtml(md) {
    let html = md
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code>$1</code>')
        .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
        .replace(/^---$/gim, '<hr/>')

    html = html.replace(/\[Add (.*?) Screenshot\]/g, '<div class="placeholder screenshot"><strong>[Screenshot Placeholder: $1]</strong></div>')
    html = html.replace(/\[Add (.*?) Video Tutorial\]/g, '<div class="placeholder video"><strong>[Video Tutorial Placeholder: $1]</strong></div>')

    const lines = html.split('\n')
    let inUl = false
    let inOl = false
    const outputLines = []

    for (let line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inUl) {
                outputLines.push('<ul>')
                inUl = true
            }
            outputLines.push(`<li>${trimmed.substring(2)}</li>`)
        } else if (/^\d+\.\s/.test(trimmed)) {
            if (!inOl) {
                outputLines.push('<ol>')
                inOl = true
            }
            outputLines.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`)
        } else {
            if (inUl) {
                outputLines.push('</ul>')
                inUl = false
            }
            if (inOl) {
                outputLines.push('</ol>')
                inOl = false
            }
            if (trimmed.length > 0 && !trimmed.startsWith('<h') && !trimmed.startsWith('<hr') && !trimmed.startsWith('<div') && !trimmed.startsWith('<pre')) {
                outputLines.push(`<p>${line}</p>`)
            } else {
                outputLines.push(line)
            }
        }
    }
    if (inUl) outputLines.push('</ul>')
    if (inOl) outputLines.push('</ol>')

    return outputLines.join('\n')
}

const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chat Bubbles for Framer - Complete User Documentation</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937;
    background-color: #ffffff;
    line-height: 1.65;
    max-width: 860px;
    margin: 40px auto;
    padding: 0 24px;
  }
  h1 {
    font-size: 28px;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 12px;
    margin-top: 40px;
  }
  h2 {
    font-size: 22px;
    color: #1e293b;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 8px;
    margin-top: 32px;
  }
  h3 {
    font-size: 18px;
    color: #334155;
    margin-top: 24px;
  }
  h4 {
    font-size: 15px;
    color: #475569;
  }
  p {
    margin: 12px 0;
  }
  ul, ol {
    padding-left: 24px;
    margin: 12px 0;
  }
  li {
    margin: 6px 0;
  }
  strong {
    color: #0f172a;
  }
  code {
    background-color: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    color: #0369a1;
  }
  pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
  }
  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
  }
  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 32px 0;
  }
  .placeholder {
    margin: 16px 0;
    padding: 14px 18px;
    border-radius: 8px;
    font-size: 14px;
    display: block;
  }
  .placeholder.screenshot {
    background-color: #eff6ff;
    border: 1px dashed #3b82f6;
    color: #1d4ed8;
  }
  .placeholder.video {
    background-color: #fdf4ff;
    border: 1px dashed #c084fc;
    color: #7e22ce;
  }
  a {
    color: #2563eb;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
</style>
</head>
<body>
${markdownToHtml(fullMarkdown)}
</body>
</html>`

const htmlOutputPath = path.join(docsDir, "Chat-Bubbles-User-Documentation.html")
fs.writeFileSync(htmlOutputPath, styledHtml, "utf8")
console.log("Created:", htmlOutputPath)

// 5. Generate Native .docx Document
async function generateDocx() {
    const children = []

    function parseInline(text) {
        const runs = []
        const regex = /(\*\*.*?\*\*|`.*?`)/g
        const parts = text.split(regex)

        for (const part of parts) {
            if (!part) continue
            if (part.startsWith("**") && part.endsWith("**")) {
                runs.push(new TextRun({ text: part.slice(2, -2), bold: true, color: "0F172A" }))
            } else if (part.startsWith("`") && part.endsWith("`")) {
                runs.push(new TextRun({ text: part.slice(1, -1), font: "Courier New", color: "0369A1", size: 20 }))
            } else {
                runs.push(new TextRun({ text: part, color: "1E293B" }))
            }
        }
        return runs
    }

    const rawLines = fullMarkdown.split("\n")

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim()
        if (!line) {
            continue
        }

        if (line.startsWith("# ")) {
            children.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun({ text: line.replace(/^# /, ""), bold: true, size: 36, color: "0F172A" })],
                    spacing: { before: 400, after: 200 },
                })
            )
        } else if (line.startsWith("## ")) {
            children.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: line.replace(/^## /, ""), bold: true, size: 28, color: "1E293B" })],
                    spacing: { before: 300, after: 150 },
                })
            )
        } else if (line.startsWith("### ")) {
            children.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_3,
                    children: [new TextRun({ text: line.replace(/^### /, ""), bold: true, size: 24, color: "334155" })],
                    spacing: { before: 240, after: 120 },
                })
            )
        } else if (line.startsWith("#### ")) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: line.replace(/^#### /, ""), bold: true, size: 22, color: "475569" })],
                    spacing: { before: 180, after: 100 },
                })
            )
        } else if (line === "---") {
            children.push(
                new Paragraph({
                    border: { bottom: { color: "CBD5E1", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                    spacing: { before: 200, after: 200 },
                })
            )
        } else if (line.startsWith("[Add ") && line.endsWith("]")) {
            const isVideo = line.includes("Video Tutorial")
            const borderColor = isVideo ? "A855F7" : "3B82F6"
            const bgColor = isVideo ? "FAF5FF" : "EFF6FF"
            const textColor = isVideo ? "6B21A8" : "1D4ED8"

            children.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.DASHED, size: 4, color: borderColor },
                        bottom: { style: BorderStyle.DASHED, size: 4, color: borderColor },
                        left: { style: BorderStyle.DASHED, size: 4, color: borderColor },
                        right: { style: BorderStyle.DASHED, size: 4, color: borderColor },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { type: ShadingType.CLEAR, fill: bgColor },
                                    margins: { top: convertInchesToTwip(0.08), bottom: convertInchesToTwip(0.08), left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.12) },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            children: [
                                                new TextRun({
                                                    text: isVideo ? `🎬 ${line}` : `📸 ${line}`,
                                                    bold: true,
                                                    color: textColor,
                                                    size: 20,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                })
            )
            children.push(new Paragraph({ spacing: { after: 120 } }))
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
            children.push(
                new Paragraph({
                    bullet: { level: 0 },
                    children: parseInline(line.substring(2)),
                    spacing: { before: 40, after: 40 },
                })
            )
        } else if (/^\d+\.\s/.test(line)) {
            children.push(
                new Paragraph({
                    children: parseInline(line),
                    spacing: { before: 40, after: 40 },
                })
            )
        } else if (line.startsWith("```")) {
            const codeLines = []
            i++
            while (i < rawLines.length && !rawLines[i].trim().startsWith("```")) {
                codeLines.push(rawLines[i])
                i++
            }
            children.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
                                    margins: { top: convertInchesToTwip(0.1), bottom: convertInchesToTwip(0.1), left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
                                    children: codeLines.map(
                                        (cl) =>
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: cl,
                                                        font: "Courier New",
                                                        size: 19,
                                                        color: "0F172A",
                                                    }),
                                                ],
                                                spacing: { before: 20, after: 20 },
                                            })
                                    ),
                                }),
                            ],
                        }),
                    ],
                })
            )
            children.push(new Paragraph({ spacing: { after: 100 } }))
        } else {
            children.push(
                new Paragraph({
                    children: parseInline(line),
                    spacing: { before: 80, after: 80 },
                })
            )
        }
    }

    const doc = new Document({
        title: "Chat Bubbles for Framer - Complete User Documentation",
        description: "Official user documentation and feature reference for Chat Bubbles Framer plugin",
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                        },
                    },
                },
                children,
            },
        ],
    })

    const buffer = await Packer.toBuffer(doc)
    const docxOutputPath = path.join(docsDir, "Chat-Bubbles-User-Documentation.docx")
    fs.writeFileSync(docxOutputPath, buffer)
    console.log("Created:", docxOutputPath)
}

generateDocx().catch((err) => {
    console.error("Error generating docx:", err)
    process.exit(1)
})
