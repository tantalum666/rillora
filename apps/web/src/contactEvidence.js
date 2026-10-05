export function getTrustedContactEvidence(contact, t) {
  if (!contact) {
    return { label: t ? t("workspace.contactEvidence.none") : "No contact record", accepted: false, simulated: false };
  }

  if (
    contact.status === "revoked"
    || contact.roleStatus === "revoked"
    || contact.invitationStatus === "revoked"
  ) {
    return { label: t ? t("workspace.contactEvidence.revoked") : "Role revoked", accepted: false, simulated: false };
  }

  if (contact.invitationStatus === "accepted" && contact.confirmationMode === "simulation") {
    return { label: t ? t("workspace.contactEvidence.simulated") : "Simulated acceptance", accepted: false, simulated: true };
  }

  if (contact.invitationStatus === "accepted") {
    return { label: t ? t("workspace.contactEvidence.accepted") : "Invitation accepted", accepted: true, simulated: false };
  }

  if (contact.invitationStatus === "pending") {
    return { label: t ? t("workspace.contactEvidence.pending") : "Invitation pending", accepted: false, simulated: false };
  }

  return { label: t ? t("workspace.contactEvidence.recordOnly") : "Record only — no invitation sent", accepted: false, simulated: false };
}
