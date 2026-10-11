"""Rillora operator credentials: user-presence Secure Enclave envelopes, never plaintext files."""
from pathlib import Path
import base64
import json
import os
import stat
import subprocess
import threading
import tempfile
import uuid

ROOT = Path(__file__).resolve().parents[2]
REQUIREMENT = 'anchor apple generic and identifier "xyz.rillora.operator-vault" and certificate leaf[subject.OU] = "8L99CFNK24"'


class CredentialStore:
    def __init__(self, root=ROOT, transport=None):
        self.root = Path(root).resolve()
        self.helper = self.root / ".local/bin/rillora-credential-vault"
        self.transport = transport

    def _call(self, body):
        if self.transport is not None:
            return self.transport(body)
        if self.helper.is_symlink() or not self.helper.is_file():
            raise RuntimeError("Install the signed Rillora credential helper before using protected credentials")
        info = self.helper.stat()
        if info.st_uid != os.getuid() or info.st_mode & 0o022:
            raise RuntimeError("Credential helper ownership is unsafe")
        checked = subprocess.run(["codesign", "--verify", "--strict", "-R", REQUIREMENT, str(self.helper)], capture_output=True)
        if checked.returncode:
            raise RuntimeError("Credential helper signature does not match Rillora")
        result = subprocess.run([str(self.helper)], input=json.dumps(body).encode(), capture_output=True, timeout=120)
        if result.returncode:
            raise RuntimeError("Protected credential access was not completed; no plaintext fallback")
        try:
            return json.loads(result.stdout)
        except (ValueError, UnicodeError):
            raise RuntimeError("Invalid protected credential response") from None

    def ensure_ready(self):
        if self._call({"operation": "probe"}) != {"ready": True}:
            raise RuntimeError("Protected credential storage is not ready")

    def _path(self, path):
        path = Path(path)
        private = self.root / ".local-secrets"
        resolved = path.resolve()
        if path.is_symlink() or not resolved.is_relative_to(private):
            raise RuntimeError("Credential reference must stay inside Rillora protected storage")
        if path.exists() and (not stat.S_ISREG(path.stat().st_mode) or path.stat().st_uid != os.getuid() or path.stat().st_mode & 0o077 or path.stat().st_size > 131072):
            raise RuntimeError("Unsafe credential reference")
        return resolved

    def read_protected_file(self, path):
        path = self._path(path)
        with os.fdopen(os.open(path, os.O_RDONLY | os.O_NOFOLLOW), "rb") as source:
            info = os.fstat(source.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077 or info.st_size > 131072:
                raise RuntimeError("Unsafe protected file")
            data = source.read(131073)
            if len(data) > 131072:
                raise RuntimeError("Protected file exceeds its bound")
        return data, info

    def _reference(self, path):
        path = self._path(path)
        value = json.loads(self.read_protected_file(path)[0])
        if (not isinstance(value, dict) or set(value) != {"version", "storage", "account", "envelope"}
                or value["version"] != 2 or value["storage"] != "macos-secure-enclave-user-presence"
                or not isinstance(value["account"], str)):
            raise RuntimeError("Legacy plaintext credential requires explicit protected migration")
        try:
            if str(uuid.UUID(value["account"])) != value["account"]:
                raise ValueError()
        except ValueError:
            raise RuntimeError("Invalid credential reference") from None
        return value

    def read(self, path):
        ref = self._reference(path)
        if not isinstance(ref["envelope"], dict):
            raise RuntimeError("Protected credential storage was interrupted; recovery is required")
        result = self._call({"operation": "get", "account": ref["account"], "envelope": ref["envelope"]})
        try:
            data = base64.b64decode(result["data"], validate=True)
            if len(data) > 65536:
                raise ValueError()
            return data
        except (KeyError, ValueError, TypeError):
            raise RuntimeError("Invalid protected credential response") from None

    def put(self, path, data):
        path = self._path(path)
        if path.exists():
            raise RuntimeError("Credential reference already exists; never overwrite or duplicate silently")
        if not isinstance(data, bytes) or not data or len(data) > 65536:
            raise RuntimeError("Invalid credential payload size")
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(path.parent, 0o700)
        account = str(uuid.uuid4())
        ref = {"version": 2, "storage": "macos-secure-enclave-user-presence", "account": account, "envelope": None}
        # Preserve a nonsecret recovery pointer before the OS write. An interrupted
        # operation never causes automatic provider credential creation a second time.
        with os.fdopen(os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), "w") as out:
            json.dump(ref, out)
        result = self._call({"operation": "put", "account": account, "data": base64.b64encode(data).decode()})
        if result.get("stored") is not True or not isinstance(result.get("envelope"), dict):
            raise RuntimeError("Credential reference retained for recovery; OS storage did not confirm success")
        ref["envelope"] = result["envelope"]
        self._save_encrypted_reference(path, ref)
        return ref

    def _save_encrypted_reference(self, path, value):
        # Only the encrypted envelope is written, and replacement is atomic.
        with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, prefix=".sealed-reference-", delete=False) as out:
            json.dump(value, out)
            out.flush()
            os.fsync(out.fileno())
            temporary = Path(out.name)
        try:
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)

    def update(self, path, data):
        ref = self._reference(path)
        if not isinstance(data, bytes) or not data or len(data) > 65536:
            raise RuntimeError("Invalid credential payload size")
        result = self._call({"operation": "update", "account": ref["account"], "envelope": ref["envelope"], "data": base64.b64encode(data).decode()})
        if result.get("updated") is not True or not isinstance(result.get("envelope"), dict):
            raise RuntimeError("Protected credential update did not complete")
        ref["envelope"] = result["envelope"]
        self._save_encrypted_reference(self._path(path), ref)


def read_secret_json(path, root=ROOT):
    try:
        return json.loads(CredentialStore(root).read(path))
    except (ValueError, UnicodeError):
        raise RuntimeError("Protected credential is not valid JSON") from None


def write_secret_json(path, value, root=ROOT, replace=False):
    store = CredentialStore(root)
    data = json.dumps(value).encode()
    return store.update(path, data) if replace and Path(path).exists() else store.put(path, data)


def run_with_private_json(command, body, timeout=60):
    """A separate inherited pipe avoids disk and credential-process stdin theft."""
    payload = json.dumps(body).encode()
    if len(payload) > 131072:
        raise RuntimeError("Protected provider input is too large")
    read_fd, write_fd = os.pipe()
    process = None
    failures = []
    try:
        process = subprocess.Popen([*command, "--cli-input-json", f"file:///dev/fd/{read_fd}"],
            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, pass_fds=(read_fd,))
        os.close(read_fd)
        read_fd = -1
        def send():
            try:
                with os.fdopen(write_fd, "wb") as pipe:
                    pipe.write(payload)
            except OSError:
                failures.append(True)
        writer = threading.Thread(target=send, daemon=True)
        writer.start()
        stdout, stderr = process.communicate(timeout=timeout)
        writer.join(timeout=1)
        if writer.is_alive() or failures:
            raise RuntimeError("Protected provider input transfer failed")
        return subprocess.CompletedProcess(command, process.returncode, stdout.decode(), stderr.decode())
    except (OSError, subprocess.TimeoutExpired):
        if process is not None:
            process.kill()
            process.communicate()
        raise RuntimeError("Protected provider operation failed; input/output suppressed") from None
    finally:
        if read_fd >= 0:
            os.close(read_fd)
            os.close(write_fd)
