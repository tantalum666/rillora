"""Independent writer: accepts only exact database-authenticated control envelopes."""
import hashlib
import hmac
import json
import os
import re
import time
import boto3

UUID = re.compile(r"^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$")
SEQUENCE = re.compile(r"^[1-9][0-9]{0,18}$")
KINDS = {"account", "connection", "matter", "person", "free_slot", "unreconciled_access", "retention_hold", "ai_connection"}


def verify_envelope(envelope, key):
    if not isinstance(envelope, dict) or set(envelope) != {"version", "generation", "transaction", "event", "signature"}:
        raise ValueError("Invalid journal envelope")
    generation, transaction, body, signature = (envelope[k] for k in ("generation", "transaction", "event", "signature"))
    if (type(envelope["version"]) is not int or envelope["version"] != 1
            or not isinstance(generation, str) or not UUID.fullmatch(generation)
            or not isinstance(transaction, str) or not SEQUENCE.fullmatch(transaction)
            or not isinstance(body, str) or len(body.encode()) > 300000
            or not isinstance(signature, str) or not re.fullmatch(r"[a-f0-9]{64}", signature)):
        raise ValueError("Invalid journal envelope")
    message = f"rillora-journal-event-v1|{generation}|{transaction}|{body}".encode()
    expected = hmac.new(key.encode(), message, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise ValueError("Invalid journal proof")
    event = json.loads(body)
    if (not isinstance(event, dict) or set(event) != {"key", "kind", "id", "revision", "recordedAt", "facts"}
            or event["kind"] not in KINDS or not isinstance(event["id"], str) or not UUID.fullmatch(event["id"])
            or event["key"] != f'{event["kind"]}:{event["id"]}'
            or not isinstance(event["revision"], str) or not SEQUENCE.fullmatch(event["revision"])
            or not isinstance(event["facts"], dict)):
        raise ValueError("Invalid captured journal record")
    if event["kind"] == "ai_connection" and (set(event["facts"]) != {"revokeOnRestore"} or event["facts"]["revokeOnRestore"] is not True):
        raise ValueError("AI recovery records must only revoke access")
    return event


def coverage(db, table, generation):
    if not isinstance(generation, str) or not UUID.fullmatch(generation):
        raise ValueError("Invalid generation")
    result = db.get_item(TableName=table, Key={"pk": {"S": "rillora-production"}, "sk": {"S": "__coverage"}}, ConsistentRead=True)
    current = json.loads(result.get("Item", {}).get("payload", {}).get("S", "null"))
    if not isinstance(current, dict) or current.get("version") != 1 or current.get("databaseGeneration") != generation:
        raise ValueError("Recovery coverage unavailable")


def publish(db, table, envelope, key):
    event = verify_envelope(envelope, key)
    coverage(db, table, envelope["generation"])
    item = {"pk": {"S": "rillora-production"}, "sk": {"S": event["key"]},
            "revision": {"N": event["revision"]}, "payload": {"S": envelope["event"]}}
    if event["kind"] != "retention_hold" or event["facts"].get("active") is not True:
        item["expiresAt"] = {"N": str(int(time.time()) + 90 * 86400)}
    try:
        db.put_item(TableName=table, Item=item, ConditionExpression="attribute_not_exists(revision) OR revision < :incoming",
                    ExpressionAttributeValues={":incoming": {"N": event["revision"]}})
    except db.exceptions.ConditionalCheckFailedException:
        current = db.get_item(TableName=table, Key={"pk": item["pk"], "sk": item["sk"]}, ConsistentRead=True).get("Item", {})
        revision = int(current.get("revision", {}).get("N", "-1"))
        if revision < int(event["revision"]) or (revision == int(event["revision"]) and current.get("payload", {}).get("S") != envelope["event"]):
            raise ValueError("Conflicting journal evidence")
    message = f'rillora-journal-ack-v1|{envelope["generation"]}|{envelope["transaction"]}|{hashlib.sha256(envelope["event"].encode()).hexdigest()}|{event["revision"]}'
    return {"receipt": hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest()}


def handler(event, _context):
    if not isinstance(event, dict):
        raise ValueError("Invalid operation")
    db = boto3.client("dynamodb", region_name="eu-central-1")
    table = os.environ["JOURNAL_TABLE"]
    if event.get("operation") == "coverage" and set(event) == {"operation", "generation"}:
        coverage(db, table, event["generation"])
        return {"ready": True}
    if event.get("operation") != "publish" or set(event) != {"operation", "envelope"}:
        raise ValueError("Invalid operation")
    secret = boto3.client("secretsmanager", region_name="eu-central-1").get_secret_value(SecretId=os.environ["ATTESTATION_SECRET_ARN"])["SecretString"]
    if not re.fullmatch(r"[A-Za-z0-9_-]{48,128}", secret):
        raise ValueError("Journal authority unavailable")
    return publish(db, table, event["envelope"], secret)
