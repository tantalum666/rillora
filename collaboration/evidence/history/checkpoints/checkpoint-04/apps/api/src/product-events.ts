import type { Request } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { planMotivationSchema } from "./domain.js";

const clientSourceSchema = z.enum(["web", "ios"]);

const propertySchemas = {
  motivation_selected: z.object({ motivation: planMotivationSchema }).strict(),
  first_item_added: z.object({}).strict(),
  five_items_completed: z.object({}).strict(),
  item_outcome_assigned: z.object({}).strict(),
  item_role_assigned: z.object({
    role: z.enum(["trusted_contact", "executor", "recipient"]),
    scope: z.enum(["plan_wide", "matter_specific"]),
  }).strict(),
  official_setup_checked: z.object({ completed: z.boolean() }).strict(),
  simulation_completed: z.object({
    lifeEvent: z.enum(["death", "incapacity", "missing"]),
    kind: z.enum(["count_snapshot", "role_disclosure"]),
  }).strict(),
  start_here_exported: z.object({ format: z.enum(["plaintext", "encrypted"]) }).strict(),
} as const;

export type ProductEventName = keyof typeof propertySchemas;
export type ProductEventProperties<Name extends ProductEventName> = z.input<(typeof propertySchemas)[Name]>;
export type ProductClientSource = "web" | "ios" | "unknown";

export function productClientSource(request: Request): ProductClientSource {
  const parsed = clientSourceSchema.safeParse(request.get("x-rillora-client"));
  return parsed.success ? parsed.data : "unknown";
}

export async function appendProductEvent<Name extends ProductEventName>(
  client: PoolClient,
  source: ProductClientSource,
  eventName: Name,
  properties: ProductEventProperties<Name>,
): Promise<void> {
  const safeProperties = propertySchemas[eventName].parse(properties);
  await client.query(
    `insert into app.product_events (
       planner_id, event_name, client_source, properties
     ) values (
       app.current_planner_id(), $1, $2, $3::jsonb
     )`,
    [eventName, source, JSON.stringify(safeProperties)],
  );
}
