export const BACKEND_BASE_URL: string =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:3000"
        : "https://app.framefic.com/chat-bubbles"

export const buildBackendUrl = (path: string): string => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${BACKEND_BASE_URL.replace(/\/+$/, "")}${normalizedPath}`
}
