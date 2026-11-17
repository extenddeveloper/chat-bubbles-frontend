import { useEffect, useState } from "react"
import { fetchPlanPrices, DEFAULT_FALLBACK_PLANS, type StripePlans } from "../services/paymentService"

export function usePlanAvailability(initialPlans?: StripePlans | null) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const base = initialPlans && Object.keys(initialPlans).length > 0 ? initialPlans : DEFAULT_FALLBACK_PLANS
    return {
      monthly: Boolean(base.monthly?.enabled !== false),
      yearly: Boolean(base.yearly?.enabled === true),
      lifetime: Boolean(base.lifetime?.enabled !== false),
    }
  })

  const [plans, setPlans] = useState<Record<string, any>>(() => {
    const base = initialPlans && Object.keys(initialPlans).length > 0 ? initialPlans : DEFAULT_FALLBACK_PLANS
    const normalized: Record<string, any> = {}
    for (const key of ["monthly", "yearly", "lifetime"] as const) {
      const p = (base as any)[key] || (DEFAULT_FALLBACK_PLANS as any)[key]
      normalized[key] = {
        ...p,
        key,
        enabled: typeof p?.enabled === "boolean" ? p.enabled : key !== "yearly",
        formattedDiscountedPrice: p?.formattedDiscountedPrice || p?.discount?.discountedFormattedPrice || null,
        defaultCouponCode: p?.defaultCouponCode || p?.discount?.code || null,
      }
    }
    return normalized
  })

  const [error, setError] = useState<string>("")
  const [attempt, retry] = useState(0)

  useEffect(() => {
    let active = true

    const load = () =>
      fetchPlanPrices()
        .then((fetched) => {
          if (!active) return
          if (!fetched || typeof fetched !== "object") {
            throw new Error("Invalid plan configuration")
          }

          const normalized: Record<string, any> = {}
          for (const key of ["monthly", "yearly", "lifetime"] as const) {
            const p = (fetched as any)[key] || (DEFAULT_FALLBACK_PLANS as any)[key]
            normalized[key] = {
              ...p,
              key,
              enabled: typeof p?.enabled === "boolean" ? p.enabled : key !== "yearly",
              formattedDiscountedPrice: p?.formattedDiscountedPrice || p?.discount?.discountedFormattedPrice || null,
              defaultCouponCode: p?.defaultCouponCode || p?.discount?.code || null,
            }
          }

          setPlans(normalized)
          setEnabled({
            monthly: Boolean(normalized.monthly?.enabled !== false),
            yearly: Boolean(normalized.yearly?.enabled === true),
            lifetime: Boolean(normalized.lifetime?.enabled !== false),
          })
          setError("")
        })
        .catch((err) => {
          if (!active) return
          console.warn("Failed to update plan prices from backend:", err)
        })

    void load()
    const timer = setInterval(load, 60000)
    window.addEventListener("focus", load)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener("focus", load)
    }
  }, [attempt])

  return { enabled, plans, error, retry: () => retry((v) => v + 1) }
}
