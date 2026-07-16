#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TERRAFORM_DIR = ROOT / "terraform"


def terraform_outputs():
    try:
        raw = subprocess.check_output(
            ["terraform", "-chdir=" + str(TERRAFORM_DIR), "output", "-json"],
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError) as exc:
        print(f"Unable to read Terraform outputs: {exc}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(raw)
    return {key: item["value"] for key, item in data.items()}


def main():
    outputs = terraform_outputs()
    user = os.getenv("ANSIBLE_USER", "ubuntu")
    front_ip = outputs["front_public_ip"]
    back_ip = outputs["back_private_ip"]
    db_ip = outputs["db_private_ip"]
    back_ssh_args = (
        "-o StrictHostKeyChecking=no "
        "-o UserKnownHostsFile=/dev/null "
        f"-o ProxyJump={user}@{front_ip}"
    )
    db_ssh_args = (
        "-o StrictHostKeyChecking=no "
        "-o UserKnownHostsFile=/dev/null "
        f"-o ProxyJump={user}@{front_ip},{user}@{back_ip}"
    )

    inventory = {
        "_meta": {
            "hostvars": {
                "front-1": {
                    "ansible_host": front_ip,
                    "ansible_user": user,
                    "private_ip": outputs.get("front_private_ip"),
                    "role": "front",
                },
                "back-1": {
                    "ansible_host": back_ip,
                    "ansible_user": user,
                    "ansible_ssh_common_args": back_ssh_args,
                    "private_ip": back_ip,
                    "role": "back",
                },
                "db-1": {
                    "ansible_host": db_ip,
                    "ansible_user": user,
                    "ansible_ssh_common_args": db_ssh_args,
                    "private_ip": db_ip,
                    "role": "db",
                },
            }
        },
        "all": {"children": ["front", "back", "db"]},
        "front": {"hosts": ["front-1"]},
        "back": {"hosts": ["back-1"]},
        "db": {"hosts": ["db-1"]},
    }

    print(json.dumps(inventory, indent=2))


if __name__ == "__main__":
    main()
