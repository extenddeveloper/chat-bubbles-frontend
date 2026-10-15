// High-quality, self-contained SVG avatar presets for Chat Bubbles Framer Plugin
// 100% offline, zero external CDN dependencies, fully Framer CSP compliant.

function encodeSvg(svg: string): string {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}

// 1. Alex - Warm amber & indigo theme with glasses and friendly smile
const AVATAR_1 = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <linearGradient id="shirt1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg1)"/>
  <!-- Body/Shoulders -->
  <path d="M20 120 C20 90 40 82 60 82 C80 82 100 90 100 120 Z" fill="url(#shirt1)"/>
  <path d="M50 82 L70 82 L65 94 L55 94 Z" fill="#F87171"/>
  <!-- Neck -->
  <rect x="52" y="66" width="16" height="20" rx="8" fill="#FBBF24"/>
  <!-- Head -->
  <ellipse cx="60" cy="50" rx="24" ry="26" fill="#FDE68A"/>
  <!-- Hair -->
  <path d="M36 46 C36 28 46 22 60 22 C74 22 84 28 84 46 C84 38 78 30 60 30 C44 30 36 38 36 46 Z" fill="#1F2937"/>
  <path d="M36 46 C36 34 42 26 52 24 C44 28 40 36 40 46 Z" fill="#111827"/>
  <!-- Glasses -->
  <rect x="42" y="44" width="14" height="10" rx="3" fill="none" stroke="#1F2937" stroke-width="2.5"/>
  <rect x="64" y="44" width="14" height="10" rx="3" fill="none" stroke="#1F2937" stroke-width="2.5"/>
  <line x1="56" y1="48" x2="64" y2="48" stroke="#1F2937" stroke-width="2.5"/>
  <!-- Eyes -->
  <circle cx="49" cy="49" r="2" fill="#1F2937"/>
  <circle cx="71" cy="49" r="2" fill="#1F2937"/>
  <!-- Smile -->
  <path d="M52 62 Q60 69 68 62" fill="none" stroke="#B45309" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`)

// 2. Sarah - Modern violet/indigo theme with support headset
const AVATAR_2 = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C7D2FE"/>
      <stop offset="100%" stop-color="#818CF8"/>
    </linearGradient>
    <linearGradient id="shirt2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#4338CA"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg2)"/>
  <!-- Hair back -->
  <path d="M32 50 C32 26 44 20 60 20 C76 20 88 26 88 50 C88 74 84 86 84 86 L36 86 C36 86 32 74 32 50 Z" fill="#312E81"/>
  <!-- Shoulders -->
  <path d="M22 120 C22 92 40 84 60 84 C80 84 98 92 98 120 Z" fill="url(#shirt2)"/>
  <!-- Neck -->
  <rect x="52" y="68" width="16" height="18" rx="7" fill="#FED7AA"/>
  <!-- Face -->
  <ellipse cx="60" cy="52" rx="22" ry="24" fill="#FFEDD5"/>
  <!-- Hair bangs -->
  <path d="M38 42 C44 32 54 30 68 30 C78 30 84 34 84 42 C78 36 68 34 58 35 C48 36 42 40 38 42 Z" fill="#4338CA"/>
  <!-- Eyes -->
  <circle cx="51" cy="50" r="2.2" fill="#1E1B4B"/>
  <circle cx="69" cy="50" r="2.2" fill="#1E1B4B"/>
  <!-- Blush -->
  <circle cx="46" cy="57" r="3.5" fill="#FDA4AF" opacity="0.6"/>
  <circle cx="74" cy="57" r="3.5" fill="#FDA4AF" opacity="0.6"/>
  <!-- Smile -->
  <path d="M53 61 Q60 67 67 61" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round"/>
  <!-- Support Headset -->
  <path d="M36 50 C36 34 46 25 60 25 C74 25 84 34 84 50" fill="none" stroke="#1E1B4B" stroke-width="3" stroke-linecap="round"/>
  <rect x="33" y="47" width="6" height="12" rx="3" fill="#10B981"/>
  <rect x="81" y="47" width="6" height="12" rx="3" fill="#10B981"/>
  <path d="M83 58 Q82 72 70 73" fill="none" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
  <circle cx="68" cy="73" r="2.5" fill="#10B981"/>
</svg>
`)

// 3. David - Emerald/Teal tech & developer persona
const AVATAR_3 = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A7F3D0"/>
      <stop offset="100%" stop-color="#34D399"/>
    </linearGradient>
    <linearGradient id="shirt3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="100%" stop-color="#115E59"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg3)"/>
  <!-- Shoulders -->
  <path d="M22 120 C22 92 40 84 60 84 C80 84 98 92 98 120 Z" fill="url(#shirt3)"/>
  <!-- Neck -->
  <rect x="52" y="68" width="16" height="18" rx="8" fill="#FCD34D"/>
  <!-- Face -->
  <ellipse cx="60" cy="51" rx="23" ry="25" fill="#FDE68A"/>
  <!-- Hair (short modern cut) -->
  <path d="M37 45 C37 28 47 22 60 22 C73 22 83 28 83 45 C83 34 75 27 60 27 C45 27 37 34 37 45 Z" fill="#064E3B"/>
  <path d="M42 27 L60 24 L78 27 L70 31 L50 31 Z" fill="#047857"/>
  <!-- Eyes -->
  <circle cx="50" cy="50" r="2.2" fill="#064E3B"/>
  <circle cx="70" cy="50" r="2.2" fill="#064E3B"/>
  <!-- Eyebrows -->
  <path d="M46 44 Q50 42 54 44" fill="none" stroke="#064E3B" stroke-width="2" stroke-linecap="round"/>
  <path d="M66 44 Q70 42 74 44" fill="none" stroke="#064E3B" stroke-width="2" stroke-linecap="round"/>
  <!-- Beard subtle outline -->
  <path d="M42 54 C44 72 52 76 60 76 C68 76 76 72 78 54 C76 68 68 73 60 73 C52 73 44 68 42 54 Z" fill="#047857" opacity="0.4"/>
  <!-- Smile -->
  <path d="M53 62 Q60 68 67 62" fill="none" stroke="#B45309" stroke-width="2" stroke-linecap="round"/>
</svg>
`)

// 4. Emily - Coral & Rose customer success persona
const AVATAR_4 = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FECDD3"/>
      <stop offset="100%" stop-color="#FB7185"/>
    </linearGradient>
    <linearGradient id="shirt4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#BE185D"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg4)"/>
  <!-- Hair back -->
  <path d="M30 52 C30 25 43 18 60 18 C77 18 90 25 90 52 C90 76 84 90 84 90 L36 90 C36 90 30 76 30 52 Z" fill="#78350F"/>
  <!-- Shoulders -->
  <path d="M22 120 C22 92 40 84 60 84 C80 84 98 92 98 120 Z" fill="url(#shirt4)"/>
  <!-- Neck -->
  <rect x="52" y="68" width="16" height="18" rx="7" fill="#FED7AA"/>
  <!-- Face -->
  <ellipse cx="60" cy="52" rx="22" ry="24" fill="#FFEDD5"/>
  <!-- Hair front -->
  <path d="M35 44 C40 32 50 28 65 28 C76 28 85 33 85 45 C80 35 70 33 60 33 C48 33 40 38 35 44 Z" fill="#92400E"/>
  <!-- Eyes -->
  <circle cx="51" cy="51" r="2.2" fill="#451A03"/>
  <circle cx="69" cy="51" r="2.2" fill="#451A03"/>
  <!-- Blush -->
  <circle cx="45" cy="58" r="3.5" fill="#F43F5E" opacity="0.5"/>
  <circle cx="75" cy="58" r="3.5" fill="#F43F5E" opacity="0.5"/>
  <!-- Smile -->
  <path d="M53 62 Q60 68 67 62" fill="none" stroke="#BE123C" stroke-width="2" stroke-linecap="round"/>
</svg>
`)

export const SVG_AVATAR_PRESETS = [AVATAR_1, AVATAR_2, AVATAR_3, AVATAR_4]
