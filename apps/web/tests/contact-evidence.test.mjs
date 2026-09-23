import assert from "node:assert/strict";
import test from "node:test";
import { getTrustedContactEvidence } from "../src/contactEvidence.js";

test("simulation evidence is never promoted to accepted", () => {
  const evidence = getTrustedContactEvidence({
    status: "confirmed",
    roleStatus: "accepted",
    invitationStatus: "accepted",
    confirmationMode: "simulation",
  });

  assert.deepEqual(evidence, {
    label: "Simulated acceptance",
    accepted: false,
    simulated: true,
  });
});

test("only a non-simulated accepted invitation receives accepted evidence", () => {
  const evidence = getTrustedContactEvidence({
    status: "confirmed",
    roleStatus: "accepted",
    invitationStatus: "accepted",
    confirmationMode: "real",
  });

  assert.deepEqual(evidence, {
    label: "Invitation accepted",
    accepted: true,
    simulated: false,
  });
});

test("record-only, pending and revoked states remain distinct", () => {
  assert.equal(
    getTrustedContactEvidence({ status: "draft", roleStatus: "draft" }).label,
    "Record only — no invitation sent",
  );
  assert.equal(
    getTrustedContactEvidence({ status: "draft", roleStatus: "draft", invitationStatus: "pending" }).label,
    "Invitation pending",
  );
  assert.equal(
    getTrustedContactEvidence({ status: "revoked", roleStatus: "revoked" }).label,
    "Role revoked",
  );
});
