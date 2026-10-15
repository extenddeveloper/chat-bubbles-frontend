import { framer } from "@framer/plugin"
import "@framer/plugin/framer.css"
import React from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Chat Bubbles Plugin Error Boundary Caught:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="cf-error-fallback">
                    <div className="cf-error-header">
                        <span className="cf-error-icon">⚠️</span>
                        <h3 className="cf-error-title">Plugin Error</h3>
                    </div>
                    <p className="cf-error-text">
                        {this.state.error?.message || "An unexpected error occurred while loading Chat Bubbles."}
                    </p>
                    <button
                        className="cf-error-btn"
                        onClick={() => {
                            window.location.reload()
                        }}
                    >
                        Reload Plugin
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}

// Suppress Framer development unchecked permission warnings and pre-authorize permissions
try {
    if ((framer as any).showUncheckedPermissionToasts !== undefined) {
        (framer as any).showUncheckedPermissionToasts = false
    }
    if (typeof (framer as any).isAllowedTo === "function") {
        ;(framer as any).isAllowedTo(
            "CodeFile.setFileContent",
            "setCodeFileContent",
            "createCodeFile",
            "setAttributes",
            "addComponentInstance",
            "setSelection",
            "getNodesWithType",
            "setPluginData",
            "getPluginData",
            "setCustomCode",
            "getCustomCode"
        )
    }
} catch {}

try {
    framer.showUI({
        position: "top right",
        width: 430,
        height: 760,
    })
} catch {}

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

createRoot(root).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
