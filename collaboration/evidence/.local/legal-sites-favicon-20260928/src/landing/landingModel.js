export const demoMatters = Object.freeze([
  {
    id: "insurance",
    title: "Insurance",
    detail: "Policy location",
    recipients: ["mum"],
  },
  {
    id: "home",
    title: "Home documents",
    detail: "Where to find them",
    recipients: ["mum"],
  },
  {
    id: "crypto",
    title: "Crypto account",
    detail: "Exchange and next steps",
    recipients: ["alex"],
  },
]);

export const demoPeople = Object.freeze([
  { id: "mum", name: "Mum", initial: "M" },
  { id: "alex", name: "Alex", initial: "A" },
]);

export const demoSteps = Object.freeze([
  {
    title: "Add a matter",
    short: "Organise",
    detail: "Record what exists and where to find it.",
  },
  {
    title: "Choose what to show",
    short: "Choose",
    detail: "Give each person their own view.",
  },
  {
    title: "Send an invitation",
    short: "Share",
    detail: "They accept with their own account.",
  },
]);

export function sharedDemoMatters(person) {
  return demoMatters
    .filter((matter) => matter.recipients.includes(person))
    .map(({ id, title, detail }) => ({ id, title, detail }));
}
