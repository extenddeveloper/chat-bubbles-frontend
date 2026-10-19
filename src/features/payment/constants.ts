export const PLANS = {
    monthly: {
        key: "monthly",
        title: "Monthly Plan",
        price: "$4.99",
        suffix: "Monthly",
        amount: 4.99,
        label: "Monthly",
        mode: "subscription",
    },
    yearly: {
        key: "yearly",
        title: "Yearly Plan",
        price: "$49.99",
        suffix: "Annually",
        amount: 49.99,
        label: "Yearly",
        mode: "subscription",
    },
    lifetime: {
        key: "lifetime",
        title: "Lifetime Plan",
        price: "$99.99",
        suffix: "One time",
        amount: 99.99,
        label: "Lifetime",
        mode: "payment",
        badge: "🔥 Limited",
    },
}

export const PLAN_FEATURES = [
    "All 14+ chat channels unlocked",
    "Unlimited multi-agent support team",
    "Full custom themes & color gradients",
    "Canvas style controls & zero watermarks",
    "Real-time analytics & click tracking",
]
