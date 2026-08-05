#!/usr/bin/env python3
"""Quick validation for VAIS skill directories and agent .md files.

Absorbed and adapted from anthropics/skills (Apache License 2.0):
  upstream: skills/skill-creator/scripts/quick_validate.py
  upstream URL: https://github.com/anthropics/skills
  See NOTICE for full attribution and the list of changes from upstream.

Original only validated skill directories with SKILL.md. This version adds:
- --target={auto|skill|agent} flag (auto-detects by default)
- Single agent .md file support (VAIS agents/{c-level}/*.md)
- --format={text|json} output
- Progressive disclosure body-length rule (warn>500, fail>800)
- Structured exit codes for skill-validator agent to route on

Exit codes:
    0: pass (no errors, no warnings)
    1: warn (no errors, one or more warnings)
    2: fail (frontmatter / structural error)
    3: input error or PyYAML missing
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Allow both `python -m scripts.skill_eval.quick_validate` and direct execution.
try:
    from scripts.skill_eval.utils import parse_md_frontmatter
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from scripts.skill_eval.utils import parse_md_frontmatter  # noqa: E402


# Allowed frontmatter keys per target type.
SKILL_ALLOWED = {
    "name", "description", "license", "allowed-tools", "metadata",
    "compatibility", "argument-hint",
}
AGENT_ALLOWED = {
    "name", "version", "description", "model", "tools", "memory",
    "disallowedTools", "allowed-tools",
}
REQUIRED = {"name", "description"}

# Progressive disclosure thresholds.
BODY_WARN_LINES = 500
BODY_FAIL_LINES = 800

# Description hard limit (matches Claude Code spec).
DESC_MAX_CHARS = 1024

# kebab-case: lowercase alphanumerics + single hyphens, no leading/trailing hyphen.
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
NAME_MAX_LEN = 64


def _make_result(path, target_type, errors, warnings, frontmatter, body_line_count):
    passed = len(errors) == 0
    if errors:
        exit_code = 2
    elif warnings:
        exit_code = 1
    else:
        exit_code = 0

    fm_summary = {}
    for key in ("name", "description", "model", "version"):
        if frontmatter and key in frontmatter:
            fm_summary[key] = frontmatter[key]

    return {
        "path": str(path),
        "target_type": target_type,
        "passed": passed,
        "errors": errors,
        "warnings": warnings,
        "frontmatter": fm_summary,
        "body_line_count": body_line_count,
        "exit_code": exit_code,
    }


def validate(path_str: str, target: str) -> dict:
    errors: list[dict] = []
    warnings: list[dict] = []

    try:
        info = parse_md_frontmatter(Path(path_str))
    except FileNotFoundError as e:
        return {
            "path": path_str,
            "target_type": None,
            "passed": False,
            "errors": [{"rule": "path", "message": str(e)}],
            "warnings": [],
            "frontmatter": {},
            "body_line_count": 0,
            "exit_code": 3,
        }
    except RuntimeError as e:  # PyYAML missing
        return {
            "path": path_str,
            "target_type": None,
            "passed": False,
            "errors": [{"rule": "runtime", "message": str(e)}],
            "warnings": [],
            "frontmatter": {},
            "body_line_count": 0,
            "exit_code": 3,
        }
    except ValueError as e:
        return {
            "path": path_str,
            "target_type": None,
            "passed": False,
            "errors": [{"rule": "frontmatter", "message": str(e)}],
            "warnings": [],
            "frontmatter": {},
            "body_line_count": 0,
            "exit_code": 2,
        }

    actual_type = info["target_type"]
    if target != "auto" and target != actual_type:
        return {
            "path": path_str,
            "target_type": actual_type,
            "passed": False,
            "errors": [{
                "rule": "target_mismatch",
                "message": f"expected target={target}, detected {actual_type}",
            }],
            "warnings": [],
            "frontmatter": {},
            "body_line_count": info["body_line_count"],
            "exit_code": 3,
        }

    frontmatter = info["frontmatter"]
    allowed = SKILL_ALLOWED if actual_type == "skill" else AGENT_ALLOWED

    # --- Required fields ---
    for field in REQUIRED - set(frontmatter.keys()):
        errors.append({
            "rule": "required_field",
            "message": f"missing required field: {field}",
        })

    # --- Unexpected fields (warn only) ---
    unexpected = set(frontmatter.keys()) - allowed
    if unexpected:
        warnings.append({
            "rule": "unexpected_field",
            "message": f"unexpected frontmatter keys: {sorted(unexpected)}",
        })

    # --- Name validation ---
    name = frontmatter.get("name")
    if name is not None:
        if not isinstance(name, str):
            errors.append({
                "rule": "name_type",
                "message": f"name must be string, got {type(name).__name__}",
            })
        else:
            name = name.strip()
            if name and not NAME_RE.match(name):
                errors.append({
                    "rule": "name_format",
                    "message": (
                        f"name '{name}' should be kebab-case "
                        "(lowercase alphanumerics with single hyphens)"
                    ),
                })
            if len(name) > NAME_MAX_LEN:
                errors.append({
                    "rule": "name_length",
                    "message": f"name too long ({len(name)} > {NAME_MAX_LEN})",
                })

    # --- Description validation ---
    description = frontmatter.get("description")
    if description is not None:
        if not isinstance(description, str):
            errors.append({
                "rule": "description_type",
                "message": (
                    f"description must be string, got "
                    f"{type(description).__name__}"
                ),
            })
        else:
            desc = description.strip()
            if "<" in desc or ">" in desc:
                errors.append({
                    "rule": "description_brackets",
                    "message": "description cannot contain '<' or '>'",
                })
            if len(desc) > DESC_MAX_CHARS:
                errors.append({
                    "rule": "description_length",
                    "message": (
                        f"description too long "
                        f"({len(desc)} > {DESC_MAX_CHARS})"
                    ),
                })

    # --- Body length (progressive disclosure) ---
    body_lines = info["body_line_count"]
    if body_lines > BODY_FAIL_LINES:
        errors.append({
            "rule": "body_length",
            "message": (
                f"body {body_lines} lines > {BODY_FAIL_LINES} "
                "(progressive disclosure violation — split into references)"
            ),
        })
    elif body_lines > BODY_WARN_LINES:
        warnings.append({
            "rule": "body_length",
            "message": (
                f"body {body_lines} lines > {BODY_WARN_LINES} "
                "(consider splitting via references/)"
            ),
        })

    return _make_result(
        path=path_str,
        target_type=actual_type,
        errors=errors,
        warnings=warnings,
        frontmatter=frontmatter,
        body_line_count=body_lines,
    )


def format_text(result: dict) -> str:
    if result["passed"]:
        status = "⚠️  WARN" if result["warnings"] else "✅ PASS"
    else:
        status = "❌ FAIL"

    lines = [
        f"{status}  {result['path']} ({result.get('target_type') or '?'})"
    ]
    for err in result.get("errors", []):
        lines.append(f"  ERROR [{err['rule']}]: {err['message']}")
    for warn in result.get("warnings", []):
        lines.append(f"  WARN  [{warn['rule']}]: {warn['message']}")
    if result.get("body_line_count"):
        lines.append(f"  body: {result['body_line_count']} lines")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Quick-validate a VAIS skill directory or agent .md file.",
    )
    parser.add_argument(
        "path",
        help="Path to a skill directory (containing SKILL.md) or an agent .md file",
    )
    parser.add_argument(
        "--target",
        choices=["auto", "skill", "agent"],
        default="auto",
        help="Force target type (default: auto-detect)",
    )
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    args = parser.parse_args()

    result = validate(args.path, args.target)

    if args.format == "json":
        output = {k: v for k, v in result.items() if k != "exit_code"}
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        print(format_text(result))

    sys.exit(result["exit_code"])


if __name__ == "__main__":
    main()
