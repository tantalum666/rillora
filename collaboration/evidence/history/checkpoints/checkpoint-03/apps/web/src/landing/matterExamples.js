// Public illustrations only. No account data, provider lookup or persistence.
export const matterExamples = Object.freeze([
  {
    id: "account",
    label: "Accounts",
    title: "Everyday account",
    type: "Account",
    icon: "bank",
    fields: [
      ["Where to find it", "Account provider and a safe reference"],
      ["What happens next", "Contact the provider"],
    ],
    note: "Keep the paperwork together so someone knows where to begin.",
  },
  {
    id: "document",
    label: "Documents",
    title: "Home documents",
    type: "Document",
    icon: "file",
    fields: [
      ["Document location", "The green folder in the study"],
      ["What happens next", "Speak with the named solicitor"],
    ],
    note: "Record where the originals are kept and who can help.",
  },
  {
    id: "device",
    label: "Devices",
    title: "Work laptop",
    type: "Device",
    icon: "laptop",
    fields: [
      ["Device location", "The desk in the study"],
      ["What happens next", "Contact the workplace IT team"],
    ],
    note: "Leave handling instructions without recording the device password.",
  },
  {
    id: "digital",
    label: "Digital assets",
    title: "Exchange account",
    type: "Digital asset",
    icon: "coin",
    fields: [
      ["Held with", "A named exchange · not a self-custody wallet"],
      ["What happens next", "Use the provider’s official request process"],
    ],
    note: "Record the provider and a safe reference, never a seed phrase or private key.",
  },
]);
