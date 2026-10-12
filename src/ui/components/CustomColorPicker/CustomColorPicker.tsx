import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  parseColor,
  rgbToHsv,
  hsvToRgb,
  rgbToHex,
  formatColorString,
  clamp,
} from "./colorUtils"
import "./CustomColorPicker.css"

declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<{ sRGBHex: string }>
    }
  }
}

function PipetteIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
    </svg>
  )
}

const PRESET_PALETTE = [
  "#000000",
  "#333333",
  "#888888",
  "#ffffff",
  "#5271ff",
  "#3E67EB",
  "#22c55e",
  "#ef4444",
]

export interface CustomColorPickerProps {
  value?: string
  fallback?: string
  onChange?: (color: string) => void
  disabled?: boolean
  ariaLabel?: string
}

export function CustomColorPicker({
  value,
  fallback = "#ffffff",
  onChange,
  disabled = false,
  ariaLabel = "Color picker",
}: CustomColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)

  // Helper to format clean display text (always clean HEX if alpha === 1)
  const getCleanDisplayText = useCallback((colorVal?: string) => {
    const p = parseColor(colorVal || fallback, fallback)
    if (p.a < 1) {
      return formatColorString(p.r, p.g, p.b, p.a)
    }
    return rgbToHex(p.r, p.g, p.b)
  }, [fallback])

  // Parsed color values
  const parsed = parseColor(value || fallback, fallback)
  const initialHsv = rgbToHsv(parsed.r, parsed.g, parsed.b)

  const [hue, setHue] = useState(initialHsv.h)
  const [sat, setSat] = useState(initialHsv.s)
  const [val, setVal] = useState(initialHsv.v)
  const [alpha, setAlpha] = useState(parsed.a)
  const [textInput, setTextInput] = useState(() => getCleanDisplayText(value || fallback))

  // Sync internal state when prop value changes
  useEffect(() => {
    const p = parseColor(value || fallback, fallback)
    const hsv = rgbToHsv(p.r, p.g, p.b)
    setHue(hsv.h)
    setSat(hsv.s)
    setVal(hsv.v)
    setAlpha(p.a)
    setTextInput(getCleanDisplayText(value || fallback))
  }, [value, fallback, getCleanDisplayText])

  const containerRef = useRef<HTMLDivElement>(null)
  const svCanvasRef = useRef<HTMLCanvasElement>(null)
  const hueCanvasRef = useRef<HTMLCanvasElement>(null)
  const alphaCanvasRef = useRef<HTMLCanvasElement>(null)

  // Auto-detect right alignment when popover opens near screen right edge
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    try {
      const rect = containerRef.current.getBoundingClientRect()
      const popoverWidth = 230
      const windowWidth = window.innerWidth || document.documentElement.clientWidth || 360
      if (rect.left + popoverWidth > windowWidth - 10 || rect.right > windowWidth - 40) {
        setAlignRight(true)
      } else {
        setAlignRight(false)
      }
    } catch {
      setAlignRight(false)
    }
  }, [isOpen])

  // Click outside to dismiss popover
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("touchstart", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("touchstart", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Current RGB and CSS formatted string
  const currentRgb = hsvToRgb(hue, sat, val)
  const currentCssColor = formatColorString(currentRgb.r, currentRgb.g, currentRgb.b, alpha)
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b)
  const opacityPercent = Math.round(alpha * 100)

  // Trigger change handler
  const emitColor = useCallback(
    (h: number, s: number, v: number, a: number) => {
      const rgb = hsvToRgb(h, s, v)
      const str = formatColorString(rgb.r, rgb.g, rgb.b, a)
      setTextInput(a < 1 ? str : rgbToHex(rgb.r, rgb.g, rgb.b))
      onChange?.(str)
    },
    [onChange]
  )

  // 1. Draw 2D Saturation-Value Canvas
  useEffect(() => {
    if (!isOpen || !svCanvasRef.current) return
    const canvas = svCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Fill Hue Base
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
    ctx.fillRect(0, 0, width, height)

    // White horizontal gradient (saturation)
    const whiteGrad = ctx.createLinearGradient(0, 0, width, 0)
    whiteGrad.addColorStop(0, "rgba(255, 255, 255, 1)")
    whiteGrad.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.fillStyle = whiteGrad
    ctx.fillRect(0, 0, width, height)

    // Black vertical gradient (brightness/value)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, height)
    blackGrad.addColorStop(0, "rgba(0, 0, 0, 0)")
    blackGrad.addColorStop(1, "rgba(0, 0, 0, 1)")
    ctx.fillStyle = blackGrad
    ctx.fillRect(0, 0, width, height)

    // Draw Thumb Marker (clamped so circle never clips at boundaries)
    const thumbRadius = 6
    const thumbX = clamp(sat * width, thumbRadius, width - thumbRadius)
    const thumbY = clamp((1 - val) * height, thumbRadius, height - thumbRadius)

    ctx.beginPath()
    ctx.arc(thumbX, thumbY, thumbRadius, 0, Math.PI * 2)
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2.5
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(thumbX, thumbY, thumbRadius - 1, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)"
    ctx.lineWidth = 1
    ctx.stroke()
  }, [isOpen, hue, sat, val])

  // 2. Draw Hue Slider Canvas
  useEffect(() => {
    if (!isOpen || !hueCanvasRef.current) return
    const canvas = hueCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    const grad = ctx.createLinearGradient(0, 0, width, 0)
    grad.addColorStop(0, "#ff0000")
    grad.addColorStop(0.17, "#ffff00")
    grad.addColorStop(0.33, "#00ff00")
    grad.addColorStop(0.5, "#00ffff")
    grad.addColorStop(0.67, "#0000ff")
    grad.addColorStop(0.83, "#ff00ff")
    grad.addColorStop(1, "#ff0000")

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Draw Thumb
    const thumbRadius = 5
    const thumbX = clamp((hue / 360) * width, thumbRadius, width - thumbRadius)
    ctx.beginPath()
    ctx.arc(thumbX, height / 2, thumbRadius, 0, Math.PI * 2)
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)"
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [isOpen, hue])

  // 3. Draw Alpha Slider Canvas
  useEffect(() => {
    if (!isOpen || !alphaCanvasRef.current) return
    const canvas = alphaCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Checkerboard
    ctx.clearRect(0, 0, width, height)
    const size = 4
    for (let x = 0; x < width; x += size) {
      for (let y = 0; y < height; y += size) {
        ctx.fillStyle = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0 ? "#eeeeee" : "#bbbbbb"
        ctx.fillRect(x, y, size, size)
      }
    }

    // Alpha Gradient from transparent to solid RGB
    const grad = ctx.createLinearGradient(0, 0, width, 0)
    grad.addColorStop(0, `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, 0)`)
    grad.addColorStop(1, `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, 1)`)

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Draw Thumb
    const thumbRadius = 5
    const thumbX = clamp(alpha * width, thumbRadius, width - thumbRadius)
    ctx.beginPath()
    ctx.arc(thumbX, height / 2, thumbRadius, 0, Math.PI * 2)
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)"
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [isOpen, alpha, currentRgb.r, currentRgb.g, currentRgb.b])

  // Pointer Handlers for SV Box Dragging
  const handleSvPointer = (e: { clientX: number; clientY: number }) => {
    if (!svCanvasRef.current) return
    const rect = svCanvasRef.current.getBoundingClientRect()
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
    const newSat = x
    const newVal = 1 - y
    setSat(newSat)
    setVal(newVal)
    emitColor(hue, newSat, newVal, alpha)
  }

  const handleSvPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleSvPointer(e)
    const onMove = (moveEvent: PointerEvent) => handleSvPointer(moveEvent)
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  // Pointer Handlers for Hue Slider Dragging
  const handleHuePointer = (e: { clientX: number }) => {
    if (!hueCanvasRef.current) return
    const rect = hueCanvasRef.current.getBoundingClientRect()
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const newHue = Math.round(ratio * 360)
    setHue(newHue)
    emitColor(newHue, sat, val, alpha)
  }

  const handleHuePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleHuePointer(e)
    const onMove = (moveEvent: PointerEvent) => handleHuePointer(moveEvent)
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  // Pointer Handlers for Alpha Slider Dragging
  const handleAlphaPointer = (e: { clientX: number }) => {
    if (!alphaCanvasRef.current) return
    const rect = alphaCanvasRef.current.getBoundingClientRect()
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const newAlpha = Math.round(ratio * 100) / 100
    setAlpha(newAlpha)
    emitColor(hue, sat, val, newAlpha)
  }

  const handleAlphaPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleAlphaPointer(e)
    const onMove = (moveEvent: PointerEvent) => handleAlphaPointer(moveEvent)
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  // Eyedropper API
  const handleEyeDropper = async () => {
    if (typeof window !== "undefined" && window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper()
        const result = await eyeDropper.open()
        if (result && result.sRGBHex) {
          const p = parseColor(result.sRGBHex)
          const hsv = rgbToHsv(p.r, p.g, p.b)
          setHue(hsv.h)
          setSat(hsv.s)
          setVal(hsv.v)
          setAlpha(1)
          emitColor(hsv.h, hsv.s, hsv.v, 1)
        }
      } catch {
        // User cancelled eyedropper
      }
    }
  }

  // Dedicated HEX input state synchronized with currentHex
  const [hexInput, setHexInput] = useState(currentHex)

  useEffect(() => {
    setHexInput(currentHex)
  }, [currentHex])

  const handleHexInputChange = (newHex: string) => {
    setHexInput(newHex)
    const cleaned = newHex.trim()
    if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cleaned)) {
      const p = parseColor(cleaned.startsWith("#") ? cleaned : `#${cleaned}`)
      const hsv = rgbToHsv(p.r, p.g, p.b)
      setHue(hsv.h)
      setSat(hsv.s)
      setVal(hsv.v)
      const newAlpha = (cleaned.length === 8 || cleaned.length === 9) ? p.a : alpha
      setAlpha(newAlpha)
      emitColor(hsv.h, hsv.s, hsv.v, newAlpha)
    }
  }

  const handleHexInputBlur = () => {
    setHexInput(currentHex)
  }

  const handleAlphaInputChange = (newAlphaStr: string) => {
    const num = parseInt(newAlphaStr.replace(/\D/g, ""), 10)
    if (!isNaN(num)) {
      const clampedAlpha = clamp(num / 100, 0, 1)
      setAlpha(clampedAlpha)
      emitColor(hue, sat, val, clampedAlpha)
    }
  }

  // Manual text input change in top row
  const handleTextInputChange = (newVal: string) => {
    setTextInput(newVal)
    const p = parseColor(newVal)
    const hsv = rgbToHsv(p.r, p.g, p.b)
    setHue(hsv.h)
    setSat(hsv.s)
    setVal(hsv.v)
    setAlpha(p.a)
    onChange?.(newVal)
  }

  const handleTextInputBlur = () => {
    setTextInput(getCleanDisplayText(value || fallback))
  }

  // Quick Preset Click (preserves current opacity if translucent)
  const handlePresetClick = (presetHex: string) => {
    const p = parseColor(presetHex)
    const hsv = rgbToHsv(p.r, p.g, p.b)
    setHue(hsv.h)
    setSat(hsv.s)
    setVal(hsv.v)
    emitColor(hsv.h, hsv.s, hsv.v, alpha)
  }

  return (
    <div className={`framer-color-picker-wrap ${alignRight ? "align-right" : ""}`} ref={containerRef}>
      {/* Trigger Row */}
      <div className="framer-color-picker-row">
        <button
          type="button"
          className={`framer-color-swatch-btn ${isOpen ? "open" : ""}`}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          title={ariaLabel}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
        >
          <svg width="24" height="24" viewBox="0 0 28 28" className="framer-color-swatch-inner">
            <circle cx="14" cy="14" r="14" fill={currentCssColor} />
          </svg>
        </button>

        <input
          type="text"
          className="framer-color-text-input"
          value={textInput}
          onChange={(e) => handleTextInputChange(e.target.value)}
          onBlur={handleTextInputBlur}
          disabled={disabled}
          placeholder="#ffffff"
          aria-label={`${ariaLabel} value`}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />

        <div className="framer-color-opacity-badge" title="Opacity">
          {opacityPercent}%
        </div>
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div className={`framer-color-popover ${alignRight ? "align-right" : ""}`} role="dialog" aria-modal="true">
          {/* 1. 2D Saturation-Value Canvas Box */}
          <div className="framer-sv-canvas-wrap" onPointerDown={handleSvPointerDown}>
            <canvas ref={svCanvasRef} width={260} height={130} className="framer-sv-canvas" />
          </div>

          {/* 2. Sliders Row (Dropper + Circle Color Show + Hue + Alpha) */}
          <div className="framer-color-sliders-row">
            {typeof window !== "undefined" && "EyeDropper" in window && (
              <button
                type="button"
                className="framer-color-dropper-btn"
                onClick={handleEyeDropper}
                title="Sample color from screen"
                aria-label="Pick color from screen"
              >
                <PipetteIcon size={14} />
              </button>
            )}

            {/* Circular Full-Radius Color Preview */}
            <div className="framer-color-circle-preview" title={`Color: ${currentCssColor}`}>
              <svg width="28" height="28" viewBox="0 0 28 28" className="framer-color-circle-preview-svg">
                <circle cx="14" cy="14" r="14" fill={currentCssColor} />
              </svg>
            </div>

            <div className="framer-color-sliders-col">
              {/* Hue Slider */}
              <div className="framer-slider-canvas-wrap" onPointerDown={handleHuePointerDown}>
                <canvas ref={hueCanvasRef} width={200} height={12} className="framer-slider-canvas" />
              </div>

              {/* Alpha Slider */}
              <div className="framer-slider-canvas-wrap" onPointerDown={handleAlphaPointerDown}>
                <canvas ref={alphaCanvasRef} width={200} height={12} className="framer-slider-canvas" />
              </div>
            </div>
          </div>

          {/* 3. Color Input Details (HEX & Alpha) */}
          <div className="framer-color-details-row">
            <span className="framer-color-format-label">HEX</span>
            <input
              type="text"
              className="framer-color-hex-subinput"
              value={hexInput}
              onChange={(e) => handleHexInputChange(e.target.value)}
              onBlur={handleHexInputBlur}
              placeholder="#FFFFFF"
              aria-label="Hex color"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <input
              type="text"
              className="framer-color-alpha-subinput"
              value={`${opacityPercent}%`}
              onChange={(e) => handleAlphaInputChange(e.target.value)}
              placeholder="100%"
              aria-label="Opacity percentage"
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          {/* 4. Framer Standard Preset Palette */}
          <div className="framer-color-palette">
            {PRESET_PALETTE.map((preset) => (
              <button
                key={preset}
                type="button"
                className="framer-palette-btn"
                onClick={() => handlePresetClick(preset)}
                title={preset}
                aria-label={`Select ${preset}`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" className="framer-palette-swatch">
                  <circle cx="10" cy="10" r="10" fill={preset} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
