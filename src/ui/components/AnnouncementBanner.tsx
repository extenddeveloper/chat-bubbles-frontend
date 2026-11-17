import React, { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Check, X } from "lucide-react";
import {
  fetchAnnouncementConfig,
  getCachedAnnouncementConfig,
  type AnnouncementConfig,
} from "../../features/payment/services/paymentService";
import { getSiteInfo } from "../../lib/framer/project";
import "./AnnouncementBanner.css";

const giftBoxGif = "./gift-box-3d.gif";

export interface AnnouncementBannerProps {
  isLoggedIn?: boolean;
  isPaidUser?: boolean;
  hasActiveTrial?: boolean;
  user?: any;
  siteId?: string;
  trialEndTimestamp?: number | null;
  onUpgrade?: () => void;
}

interface StoredPromoState {
  campaignId: string;
  startTime: number;
  expiresAt: number;
  copied: boolean;
  dismissedUntil: number | null;
  manuallyClosed?: boolean;
}

const STORAGE_PREFIX = "chatbubbles_promo";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function buildStorageKey(campaignId: string, userKey: string, siteId: string): string {
  const c = (campaignId || "default").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const u = (userKey || "anon").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const s = (siteId || "unknown_site").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `${STORAGE_PREFIX}_${c}_${u}_${s}`;
}

function resolveUserIdentifier(user: any): string {
  if (user?.id) return `uid_${user.id}`;
  if (user?.email) return `email_${user.email.toLowerCase().trim()}`;
  return "anon";
}

function computeSnoozeTimestamp(trialEndTimestamp?: number | null): number {
  const now = Date.now();
  const defaultSnooze = now + SEVEN_DAYS_MS;
  if (
    typeof trialEndTimestamp === "number" &&
    Number.isFinite(trialEndTimestamp) &&
    trialEndTimestamp > now
  ) {
    return trialEndTimestamp;
  }
  return defaultSnooze;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  isLoggedIn = false,
  isPaidUser = false,
  hasActiveTrial = false,
  user,
  siteId: propSiteId,
  trialEndTimestamp,
  onUpgrade,
}) => {
  const initialCached = getCachedAnnouncementConfig();
  const [config, setConfig] = useState<AnnouncementConfig | null>(initialCached);
  const [resolvedSiteId, setResolvedSiteId] = useState<string>(propSiteId || "chatbubbles_local_site");
  const [isLoading, setIsLoading] = useState<boolean>(!initialCached);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const storageKeyRef = useRef<string>("");
  const expiresAtRef = useRef<number | null>(null);

  // 1. Resolve site identity and fetch backend configuration
  useEffect(() => {
    let isMounted = true;
    const abortCtrl = new AbortController();

    async function loadData() {
      if (!initialCached) {
        setIsLoading(true);
      }
      try {
        let activeSite = propSiteId || "";
        if (!activeSite) {
          try {
            const info = await getSiteInfo();
            activeSite = info?.siteId || "";
          } catch {}
        }
        if (isMounted) setResolvedSiteId(activeSite || "chatbubbles_local_site");

        const backendConfig = await fetchAnnouncementConfig(undefined, abortCtrl.signal);
        if (isMounted && backendConfig) {
          setConfig(backendConfig);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("[Announcement] Failed to fetch announcement config:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
      abortCtrl.abort();
    };
  }, [propSiteId]);

  // 2. Initialize or restore localStorage promotional window state
  useEffect(() => {
    if (isLoading || !config || !config.enabled) return;
    if (!resolvedSiteId) return;

    // Strict target audience check: Only show for free / trial users
    // Non-trial paid users must never see the promo banner
    const isEffectivePaidUser = Boolean(isLoggedIn && isPaidUser && !hasActiveTrial);
    const shouldHideForAudience = (config.showTo === "free") && isEffectivePaidUser;

    if (shouldHideForAudience) {
      return;
    }

    const userKey = resolveUserIdentifier(user);
    const key = buildStorageKey(config.campaignId, userKey, resolvedSiteId);
    storageKeyRef.current = key;

    const now = Date.now();
    let storedState: StoredPromoState | null = null;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.startTime === "number" && typeof parsed.expiresAt === "number") {
          storedState = parsed;
        }
      }
    } catch (e) {
      console.warn("[Announcement] Could not read localStorage:", e);
    }

    const durationMs = Math.max(0.1, config.durationMinutes || 3) * 60 * 1000;

    // 1. Check if snoozed / dismissed (from manual close or timer expiry)
    if (storedState?.dismissedUntil) {
      if (trialEndTimestamp && now >= trialEndTimestamp) {
        // If trial ended, show banner again
        storedState.manuallyClosed = false;
        storedState.dismissedUntil = null;
        storedState.startTime = now;
        storedState.expiresAt = now + durationMs;
        try {
          localStorage.setItem(key, JSON.stringify(storedState));
        } catch {}
        setIsDismissed(false);
      } else if (now < storedState.dismissedUntil) {
        setIsDismissed(true);
        return;
      } else {
        storedState = null;
      }
    }

    // 2. Check if countdown expired while user was away / in previous session
    if (storedState && config.countdownEnabled && now >= storedState.expiresAt) {
      const snoozeUntil = computeSnoozeTimestamp(trialEndTimestamp);
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ ...storedState, dismissedUntil: snoozeUntil })
        );
      } catch {}
      setIsDismissed(true);
      return;
    }

    // 3. Countdown is active or starting fresh
    if (storedState) {
      expiresAtRef.current = storedState.expiresAt;
      setIsCopied(Boolean(storedState.copied));
      const leftSec = Math.max(0, Math.ceil((storedState.expiresAt - now) / 1000));
      setRemainingSeconds(leftSec);
      setIsDismissed(false);
    } else {
      const expiresAt = now + durationMs;
      expiresAtRef.current = expiresAt;
      const freshState: StoredPromoState = {
        campaignId: config.campaignId,
        startTime: now,
        expiresAt,
        copied: false,
        dismissedUntil: null,
        manuallyClosed: false,
      };
      try {
        localStorage.setItem(key, JSON.stringify(freshState));
      } catch {}
      setRemainingSeconds(Math.ceil(durationMs / 1000));
      setIsCopied(false);
      setIsDismissed(false);
    }
  }, [isLoading, config, resolvedSiteId, isLoggedIn, isPaidUser, hasActiveTrial, user, trialEndTimestamp]);

  // 3. Countdown timer tick
  useEffect(() => {
    if (isDismissed || !config?.countdownEnabled || !expiresAtRef.current) return;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const expiresAt = expiresAtRef.current || now;
      const leftSec = Math.max(0, Math.ceil((expiresAt - now) / 1000));
      setRemainingSeconds(leftSec);

      if (leftSec <= 0) {
        clearInterval(intervalId);
        const snoozeUntil = computeSnoozeTimestamp(trialEndTimestamp);
        const key = storageKeyRef.current;
        if (key) {
          try {
            const raw = localStorage.getItem(key);
            const current = raw ? JSON.parse(raw) : {};
            localStorage.setItem(
              key,
              JSON.stringify({ ...current, dismissedUntil: snoozeUntil })
            );
          } catch {}
        }
        setIsDismissed(true);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isDismissed, config?.countdownEnabled, trialEndTimestamp]);

  // 4. Manual dismissal (X button click)
  const handleDismiss = useCallback(() => {
    const now = Date.now();
    const snoozeUntil = trialEndTimestamp && trialEndTimestamp > now
      ? trialEndTimestamp
      : now + SEVEN_DAYS_MS;
    const key = storageKeyRef.current;
    if (key) {
      try {
        const raw = localStorage.getItem(key);
        const current = raw ? JSON.parse(raw) : {};
        localStorage.setItem(
          key,
          JSON.stringify({
            ...current,
            manuallyClosed: true,
            dismissedUntil: snoozeUntil,
          })
        );
      } catch {}
    }
    setIsDismissed(true);
  }, [trialEndTimestamp]);

  // 5. Coupon code copy handler (Zero inline CSS compliant)
  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = config?.couponCode;
    if (!code) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.setAttribute("readonly", "");
        textarea.className = "cf-promo-clipboard-hidden";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(null), 1800);

      const key = storageKeyRef.current;
      if (key) {
        try {
          const raw = localStorage.getItem(key);
          const current = raw ? JSON.parse(raw) : {};
          localStorage.setItem(key, JSON.stringify({ ...current, copied: true }));
        } catch {}
      }
    } catch {
      window.prompt("Copy promotional code:", code);
      setIsCopied(true);
      const key = storageKeyRef.current;
      if (key) {
        try {
          const raw = localStorage.getItem(key);
          const current = raw ? JSON.parse(raw) : {};
          localStorage.setItem(key, JSON.stringify({ ...current, copied: true }));
        } catch {}
      }
    }
  };

  // 6. Navigation to Pricing Plans
  const handleNavigateToPricing = () => {
    if (config?.linkUrl && /^https?:\/\//i.test(config.linkUrl.trim())) {
      window.open(config.linkUrl.trim(), "_blank", "noopener,noreferrer");
      return;
    }
    if (onUpgrade) {
      onUpgrade();
    }
  };

  // ── Render Guard Conditions ──
  if (isLoading) {
    return (
      <div className="cf-promo-skeleton" role="status" aria-label="Loading promotion">
        <div className="cf-promo-skeleton-content">
          <div className="cf-promo-skeleton-line cf-promo-sk-timer" />
          <div className="cf-promo-skeleton-line cf-promo-sk-title" />
          <div className="cf-promo-skeleton-line cf-promo-sk-sub" />
          <div className="cf-promo-skeleton-pill" />
        </div>
        <div className="cf-promo-skeleton-art" />
      </div>
    );
  }

  // Not enabled or failed to fetch
  if (!config || !config.enabled) return null;

  // Site identity could not be resolved
  if (!resolvedSiteId) return null;

  // Audience restriction: Show for free / trial users only
  const isEffectivePaidUser = Boolean(isLoggedIn && isPaidUser && !hasActiveTrial);
  const shouldHideForAudience = (config.showTo === "free") && isEffectivePaidUser;
  if (shouldHideForAudience) return null;

  // Dismissed or countdown expired
  if (isDismissed) return null;

  // Countdown timer display string
  const totalSecs = remainingSeconds !== null ? remainingSeconds : (config.durationMinutes || 3) * 60;
  const formattedMins = Math.floor(Math.max(0, totalSecs) / 60);
  const formattedSecs = Math.max(0, totalSecs) % 60;
  const countdownText = `Offer closes in ${formattedMins}:${formattedSecs.toString().padStart(2, "0")}`;

  const hasCoupon = Boolean(config.couponCode);
  const showActionText = !hasCoupon || isCopied;

  return (
    <section className="cf-promo-card" role="region" aria-label={config.title || "Promotional Announcement"}>
      {/* Subtle decorative curved background shapes */}
      <svg className="cf-promo-bg-shapes" viewBox="0 0 380 180" fill="none" aria-hidden="true" preserveAspectRatio="none">
        <circle cx="340" cy="90" r="130" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
        <circle cx="340" cy="90" r="180" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" />
        <path d="M190 -30 Q 280 90 390 120" stroke="rgba(255, 255, 255, 0.09)" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Dismiss Button (Small X at top right) */}
      <button
        type="button"
        className="cf-promo-close-btn"
        onClick={handleDismiss}
        aria-label="Dismiss offer"
        title="Dismiss offer"
      >
        <X size={16} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {/* Left Column: Countdown, Heading, Subtitle, Action */}
      <div className="cf-promo-content">
        {config.countdownEnabled && (
          <div className="cf-promo-countdown" aria-live="polite">
            {countdownText}
          </div>
        )}

        <h2 className="cf-promo-title">{config.title}</h2>
        <p className="cf-promo-subtitle">{config.subtitle}</p>

        <div className="cf-promo-action-row">
          {!showActionText ? (
            <button
              type="button"
              className="cf-promo-pill-btn"
              onClick={handleCopyCode}
              aria-label={`Copy discount code ${config.couponCode}`}
              title="Click to copy coupon code"
            >
              <span className="cf-promo-btn-text">{config.couponCode}</span>
              <Copy size={13} strokeWidth={2.2} className="cf-promo-copy-icon" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="cf-promo-pill-btn cf-promo-pill-btn--action"
              onClick={handleNavigateToPricing}
              aria-label={config.buttonText || "Get Now"}
            >
              {copyFeedback ? (
                <span className="cf-promo-btn-copied">
                  <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                  <span>{copyFeedback}</span>
                </span>
              ) : (
                <span className="cf-promo-btn-text">{config.buttonText || "Get Now"}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Right Column: 3D Open Gift Box with Glowing Light & Silver Stars (Animated GIF) */}
      <div className="cf-promo-art" aria-hidden="true">
        <img
          src={giftBoxGif}
          alt="3D Animated Gift Box"
          className="cf-promo-box-img"
          loading="eager"
          decoding="async"
        />
      </div>
    </section>
  );
};

export default AnnouncementBanner;
