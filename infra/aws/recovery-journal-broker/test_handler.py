import hashlib
import hmac
import importlib.util
import json
from pathlib import Path
import secrets
import sys
import types
import unittest
sys.modules.setdefault("boto3", types.SimpleNamespace())
spec = importlib.util.spec_from_file_location("journal_broker", Path(__file__).with_name("handler.py"))
broker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(broker)
GENERATION = "11111111-1111-4111-8111-111111111111"
ENTITY = "22222222-2222-4222-8222-222222222222"


class Database:
    class Conflict(Exception): pass
    exceptions = types.SimpleNamespace(ConditionalCheckFailedException=Conflict)
    def __init__(self):
        self.items = {"__coverage": {"payload": {"S": json.dumps({"version": 1, "databaseGeneration": GENERATION})}}}
        self.writes = 0
    def get_item(self, **request):
        return {"Item": self.items.get(request["Key"]["sk"]["S"], {})}
    def put_item(self, **request):
        self.writes += 1
        item = request["Item"]
        key = item["sk"]["S"]
        current = self.items.get(key)
        if current and int(current["revision"]["N"]) >= int(item["revision"]["N"]):
            raise self.Conflict()
        self.items[key] = item
        assert request["ConditionExpression"] == "attribute_not_exists(revision) OR revision < :incoming"


class JournalProof(unittest.TestCase):
    def setUp(self):
        self.key = secrets.token_urlsafe(48)
        self.db = Database()
    def envelope(self, revision="3"):
        event = {"key": "matter:" + ENTITY, "kind": "matter", "id": ENTITY, "revision": revision,
                 "recordedAt": "2026-10-11T00:00:00Z", "facts": {"version": 1, "archived": True, "private": False}}
        body = json.dumps(event, sort_keys=True)
        result = {"version": 1, "generation": GENERATION, "transaction": "200", "event": body}
        result["signature"] = hmac.new(self.key.encode(), f"rillora-journal-event-v1|{GENERATION}|200|{body}".encode(), hashlib.sha256).hexdigest()
        return result
    def test_exact_record_gets_bound_receipt_and_duplicate_is_idempotent(self):
        envelope = self.envelope()
        result = broker.publish(self.db, "fixture", envelope, self.key)
        self.assertEqual(result, broker.publish(self.db, "fixture", envelope, self.key))
        expected = hmac.new(self.key.encode(), f'rillora-journal-ack-v1|{GENERATION}|200|{hashlib.sha256(envelope["event"].encode()).hexdigest()}|3'.encode(), hashlib.sha256).hexdigest()
        self.assertEqual(result["receipt"], expected)
    def test_mutation_of_each_signed_field_is_refused_without_write(self):
        for field, value in [("generation", ENTITY), ("transaction", "201"), ("event", "{}"), ("signature", "0" * 64), ("version", True)]:
            envelope = self.envelope()
            envelope[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                broker.publish(self.db, "fixture", envelope, self.key)
        self.assertEqual(self.db.writes, 0)
    def test_old_revision_does_not_overwrite_new_and_equal_revision_conflict_has_no_receipt(self):
        broker.publish(self.db, "fixture", self.envelope("5"), self.key)
        broker.publish(self.db, "fixture", self.envelope("3"), self.key)
        self.assertEqual(self.db.items["matter:" + ENTITY]["revision"]["N"], "5")
        self.db.items["matter:" + ENTITY]["payload"]["S"] = "{}"
        with self.assertRaises(ValueError):
            broker.publish(self.db, "fixture", self.envelope("5"), self.key)
    def test_missing_coverage_cannot_be_initialized_by_the_publisher(self):
        del self.db.items["__coverage"]
        with self.assertRaises(ValueError):
            broker.publish(self.db, "fixture", self.envelope(), self.key)
        self.assertEqual(self.db.writes, 0)
    def test_ai_records_allow_only_revocation_metadata(self):
        for facts, accepted in [({"revokeOnRestore": True}, True), ({"revokeOnRestore": 1}, False),
                                ({"revokeOnRestore": False}, False), ({"revokeOnRestore": True, "title": "private"}, False)]:
            envelope = self.envelope()
            event = json.loads(envelope["event"])
            event.update(key="ai_connection:" + ENTITY, kind="ai_connection", facts=facts)
            envelope["event"] = json.dumps(event, sort_keys=True)
            envelope["signature"] = hmac.new(self.key.encode(), f'rillora-journal-event-v1|{GENERATION}|200|{envelope["event"]}'.encode(), hashlib.sha256).hexdigest()
            if accepted:
                self.assertEqual(broker.verify_envelope(envelope, self.key)["facts"], facts)
            else:
                with self.assertRaises(ValueError): broker.verify_envelope(envelope, self.key)

    def test_future_notice_records_never_carry_identity_or_content(self):
        for facts, accepted in [({"revokeOnRestore": True}, True), ({"revokeOnRestore": False}, False),
                                ({"revokeOnRestore": True, "email": "synthetic@example.test"}, False),
                                ({"revokeOnRestore": True, "matters": []}, False)]:
            envelope = self.envelope()
            event = json.loads(envelope["event"])
            event.update(key="future_notice:" + ENTITY, kind="future_notice", facts=facts)
            envelope["event"] = json.dumps(event, sort_keys=True)
            envelope["signature"] = hmac.new(self.key.encode(), f'rillora-journal-event-v1|{GENERATION}|200|{envelope["event"]}'.encode(), hashlib.sha256).hexdigest()
            if accepted:
                self.assertEqual(broker.verify_envelope(envelope, self.key)["facts"], facts)
            else:
                with self.assertRaises(ValueError): broker.verify_envelope(envelope, self.key)

    def test_content_controls_cannot_restore_files_or_carry_content(self):
        for kind, facts, accepted in [("legacy_asset", {"deleted": True}, True),
                                      ("legacy_asset", {"deleted": False}, False),
                                      ("legacy_asset", {"deleted": True, "file": "private"}, False),
                                      ("legacy_publication", {"revokeOnRestore": True}, True),
                                      ("legacy_publication", {"revokeOnRestore": False}, False)]:
            envelope = self.envelope()
            event = json.loads(envelope["event"])
            event.update(key=kind + ":" + ENTITY, kind=kind, facts=facts)
            envelope["event"] = json.dumps(event, sort_keys=True)
            envelope["signature"] = hmac.new(self.key.encode(), f'rillora-journal-event-v1|{GENERATION}|200|{envelope["event"]}'.encode(), hashlib.sha256).hexdigest()
            if accepted:
                self.assertEqual(broker.verify_envelope(envelope, self.key)["facts"], facts)
            else:
                with self.assertRaises(ValueError): broker.verify_envelope(envelope, self.key)


if __name__ == "__main__":
    unittest.main()
