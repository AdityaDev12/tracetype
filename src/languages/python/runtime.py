"""TraceType Python runtime.

One module, used in two places so grading is identical everywhere:
  - offline by scripts/trace_lesson.py (real CPython) to generate lesson data
  - in the browser inside Pyodide (src/languages/python/worker.ts) to grade the
    learner's own code

Everything returns plain dicts/lists/strings so results cross into JavaScript
as JSON.
"""

import ast
import hashlib
import io
import json
import sys
import traceback
import types
from contextlib import redirect_stdout

FILENAME = "<lesson>"
MAX_STEPS = 5000
MAX_REPR = 200


class StepLimit(Exception):
    pass


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
    for name, value in list(namespace.items()):
        if name.startswith("__") or isinstance(value, types.ModuleType):
            continue
        out[name] = describe(value)
    return out


def error_info(exc):
    """The error as Python prints it, plus the line in the learner's code."""
    line = None
    for frame in traceback.extract_tb(exc.__traceback__):
        if frame.filename == FILENAME:
            line = frame.lineno
    if isinstance(exc, SyntaxError) and exc.filename == FILENAME:
        line = exc.lineno
    # TracebackException adds the "Did you mean" hint Python shows for typos.
    te = traceback.TracebackException.from_exception(exc)
    message = "".join(te.format_exception_only()).strip().splitlines()[-1]
    return {"type": type(exc).__name__, "message": message, "line": line}


def run_trace(source):
    """Run code and record one step per finished line (see trace_lesson.py)."""
    namespace = {"__name__": "__main__"}
    buffer = io.StringIO()
    steps = []
    printed = 0
    pending = {}
    error = None

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
            raise StepLimit(f"stopped after {MAX_STEPS} steps")

    raised = set()

    def local_tracer(frame, event, arg):
        key = id(frame)
        if event == "line":
            raised.discard(key)
            if key in pending:
                record(frame, pending[key])
            pending[key] = frame.f_lineno
        elif event == "exception":
            raised.add(key)
        elif event == "return" and key in pending:
            line = pending.pop(key)
            # A line that raised did not finish, so it gets no step.
            if key in raised:
                raised.discard(key)
            else:
                record(frame, line)
        return local_tracer

    def global_tracer(frame, event, arg):
        if frame.f_code.co_filename != FILENAME:
            return None
        return local_tracer

    error_holder = []
    try:
        code = compile(source, FILENAME, "exec")
    except SyntaxError as exc:
        return {"steps": [], "stdout": "", "vars": {}, "error": error_info(exc)}

    old = sys.gettrace()
    sys.settrace(global_tracer)
    try:
        with redirect_stdout(buffer):
            try:
                exec(code, namespace)
            except BaseException as exc:  # noqa: BLE001 - learner code can raise anything
                error_holder.append(exc)
    finally:
        sys.settrace(old)
    if error_holder:
        error = error_info(error_holder[0])
        if isinstance(error_holder[0], StepLimit):
            error = {"type": "Timeout", "message": str(error_holder[0]), "line": None}
    return {"steps": steps, "stdout": buffer.getvalue(), "vars": snapshot(namespace), "error": error}


def run_program(source, pre="", post=""):
    """Run pre + source + post without tracing. Returns stdout, vars and error.
    Lines are numbered as in `source` (pre and post run separately)."""
    namespace = {"__name__": "__main__"}
    buffer = io.StringIO()
    error = None
    stage = "pre"
    try:
        with redirect_stdout(buffer):
            if pre:
                exec(compile(pre, "<setup>", "exec"), namespace)
            stage = "code"
            exec(compile(source, FILENAME, "exec"), namespace)
            stage = "post"
            if post:
                exec(compile(post, "<check>", "exec"), namespace)
    except BaseException as exc:  # noqa: BLE001
        error = error_info(exc)
        error["stage"] = stage
    return {"stdout": buffer.getvalue(), "vars": snapshot(namespace), "error": error}


def normalize_output(text):
    lines = [l.rstrip() for l in text.replace("\r\n", "\n").split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def run_tests(source, tests):
    """Hidden tests for Fix, Modify, Make and projects.

    Each test: {"name": str, "pre"?: code run first, "post"?: code with asserts
    run after, "stdout"?: exact expected output}. Returns one result per test:
    {"name", "ok", "message", "got"?, "expected"?}.
    """
    results = []
    for t in tests:
        r = run_program(source, t.get("pre", ""), t.get("post", ""))
        err = r["error"]
        res = {"name": t["name"], "ok": True, "message": ""}
        if err and err["stage"] != "post":
            res.update(ok=False, message=err["message"], error=err)
        elif err:
            # A failed check: the assert message is written for the learner.
            msg = err["message"]
            if msg.startswith("AssertionError: "):
                msg = msg[len("AssertionError: "):]
            elif msg == "AssertionError":
                msg = "a check did not pass"
            res.update(ok=False, message=msg)
        elif "stdout" in t and normalize_output(r["stdout"]) != normalize_output(t["stdout"]):
            res.update(
                ok=False,
                message="the output is not what was expected",
                got=normalize_output(r["stdout"]),
                expected=normalize_output(t["stdout"]),
            )
        results.append(res)
    return results


def same_ast(a, b):
    """True if two programs mean the same thing: spaces, quote style and extra
    parentheses do not matter."""
    try:
        return ast.dump(ast.parse(a)) == ast.dump(ast.parse(b))
    except SyntaxError:
        return False


def canonical_hash(obj):
    """sha256 of an item's authored fields. Must match canonicalHash() in
    src/engine/hash.ts: sorted keys, no spaces, unicode kept as is."""
    text = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def source_of(lines):
    return "\n".join(lines) + "\n"


_OPS = {"trace": run_trace, "run": run_program, "tests": run_tests, "same_ast": same_ast}


def call(op, args_json):
    """Entry point for the browser worker: JSON in, JSON out."""
    args = json.loads(args_json)
    return json.dumps(_OPS[op](*args), ensure_ascii=False)
