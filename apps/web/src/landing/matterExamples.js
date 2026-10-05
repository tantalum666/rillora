// Public illustrations only. No account data, provider lookup or persistence.
export const matterExamples = Object.freeze([
  {
    id: "account",
    labelKey: "public.category.accounts",
    titleKey: "public.example.account.title",
    typeKey: "public.example.account.type",
    icon: "bank",
    fields: [
      ["public.example.account.locationLabel", "public.example.account.location"],
      ["public.example.nextLabel", "public.example.account.next"],
    ],
    noteKey: "public.example.account.note",
  },
  {
    id: "document",
    labelKey: "public.category.documents",
    titleKey: "public.example.home.title",
    typeKey: "public.example.document.type",
    icon: "file",
    fields: [
      ["public.example.document.locationLabel", "public.example.document.location"],
      ["public.example.nextLabel", "public.example.document.next"],
    ],
    noteKey: "public.example.document.note",
  },
  {
    id: "device",
    labelKey: "public.category.devices",
    titleKey: "public.example.device.title",
    typeKey: "public.example.device.type",
    icon: "laptop",
    fields: [
      ["public.example.device.locationLabel", "public.example.device.location"],
      ["public.example.nextLabel", "public.example.device.next"],
    ],
    noteKey: "public.example.device.note",
  },
  {
    id: "digital",
    labelKey: "public.category.digital",
    titleKey: "public.example.digital.title",
    typeKey: "public.example.digital.type",
    icon: "coin",
    fields: [
      ["public.example.digital.providerLabel", "public.example.digital.provider"],
      ["public.example.nextLabel", "public.example.digital.next"],
    ],
    noteKey: "public.example.digital.note",
  },
]);
