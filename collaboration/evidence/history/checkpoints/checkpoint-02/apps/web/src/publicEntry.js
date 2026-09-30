import entry from "../../../config/public-entry.json" with { type: "json" };

const allowedOrigins = new Set([
  "https://app.staging.rillora.xyz",
  "https://app.rillora.xyz",
]);
if (
  entry.schemaVersion !== 1 ||
  !allowedOrigins.has(entry.appOrigin) ||
  entry.accountPath !== "/account" ||
  entry.invitationPath !== "/invite" ||
  entry.preview !== (entry.appOrigin === "https://app.staging.rillora.xyz")
) {
  throw new Error("Invalid public account destination");
}

export const publicEntry = Object.freeze({
  appURL: entry.appOrigin,
  accountURL: `${entry.appOrigin}${entry.accountPath}`,
  invitationURL: `${entry.appOrigin}${entry.invitationPath}`,
  preview: entry.preview,
});
