"""Compile only RentPilot application code, not local virtual environments."""

from __future__ import annotations

import importlib
import py_compile
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "main.py",
    ROOT / "database.py",
    ROOT / "models",
    ROOT / "routers",
    ROOT / "services",
    ROOT / "scripts",
]


def iter_python_files(target: Path) -> list[Path]:
    if target.is_file():
        return [target]
    return sorted(
        path
        for path in target.rglob("*.py")
        if "__pycache__" not in path.parts and "venv" not in path.parts and ".venv" not in path.parts
    )


def main() -> int:
    failures: list[str] = []
    checked = 0

    for target in TARGETS:
        for path in iter_python_files(target):
            checked += 1
            try:
                py_compile.compile(str(path), doraise=True)
            except py_compile.PyCompileError as exc:
                failures.append(f"{path.relative_to(ROOT)}: {exc.msg}")

    if failures:
        print("Backend app check failed:\n")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    sys.path.insert(0, str(ROOT))
    try:
        module = importlib.import_module("main")
        if not hasattr(module, "app"):
            failures.append("main.py imported, but no FastAPI app object was found.")
    except Exception as exc:  # noqa: BLE001
        failures.append(f"Runtime import failed: {type(exc).__name__}: {exc}")

    if failures:
        print("Backend app check failed:\n")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print(f"Backend app check passed ({checked} Python files compiled, runtime import ok).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
