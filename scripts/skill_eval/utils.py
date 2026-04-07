"""Shared utilities for VAIS skill_eval scripts.

Absorbed and generalized from anthropics/skills (Apache License 2.0):
  upstream: skills/skill-creator/scripts/utils.py
  upstream URL: https://github.com/anthropics/skills

Original parsed only skill directories (expecting SKILL.md). This version
also handles single agent .md files so the same validator can check both
VAIS skills and VAIS agents.

See NOTICE for full attribution and the list of changes from upstream.
"""

import re
from pathlib import Path

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n?---\n?(.*)$", re.DOTALL)


def parse_md_frontmatter(path: Path) -> dict:
    """Parse a markdown file with YAML frontmatter.

    Accepts either:
    - a directory containing SKILL.md  -> target_type="skill"
    - a single .md file                -> target_type="agent"

    Returns a dict:
    {
        "target_type": "skill" | "agent",
        "md_path": str,               # actual .md file path
        "frontmatter": dict,          # parsed YAML
        "body": str,                  # markdown after frontmatter
        "body_line_count": int,       # len(body.splitlines())
    }

    Raises:
        RuntimeError: PyYAML not installed
        FileNotFoundError: path or SKILL.md missing
        ValueError: malformed frontmatter / non-markdown target
    """
    if not HAS_YAML:
        raise RuntimeError(
            "PyYAML not installed. Run: pip install pyyaml"
        )

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Path not found: {path}")

    if path.is_dir():
        md_path = path / "SKILL.md"
        if not md_path.exists():
            raise FileNotFoundError(
                f"SKILL.md not found in directory: {path}"
            )
        target_type = "skill"
    elif path.is_file() and path.suffix == ".md":
        md_path = path
        # If the file is named SKILL.md, treat as a skill (matches user intent
        # when they pass the inner file directly instead of the parent dir).
        target_type = "skill" if path.name == "SKILL.md" else "agent"
    else:
        raise ValueError(
            f"Path must be a directory containing SKILL.md "
            f"or a .md file: {path}"
        )

    content = md_path.read_text(encoding="utf-8")

    if not content.startswith("---"):
        raise ValueError(
            f"Missing YAML frontmatter (no opening ---): {md_path}"
        )

    match = FRONTMATTER_RE.match(content)
    if not match:
        raise ValueError(
            f"Invalid frontmatter format (no closing ---): {md_path}"
        )

    frontmatter_text = match.group(1)
    body = match.group(2)

    try:
        frontmatter = yaml.safe_load(frontmatter_text)
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML in frontmatter: {e}")

    if not isinstance(frontmatter, dict):
        raise ValueError("Frontmatter must be a YAML dictionary")

    return {
        "target_type": target_type,
        "md_path": str(md_path),
        "frontmatter": frontmatter,
        "body": body,
        "body_line_count": len(body.splitlines()),
    }
