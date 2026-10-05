// Public synthetic examples contain message IDs, never account or recipient data.
export const demoMatters = Object.freeze([
  {
    id: "insurance",
    titleKey: "public.example.insurance.title",
    detailKey: "public.example.insurance.detail",
    noteKey: "public.example.insurance.note",
    recipients: ["mum"],
  },
  {
    id: "home",
    titleKey: "public.example.home.title",
    detailKey: "public.example.home.detail",
    noteKey: "public.example.home.note",
    recipients: ["mum"],
  },
  {
    id: "crypto",
    titleKey: "public.example.crypto.title",
    detailKey: "public.example.crypto.detail",
    noteKey: "public.example.crypto.note",
    recipients: ["alex"],
  },
]);

export const demoPeople = Object.freeze([
  { id: "mum", nameKey: "public.example.mum" },
  { id: "alex", nameKey: "public.example.alex" },
]);

export function sharedDemoMatters(person) {
  return demoMatters
    .filter((matter) => matter.recipients.includes(person))
    .map(({ id, titleKey, detailKey, noteKey }) => ({ id, titleKey, detailKey, noteKey }));
}
