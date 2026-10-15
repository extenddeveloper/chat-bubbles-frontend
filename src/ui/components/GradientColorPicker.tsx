import { useState, useEffect, useRef } from "react"
import { CustomColorPicker } from "./CustomColorPicker"
import { Field } from "./Field"

interface GradientColorPickerProps {
    value: string
    onChange: (gradient: string) => void
}

const GRADIENT_PRESETS = [
    { label: "Sunset Violet", value: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", start: "#6366f1", end: "#a855f7", angle: 135 },
    { label: "Coral Sunrise", value: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)", start: "#f97316", end: "#ec4899", angle: 135 },
    { label: "Emerald Mint", value: "linear-gradient(135deg, #10b981 0%, #059669 100%)", start: "#10b981", end: "#059669", angle: 135 },
    { label: "Cyber Cyan", value: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)", start: "#06b6d4", end: "#3b82f6", angle: 135 },
    { label: "Midnight Glow", value: "linear-gradient(135deg, #1e1e24 0%, #4c1d95 100%)", start: "#1e1e24", end: "#4c1d95", angle: 135 },
    { label: "Ruby Amber", value: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)", start: "#ef4444", end: "#f59e0b", angle: 135 },
    { label: "Neon Berry", value: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", start: "#ec4899", end: "#8b5cf6", angle: 135 },
    { label: "Slate Minimal", value: "linear-gradient(135deg, #334155 0%, #0f172a 100%)", start: "#334155", end: "#0f172a", angle: 135 },
]

function parseGradient(gradientStr: string) {
    const fallback = { start: "#6366f1", end: "#a855f7", angle: 135 }
    if (!gradientStr || typeof gradientStr !== "string") return fallback

    let angle = 135
    const angleMatch = gradientStr.match(/(\d+)deg/)
    if (angleMatch) {
        angle = parseInt(angleMatch[1], 10) || 135
    }

    const colorMatches = gradientStr.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g)
    if (colorMatches && colorMatches.length >= 2) {
        return {
            start: colorMatches[0],
            end: colorMatches[1],
            angle,
        }
    } else if (colorMatches && colorMatches.length === 1) {
        return {
            start: colorMatches[0],
            end: colorMatches[0],
            angle,
        }
    }

    return fallback
}

export function GradientColorPicker({ value, onChange }: GradientColorPickerProps) {
    const initial = parseGradient(value)
    const [startColor, setStartColor] = useState(initial.start)
    const [endColor, setEndColor] = useState(initial.end)
    const [angle, setAngle] = useState(initial.angle)
    const [cssText, setCssText] = useState(value || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)")

    const previewRef = useRef<HTMLDivElement>(null)

    // Update preview element background without inline JSX style
    useEffect(() => {
        if (previewRef.current) {
            previewRef.current.style.background = cssText
        }
    }, [cssText])

    // Sync from prop changes
    useEffect(() => {
        if (value && value !== cssText) {
            setCssText(value)
            const p = parseGradient(value)
            setStartColor(p.start)
            setEndColor(p.end)
            setAngle(p.angle)
        }
    }, [value])

    function handleStartChange(color: string) {
        setStartColor(color)
        const next = `linear-gradient(${angle}deg, ${color} 0%, ${endColor} 100%)`
        setCssText(next)
        onChange(next)
    }

    function handleEndChange(color: string) {
        setEndColor(color)
        const next = `linear-gradient(${angle}deg, ${startColor} 0%, ${color} 100%)`
        setCssText(next)
        onChange(next)
    }

    function handleAngleChange(newAngle: number) {
        setAngle(newAngle)
        const next = `linear-gradient(${newAngle}deg, ${startColor} 0%, ${endColor} 100%)`
        setCssText(next)
        onChange(next)
    }

    function handlePresetClick(preset: typeof GRADIENT_PRESETS[0]) {
        setStartColor(preset.start)
        setEndColor(preset.end)
        setAngle(preset.angle)
        setCssText(preset.value)
        onChange(preset.value)
    }

    function handleManualText(val: string) {
        setCssText(val)
        onChange(val)
        const p = parseGradient(val)
        setStartColor(p.start)
        setEndColor(p.end)
        setAngle(p.angle)
    }

    return (
        <div className="cf-gradient-picker-box">
            {/* Live Gradient Preview Bar */}
            <div className="cf-gradient-preview-wrap">
                <div ref={previewRef} className="cf-gradient-preview-bar" />
                <span className="cf-gradient-angle-badge">{angle}°</span>
            </div>

            {/* Presets Grid */}
            <div className="cf-gradient-presets-label">Preset Gradients</div>
            <div className="cf-gradient-presets-grid">
                {GRADIENT_PRESETS.map((preset) => {
                    const isSelected = cssText.trim() === preset.value.trim()
                    return (
                        <button
                            key={preset.label}
                            type="button"
                            className={`cf-gradient-preset-pill ${isSelected ? "active" : ""}`}
                            onClick={() => handlePresetClick(preset)}
                            title={preset.label}
                        >
                            <span className="cf-gradient-preset-dot">
                                <svg width="12" height="12" viewBox="0 0 12 12">
                                    <defs>
                                        <linearGradient id={`dot-${preset.label.replace(/\s+/g, "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor={preset.start} />
                                            <stop offset="100%" stopColor={preset.end} />
                                        </linearGradient>
                                    </defs>
                                    <circle cx="6" cy="6" r="6" fill={`url(#dot-${preset.label.replace(/\s+/g, "")})`} />
                                </svg>
                            </span>
                            <span>{preset.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Color Controls (Start & End) */}
            <div className="cf-field-grid">
                <Field label="Start Color" hint="Initial gradient tone">
                    <CustomColorPicker
                        value={startColor}
                        fallback="#6366f1"
                        onChange={handleStartChange}
                        ariaLabel="Gradient Start Color"
                    />
                </Field>

                <Field label="End Color" hint="Final gradient tone">
                    <CustomColorPicker
                        value={endColor}
                        fallback="#a855f7"
                        onChange={handleEndChange}
                        ariaLabel="Gradient End Color"
                    />
                </Field>
            </div>

            {/* Gradient Angle Slider & Quick Presets */}
            <Field label="Gradient Direction / Angle" hint="Rotate the gradient light angle">
                <div className="cf-flex-col-gap-8">
                    <div className="cf-flex-center-gap-10">
                        <input
                            type="range"
                            min={0}
                            max={360}
                            step={5}
                            value={angle}
                            className="cf-range-input"
                            onChange={(e) => handleAngleChange(Number(e.target.value))}
                        />
                        <span className="cf-badge-value">{angle}°</span>
                    </div>
                    <div className="cf-angle-presets">
                        {[
                            { label: "90° (→)", val: 90 },
                            { label: "135° (↘)", val: 135 },
                            { label: "180° (↓)", val: 180 },
                            { label: "270° (←)", val: 270 },
                        ].map(({ label, val }) => (
                            <button
                                key={val}
                                type="button"
                                className={`cf-angle-preset-pill ${angle === val ? "active" : ""}`}
                                onClick={() => handleAngleChange(val)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </Field>

            {/* CSS String Input */}
            <Field label="Custom CSS Gradient Rule" hint="Paste or fine-tune exact CSS gradient string">
                <input
                    type="text"
                    className="cf-input"
                    value={cssText}
                    onChange={(e) => handleManualText(e.target.value)}
                    placeholder="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                />
            </Field>
        </div>
    )
}
