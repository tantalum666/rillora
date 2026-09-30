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
};
export function productClientSource(request) {
    const parsed = clientSourceSchema.safeParse(request.get("x-rillora-client"));
    return parsed.success ? parsed.data : "unknown";
}
export async function appendProductEvent(client, source, eventName, properties) {
    const safeProperties = propertySchemas[eventName].parse(properties);
    await client.query(`insert into app.product_events (
       planner_id, event_name, client_source, properties
     ) values (
       app.current_planner_id(), $1, $2, $3::jsonb
     )`, [eventName, source, JSON.stringify(safeProperties)]);
}
