import type { PoolClient } from "pg";
import { ApiError } from "./errors.js";

export type PlanRow = {
  public_id: string;
  motivation: string | null;
  status: string;
  first_use_state: string;
  first_use_step: number;
  policy_version: string;
  last_reviewed_at: Date | null;
  review_due_at: Date | null;
  version: number;
  created_at: Date;
  updated_at: Date;
};

export type MatterRow = {
  public_id: string;
  category: string;
  details: Record<string, string>;
  notes: string | null;
  title: string;
  institution_name: string | null;
  account_hint: string | null;
  value_band: string;
  currency_code: string | null;
  location_hint: string | null;
  importance: string;
  desired_outcome: string;
  status: string;
  review_due_at: Date | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
};

export type ContactRow = {
  public_id: string;
  display_name: string;
  relationship_label: string | null;
  status: string;
  role_status: string | null;
  invitation_status: string | null;
  delivery_channel: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
};

/** Contact identity is unique; the summary describes its plan-wide contact role. */
export async function selectTrustedContacts(client: PoolClient, publicId: string | null = null): Promise<ContactRow[]> {
  return (await client.query<ContactRow>(`
    select p.public_id, p.display_name, p.relationship_label, p.status, p.version,
      p.created_at, p.updated_at, ra.status as role_status,
      i.status as invitation_status, i.delivery_channel
    from app.people p
    left join lateral (
      select id, status from app.role_assignments
      where person_id=p.id and planner_id=p.planner_id
        and role='trusted_contact' and matter_item_id is null
      order by (status='revoked'), id desc limit 1
    ) ra on true
    left join lateral (
      select status, delivery_channel from app.invitations
      where role_assignment_id=ra.id and planner_id=p.planner_id
      order by id desc limit 1
    ) i on true
    where p.planner_id=app.current_planner_id()
      and ($1::uuid is null or p.public_id=$1)
      and ($1::uuid is not null or p.archived_at is null)
    order by p.id`, [publicId])).rows;
}

export function mapPlan(row: PlanRow) {
  return {
    publicId: row.public_id,
    motivation: row.motivation,
    status: row.status,
    firstUseState: row.first_use_state,
    firstUseStep: row.first_use_step,
    policyVersion: row.policy_version,
    lastReviewedAt: row.last_reviewed_at,
    reviewDueAt: row.review_due_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMatterInput(row: MatterRow) {
  return {
    category: row.category, title: row.title, institutionName: row.institution_name,
    accountHint: row.account_hint, valueBand: row.value_band, currencyCode: row.currency_code,
    locationHint: row.location_hint, importance: row.importance, desiredOutcome: row.desired_outcome,
    status: row.status, details: row.details ?? {}, notes: row.notes ?? null,
  };
}

export function mapMatter(row: MatterRow) {
  return {
    publicId: row.public_id,
    category: row.category,
    details: row.details ?? {},
    notes: row.notes ?? null,
    title: row.title,
    institutionName: row.institution_name,
    accountHint: row.account_hint,
    valueBand: row.value_band,
    currencyCode: row.currency_code,
    locationHint: row.location_hint,
    importance: row.importance,
    desiredOutcome: row.desired_outcome,
    status: row.status,
    reviewDueAt: row.review_due_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export function mapContact(row: ContactRow) {
  return {
    publicId: row.public_id,
    displayName: row.display_name,
    relationshipLabel: row.relationship_label,
    status: row.status,
    roleStatus: row.role_status,
    invitationStatus: row.invitation_status,
    confirmationMode: row.delivery_channel,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPlan(client: PoolClient): Promise<PlanRow> {
  const result = await client.query<PlanRow>(
    `select public_id, motivation, status, first_use_state, first_use_step,
            policy_version, last_reviewed_at,
            review_due_at, version, created_at, updated_at
     from app.plans where planner_id = app.current_planner_id()`,
  );
  const plan = result.rows[0];
  if (!plan) throw new ApiError(404, "plan_not_found", "The plan was not found.");
  return plan;
}
