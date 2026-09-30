export const demoMatters = Object.freeze([
  {
    id: "insurance",
    title: "Insurance",
    detail: "Policy location",
    note: "Example: the policy documents are in the green folder at home. Contact the insurer for the next step.",
    recipients: ["mum"],
  },
  {
    id: "home",
    title: "Home documents",
    detail: "Where to find them",
    note: "Example: property records and the solicitor’s contact details are kept together in the home documents folder.",
    recipients: ["mum"],
  },
  {
    id: "crypto",
    title: "Crypto account",
    detail: "Exchange and next steps",
    note: "Example: this account is held at Coinbase. Use its official estate request process; no passwords or recovery phrases belong here.",
    recipients: ["alex"],
  },
]);

export const demoPeople = Object.freeze([
  { id: "mum", name: "Mum", initial: "M" },
  { id: "alex", name: "Alex", initial: "A" },
]);

export function sharedDemoMatters(person) {
  return demoMatters
    .filter((matter) => matter.recipients.includes(person))
    .map(({ id, title, detail, note }) => ({ id, title, detail, note }));
}
