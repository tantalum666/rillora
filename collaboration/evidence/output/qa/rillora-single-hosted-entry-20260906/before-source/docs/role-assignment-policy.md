# Planner-Authored Role Assignment Policy

Role: focused role-policy contract  
Authority scope: planner-authored role records, scopes, evidence labels and lifecycle invalidation  
Superseded by: later explicit product or security decision  
Do not use for: legal authority, invitation delivery, recipient identity or actual disclosure  
Status: LOCAL API/WEB/IOS EDITOR IMPLEMENTED; AUTHORITY AND DELIVERY CLOSED  
Last updated: 2026-08-10

## Purpose

Rillora lets a planner record who may be relevant to the plan and to an individual matter without implying that the person has accepted, been identified, obtained authority or received data. The policy editor exists to make future disclosure rehearsal more precise; it is not an executor appointment service or recipient portal.

## Role And Scope Contract — LOCKED

| Role | Allowed scope | Meaning |
| --- | --- | --- |
| `trusted_contact` | plan-wide or one active matter | A person recorded for future contact or verification participation |
| `executor` | plan-wide or one active matter | A person recorded as a possible executor; Rillora does not establish the appointment |
| `recipient` | exactly one active matter | A person recorded as an intended recipient for information about that matter |

- An active assignment is unique for the same planner, person, role and scope. A revoked assignment may later be recreated as a new record.
- `recipient` can never be plan-wide. A matter-scoped role can refer only to an active matter owned by the same planner.
- A role record never grants account access, ownership, legal authority, invitation acceptance, disclosure retrieval or release eligibility.

## Evidence And Editability — LOCKED

Invitation state and role state remain separate. The editor exposes `record_only`, `simulation`, `invitation_pending` or `invitation_accepted` as evidence labels, not authority levels.

A role can be edited only while it is `draft`, evidence is `record_only`, and no invitation row is attached. Once invitation evidence exists, the assignment is frozen for historical integrity; the planner must explicitly revoke it and create a new record instead of rewriting the old evidence.

All edits use optimistic `expectedVersion` checks. Revoke is explicit and irreversible for that record. API and database responses keep all of the following hard false: authority granted, account access granted, ownership transferred, disclosure enabled and data released.

## Lifecycle And Snapshot Semantics

- Revoking a role revokes any attached pending or accepted invitation in the same transaction.
- Revoking or archiving a person revokes all of that person's active roles and invitations, not only `trusted_contact` records.
- Archiving a matter revokes every active role and invitation scoped to that matter.
- Every successful create, edit, revoke or relevant lifecycle cascade increments the planner's role-policy version.
- Existing disclosure rehearsals retain their frozen historical snapshot but become stale. A stale snapshot cannot advance; the planner must create a fresh rehearsal before inspecting current policy.
- Audit events contain identifiers, role/scope transitions, evidence class and versions, never matter content, contact details or secrets.

## Shared API

- `GET /v1/role-assignments`
- `POST /v1/role-assignments`
- `PATCH /v1/role-assignments/:id`
- `DELETE /v1/role-assignments/:id`

All routes are planner-authenticated, tenant-scoped and protected by forced row-level security. Cookie mutations require CSRF proof; native Bearer mutations retain the typed native-session boundary.

## Platform Presentation

- Web provides a batch coverage view across active matters, then create, edit and revoke drawers. It warns before abandoning an unsaved Matter form.
- iOS opens a native role-policy `Form` from the Matter editor and uses injected service/store state for load, save, conflict, revoke and recovery.
- Both platforms show record-only and invitation-backed evidence distinctly and never label a role as authorised or delivered.

## Evidence Boundary

Local evidence on 2026-08-10 covers role/scope validation, active uniqueness, optimistic conflicts, invitation-backed edit lock, person and matter lifecycle cascades, RLS/least privilege, snapshot invalidation and strict client decoding. API tests pass 38/38, Web API-client tests pass 11/11, and native iOS tests pass 67/67 on iPhone 17e Simulator with iOS 26.5. Web manual QA exercised batch coverage, create, edit, disclosure preview, revoke, stale warning, fresh snapshot and unsaved-Matter protection.

This does not prove invitation delivery, recipient identity or consent, legally valid appointment, actual disclosure, external platform action, manual iOS role-editor UI, production deployment or market use.
