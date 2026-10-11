import base64
import contextlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from credential_store import CredentialStore, run_with_private_json
from migrate_local_credential import migrate


class MemoryVault:
    def __init__(self):
        self.values = {}
        self.deny = False
    def __call__(self, request):
        if self.deny:
            raise RuntimeError("User presence was not completed")
        if request["operation"] == "probe":
            return {"ready": True}
        account = request["account"]
        if request["operation"] == "get":
            return {"data": base64.b64encode(self.values[account]).decode()}
        if request["operation"] == "put" and account in self.values:
            raise RuntimeError("Duplicate protected item")
        self.values[account] = base64.b64decode(request["data"])
        return {"updated" if request["operation"] == "update" else "stored": True, "envelope": {"synthetic": account}}


class ProtectedCredentialStore(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.path = self.root / ".local-secrets/production-identity/web-client.json"
        self.vault = MemoryVault()
        self.store = CredentialStore(self.root, self.vault)
        self.value = b"synthetic credential payload, no service access"
    def tearDown(self):
        self.temporary.cleanup()
    def legacy(self):
        self.path.parent.mkdir(parents=True, mode=0o700)
        self.path.write_bytes(self.value)
        self.path.chmod(0o600)
    def test_persists_only_reference_and_access_failure_never_falls_back(self):
        self.store.put(self.path, self.value)
        self.assertNotIn(self.value, self.path.read_bytes())
        self.assertEqual(self.store.read(self.path), self.value)
        self.vault.deny = True
        with self.assertRaises(RuntimeError):
            self.store.read(self.path)
        self.assertNotIn(self.value, self.path.read_bytes())
    def test_failed_store_keeps_only_recovery_reference_without_secret(self):
        self.vault.deny = True
        with self.assertRaises(RuntimeError):
            self.store.put(self.path, self.value)
        self.assertEqual(json.loads(self.path.read_text())["storage"], "macos-secure-enclave-user-presence")
        self.assertNotIn(self.value, self.path.read_bytes())
    def test_legacy_file_is_not_a_silent_plaintext_read_fallback(self):
        self.legacy()
        self.path.write_text(json.dumps({"client_secret": self.value.decode()}))
        with self.assertRaisesRegex(RuntimeError, "explicit protected migration"):
            self.store.read(self.path)
    def test_plan_reads_only_metadata_and_apply_verifies_before_replacing(self):
        self.legacy()
        with patch.object(Path, "read_bytes", side_effect=AssertionError("Plan must not read credentials")):
            self.assertFalse(migrate(self.path, False, self.store)["secretRead"])
        self.vault.deny = True
        with self.assertRaises(RuntimeError):
            migrate(self.path, True, self.store)
        self.assertEqual(self.path.read_bytes(), self.value)
        self.vault.deny = False
        self.assertTrue(migrate(self.path, True, self.store)["protectedReadbackMatched"])
        self.assertNotIn(self.value, self.path.read_bytes())
        self.assertTrue(migrate(self.path, True, self.store)["alreadyProtected"])
    def test_mismatched_readback_preserves_original(self):
        self.legacy()
        original_call = self.store.transport
        def mismatched(request):
            if request["operation"] == "get":
                return {"data": base64.b64encode(b"different synthetic value").decode()}
            return original_call(request)
        self.store.transport = mismatched
        with self.assertRaisesRegex(RuntimeError, "did not match"):
            migrate(self.path, True, self.store)
        self.assertEqual(self.path.read_bytes(), self.value)
    def test_rejects_symlinks_outside_project_and_unsafe_permissions(self):
        self.legacy()
        self.path.chmod(0o644)
        with self.assertRaises(RuntimeError):
            self.store.read(self.path)
        outside = self.root / "outside"
        outside.write_bytes(self.value)
        with self.assertRaises(RuntimeError):
            self.store.read(outside)
        link = self.path.with_name("link")
        link.symlink_to(outside)
        with self.assertRaises(RuntimeError):
            self.store.read(link)
    def test_secret_json_crosses_only_anonymous_pipe_not_argv_stdin_or_disk(self):
        script = self.root / "receiver.py"
        script.write_text("""import json,os,sys
path=sys.argv[sys.argv.index('--cli-input-json')+1]
assert path.startswith('file:///dev/fd/')
with open(path.removeprefix('file://')) as source: body=json.load(source)
assert sys.stdin.read()==''
assert body['value'] not in ' '.join(sys.argv)
print(json.dumps({'received':len(body['value']),'files':sorted(os.listdir(os.path.dirname(__file__)))}))
""")
        value = "synthetic bounded transfer " * 2000
        result = run_with_private_json([sys.executable, str(script)], {"value": value}, timeout=10)
        self.assertEqual(result.returncode, 0)
        receipt = json.loads(result.stdout)
        self.assertEqual(receipt["received"], len(value))
        self.assertEqual(receipt["files"], ["receiver.py"])
        self.assertNotIn(value, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
