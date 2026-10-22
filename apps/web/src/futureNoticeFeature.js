export const FUTURE_NOTICES_ENABLED = typeof import.meta.env !== "undefined"
  && import.meta.env.VITE_RILLORA_FUTURE_NOTICES === "true"
  && !["closed", "restricted-review"].includes(import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS);
