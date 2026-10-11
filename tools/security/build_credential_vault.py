#!/usr/bin/env python3
"""Compile/sign the purpose-specific Secure Enclave helper; never accesses real credentials."""
import argparse
from pathlib import Path
import subprocess
import tempfile
import os
from credential_store import ROOT, REQUIREMENT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--identity", required=True, help="Existing Apple signing identity for the Rillora team")
    args = parser.parse_args()
    output = ROOT / ".local/bin/rillora-credential-vault"
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with tempfile.TemporaryDirectory(prefix="rillora-vault-build-") as folder:
        binary = Path(folder) / "rillora-credential-vault"
        subprocess.run(["xcrun", "swiftc", str(Path(__file__).with_name("CredentialVault.swift")), "-o", str(binary),
                        "-module-cache-path", str(Path(folder) / "modules"), "-framework", "Security", "-framework", "LocalAuthentication", "-framework", "CryptoKit"], check=True)
        subprocess.run(["codesign", "--force", "--options", "runtime", "--identifier", "xyz.rillora.operator-vault",
                        "--sign", args.identity, str(binary)], check=True)
        subprocess.run(["codesign", "--verify", "--strict", "-R", REQUIREMENT, str(binary)], check=True)
        binary.chmod(0o700)
        temporary = output.with_name(output.name + ".new")
        with binary.open("rb") as source, temporary.open("wb") as destination:
            destination.write(source.read())
        temporary.chmod(0o700)
        os.replace(temporary, output)
    print("Signed helper installed. No credential was read or migrated.")


if __name__ == "__main__":
    main()
