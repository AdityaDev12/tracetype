#!/usr/bin/env python3
"""Run a lesson's code and write its real execution trace into the lesson file.

Usage:
    python3 scripts/trace_lesson.py content/lessons/python-basics/py-01-variables.json [more files...]
    python3 scripts/trace_lesson.py --all

For every line that finishes running, one trace step is recorded:
    line    1-based source line that just finished
    vars    every user variable at module level after that line
    stdout  only the new text that line printed
    func    (inside a function) the function's name
    locals  (inside a function) that call's local variables

Steps are recorded per frame, so a line that calls a function is recorded
after the function returns, which is when its assignment actually happens.
"""

import hashlib
import io
import json
import sys
import types
from contextlib import redirect_stdout
from pathlib import Path

FILENAME = "<lesson>"
ROOT = Path(__file__).resolve().parent.parent
LESSONS = ROOT / "content" / "lessons"
MAX_STEPS = 5000
MAX_REPR = 200


def lesson_source(lines):
    # Must match lessonSource() in src/engine/validate.ts.
    return "\n".join(line["code"] for line in lines) + "\n"


def source_hash(source):
    return hashlib.sha256(source.encode("utf-8")).hexdigest()


def describe(value):
    if isinstance(value, types.FunctionType):
        text = f"<function {value.__name__}>"
    else:
        text = repr(value)
    if len(text) > MAX_REPR:
        text = text[: MAX_REPR - 3] + "..."
    return {"repr": text, "type": type(value).__name__}


def snapshot(namespace):
    out = {}
    for name, value in namespace.items():
        if name.startswith("__"):
            continue
        if isinstance(value, types.ModuleType):
            continue
        out[name] = describe(value)
    return out


def run_trace(source):
    code = compile(source, FILENAME, "exec")
    namespace = {"__name__": "__main__", "__builtins__": __builtins__}
    buffer = io.StringIO()
    steps = []
    printed = 0
    pending = {}  # frame id -> line number waiting to be recorded

    def record(frame, line):
        nonlocal printed
        text = buffer.getvalue()
        step = {"line": line, "vars": snapshot(namespace), "stdout": text[printed:]}
        printed = len(text)
        if frame.f_code.co_name != "<module>":
            step["func"] = frame.f_code.co_name
            step["locals"] = snapshot(dict(frame.f_locals))
        steps.append(step)
        if len(steps) > MAX_STEPS:
            raise RuntimeError(f"more than {MAX_STEPS} steps, is there an infinite loop?")

    def local_tracer(frame, event, arg):
        key = id(frame)
        if event == "line":
            if key in pending:
                record(frame, pending[key])
            pending[key] = frame.f_lineno
        elif event == "return":
            if key in pending:
                record(frame, pending.pop(key))
        elif event == "exception":
            pass
        return local_tracer

    def global_tracer(frame, event, arg):
        if frame.f_code.co_filename != FILENAME:
            return None
        return local_tracer

    old = sys.gettrace()
    sys.settrace(global_tracer)
    try:
        with redirect_stdout(buffer):
            exec(code, namespace)
    finally:
        sys.settrace(old)
    return steps


def trace_file(path):
    path = Path(path)
    lesson = json.loads(path.read_text(encoding="utf-8"))
    source = lesson_source(lesson["lines"])
    steps = run_trace(source)
    lesson["trace"] = steps
    lesson["traceHash"] = source_hash(source)
    path.write_text(json.dumps(lesson, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    output = "".join(s["stdout"] for s in steps)
    print(f"{path.relative_to(ROOT) if path.is_absolute() else path}: {len(steps)} steps")
    if output:
        for line in output.rstrip("\n").split("\n"):
            print(f"    | {line}")


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    files = sorted(LESSONS.rglob("*.json")) if argv == ["--all"] else [Path(a).resolve() for a in argv]
    for f in files:
        trace_file(f)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
