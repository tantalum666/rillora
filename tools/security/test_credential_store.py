import base64
import contextlib
import io
import json
import http.server
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
import uuid
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
        script = self.root / "aws"
        script.write_text("#!" + sys.executable + "\n" + """import json,os,sys
body={}
for option in ['--secret-id','--secret-string','--client-request-token']:
 path=sys.argv[sys.argv.index(option)+1]
 assert path.startswith('file:///dev/fd/')
 with open(path.removeprefix('file://')) as source: body[option]=source.read()
assert sys.stdin.read()==''
assert body['--secret-string'] not in ' '.join(sys.argv)
print(json.dumps({'received':len(body['--secret-string']),'files':sorted(os.listdir(os.path.dirname(__file__)))}))
""")
        script.chmod(0o700)
        value = "synthetic bounded transfer " * 2000
        body = {"SecretId": "synthetic-local-only", "SecretString": value,
                "ClientRequestToken": str(uuid.uuid4())}
        result = run_with_private_json([str(script), "secretsmanager", "put-secret-value"], body, timeout=10)
        self.assertEqual(result.returncode, 0)
        receipt = json.loads(result.stdout)
        self.assertEqual(receipt["received"], len(value))
        self.assertEqual(receipt["files"], ["aws"])
        self.assertNotIn(value, result.stdout + result.stderr)

    def test_private_upload_rejects_unsupported_fields_debug_and_overrides_before_execution(self):
        command = ["aws", "secretsmanager", "put-secret-value"]
        body = {"SecretId": "synthetic-local-only", "SecretString": "synthetic value"}
        with patch("credential_store.subprocess.Popen") as start:
            for candidate, payload in [
                (command, {**body, "SecretBinary": "unsupported"}),
                (command, {**body, "SecretString": 1}),
                (command, {**body, "SecretString": "synthetic\r\nvalue"}),
                (command, {**body, "SecretString": "x" * 131073}),
                (command + ["--debug"], body),
                (command + ["--secret-string=override"], body),
                (["aws", "secretsmanager", "get-secret-value"], body),
            ]:
                with self.assertRaises(RuntimeError):
                    run_with_private_json(candidate, payload)
            start.assert_not_called()

    @unittest.skipUnless(shutil.which("aws"), "AWS CLI is needed for the loopback parser regression")
    def test_actual_aws_cli_preserves_private_fields_at_loopback_endpoint(self):
        received = []
        body = {"SecretId": "arn:aws:secretsmanager:eu-central-1:133857166372:secret:synthetic-local-only",
                "SecretString": json.dumps({"marker": "file:///never-read",
                                             "value": "中文 / café / 😀\r\n" * 700}, ensure_ascii=False),
                "ClientRequestToken": str(uuid.uuid4())}
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                received.append(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
                response = json.dumps({"ARN": body["SecretId"], "Name": "synthetic-local-only",
                                       "VersionId": body["ClientRequestToken"]}).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/x-amz-json-1.1")
                self.send_header("Content-Length", str(len(response)))
                self.end_headers()
                self.wfile.write(response)
            def log_message(self, *_):
                pass
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            command = [shutil.which("aws"), "secretsmanager", "put-secret-value", "--no-sign-request",
                       "--region", "eu-central-1", "--endpoint-url", f"http://127.0.0.1:{server.server_port}",
                       "--output", "json", "--no-cli-pager"]
            result = run_with_private_json(command, body, timeout=20)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(received == [body], "The CLI changed private input bytes")
            self.assertNotIn(body["SecretString"], result.stdout + result.stderr)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
