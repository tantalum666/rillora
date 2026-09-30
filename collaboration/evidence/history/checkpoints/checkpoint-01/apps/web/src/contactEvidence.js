export function getTrustedContactEvidence(contact) {
  if (!contact) {
    return { label: "No contact record", accepted: false, simulated: false };
  }

  if (
    contact.status === "revoked"
    || contact.roleStatus === "revoked"
    || contact.invitationStatus === "revoked"
  ) {
    return { label: "Role revoked", accepted: false, simulated: false };
  }

  if (contact.invitationStatus === "accepted" && contact.confirmationMode === "simulation") {
    return { label: "Simulated acceptance", accepted: false, simulated: true };
  }

  if (contact.invitationStatus === "accepted") {
    return { label: "Invitation accepted", accepted: true, simulated: false };
  }

  if (contact.invitationStatus === "pending") {
    return { label: "Invitation pending", accepted: false, simulated: false };
  }

  return { label: "Record only — no invitation sent", accepted: false, simulated: false };
}
