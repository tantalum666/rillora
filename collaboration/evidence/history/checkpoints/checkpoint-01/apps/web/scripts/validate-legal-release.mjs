import { loadEnv } from "vite";

const requiredPublicationFields = [
  "VITE_LEGAL_OPERATOR_NAME",
  "VITE_LEGAL_OPERATOR_COUNTRY",
  "VITE_LEGAL_SERVICE_ADDRESS",
  "VITE_LEGAL_SUPPORT_EMAIL",
  "VITE_LEGAL_PRIVACY_EMAIL",
  "VITE_LEGAL_SECURITY_EMAIL",
];

const loaded = loadEnv("production", process.cwd(), "");
const publicationEnvironment = { ...loaded, ...process.env };
const invalidFields = requiredPublicationFields.filter((field) => {
  const value = publicationEnvironment[field]?.trim();
  return !value
    || value.includes("[")
    || value.includes("]")
    || value.endsWith(".invalid");
});

if (invalidFields.length > 0) {
  throw new Error(`Release legal configuration is incomplete: ${invalidFields.join(", ")}`);
}

const emailFields = requiredPublicationFields.filter((field) => field.endsWith("_EMAIL"));
const malformedEmails = emailFields.filter((field) => (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicationEnvironment[field])
));

if (malformedEmails.length > 0) {
  throw new Error(`Release legal email configuration is invalid: ${malformedEmails.join(", ")}`);
}

console.log("Release legal configuration validated.");
