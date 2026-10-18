/**
 * Plays a clean, pleasant two-tone notification chime for greeting bubble popups.
 * Handles browser audio autoplay restrictions by resuming suspended AudioContexts.
 */
let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return null
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
        try {
            sharedAudioCtx = new AudioContextClass()
        } catch {
            return null
        }
    }
    return sharedAudioCtx
}

export function playNotificationChime(): boolean {
    try {
        const ctx = getAudioContext()
        if (!ctx) return false

        const play = () => {
            const now = ctx.currentTime

            // Crisp 2-tone melodic chime: Note 1 D5 (587.33 Hz) -> Note 2 A5 (880 Hz)
            const osc1 = ctx.createOscillator()
            const gain1 = ctx.createGain()
            osc1.type = "sine"
            osc1.frequency.setValueAtTime(587.33, now)
            gain1.gain.setValueAtTime(0.0001, now)
            gain1.gain.linearRampToValueAtTime(0.24, now + 0.015)
            gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
            osc1.connect(gain1)
            gain1.connect(ctx.destination)
            osc1.start(now)
            osc1.stop(now + 0.22)

            const osc2 = ctx.createOscillator()
            const gain2 = ctx.createGain()
            osc2.type = "sine"
            osc2.frequency.setValueAtTime(880, now + 0.08)
            gain2.gain.setValueAtTime(0.0001, now + 0.08)
            gain2.gain.linearRampToValueAtTime(0.28, now + 0.095)
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.40)
            osc2.connect(gain2)
            gain2.connect(ctx.destination)
            osc2.start(now + 0.08)
            osc2.stop(now + 0.40)
        }

        if (ctx.state === "suspended") {
            ctx.resume().then(() => {
                if (ctx.state === "running") play()
            }).catch(() => {})
        } else {
            play()
        }

        return true
    } catch {
        return false
    }
}
