"""TraceType Python runtime (trace format v2).

One module, used in two places so tracing and grading are identical everywhere:
  - offline by scripts/trace_lesson.py (real CPython) to generate lesson data
  - in the browser inside Pyodide (src/languages/python/worker.ts) to trace and
    grade the learner's own code

Everything returns plain dicts/lists/strings so results cross into JavaScript
as JSON. The shape is described in src/engine/types.ts (TraceStep and friends).

Trace v2, per step (one step per finished line):
  line, stdout, vars                 as in v1 (vars = module-level names)
  func, locals                       innermost function frame, as in v1
  stack   [{func, line, locals}]     every active function frame, outermost first
  heap    {id: object}               lists, dicts, sets, objects... by stable id
  events  [{kind, ...}]              what happened: call, return, yield, test,
                                     loop, break, continue, raise, unwind,
                                     caught, finally, input, expr
  files   {path: text}               the virtual folder, only when it changed
Values are {repr, type} plus "ref" (heap id) for containers and objects, and
"text" (the real characters) for strings.

Options (all optional), the same for trace, run and tests:
  stdin   ["typed", "answers"]   what input() returns, in order
  files   {"name.txt": "text"}   seed the virtual folder (and record it)
  expr    [line numbers]         record expression steps for these lines
"""

import ast
import builtins
import copy
import dis
import hashlib
import io
import json
import os
import re
import shutil
import sys
import tempfile
import traceback
import types
import warnings
from contextlib import redirect_stdout

TRACE_VERSION = 2
FILENAME = "<lesson>"
MAX_STEPS = 5000  # trace limit: more steps than this is treated as a runaway loop
MAX_RUN_LINES = 200_000  # run and tests: lines of learner code before giving up
MAX_REPR = 200
MAX_TEXT = 200
MAX_ITEMS = 50
MAX_HEAP = 150
MAX_FILE = 4000
MAX_FILES = 20
MAX_EXPR_STEPS = 40
HELPER = "__tt_v"
SUB_HELPER = "__tt_s"
FMT_HELPER = "__tt_f"
_ADDRESS = re.compile(r" at 0x[0-9a-fA-F]+")
CO_OPTIMIZED = 0x1


class StepLimit(Exception):
    pass


# ---------------------------------------------------------------- values


def _is_user_class(t):
    return isinstance(t, type) and t.__module__ == "__main__"


def _default_repr(value):
    return type(value).__repr__ is object.__repr__


def safe_repr(value, depth=0):
    """repr() without memory addresses (they change every run), capped."""
    if depth > 6:
        return "..."
    try:
        if isinstance(value, (types.FunctionType, types.BuiltinFunctionType)):
            text = f"<function {value.__name__}>"
        elif isinstance(value, type):
            text = f"<class '{value.__qualname__}'>"
        elif isinstance(value, types.ModuleType):
            text = f"<module '{value.__name__}'>"
        elif type(value) in (list, tuple, set, frozenset, dict):
            text = _container_repr(value, depth)
        elif _default_repr(value) and not isinstance(value, BaseException):
            text = f"<{type(value).__qualname__} object>"
        else:
            text = repr(value)
    except Exception:  # noqa: BLE001 - a broken __repr__ in learner code
        text = f"<{type(value).__qualname__} object>"
    text = _ADDRESS.sub("", text)
    if len(text) > MAX_REPR:
        text = text[: MAX_REPR - 3] + "..."
    return text


def _container_repr(value, depth):
    if isinstance(value, dict):
        items = list(value.items())
        body = ", ".join(f"{safe_repr(k, depth + 1)}: {safe_repr(v, depth + 1)}" for k, v in items[:MAX_ITEMS])
        return "{" + body + (", ..." if len(items) > MAX_ITEMS else "") + "}"
    items = list(value)
    if isinstance(value, (set, frozenset)):
        if not items:
            return "set()" if isinstance(value, set) else "frozenset()"
        body = ", ".join(safe_repr(v, depth + 1) for v in items[:MAX_ITEMS])
        body = "{" + body + "}"
        return body if isinstance(value, set) else f"frozenset({body})"
    body = ", ".join(safe_repr(v, depth + 1) for v in items[:MAX_ITEMS])
    if len(items) > MAX_ITEMS:
        body += ", ..."
    if isinstance(value, tuple):
        return "(" + body + ("," if len(items) == 1 else "") + ")"
    return "[" + body + "]"


def _heap_kind(value):
    t = type(value)
    if t in (list, tuple, dict, set, frozenset, range):
        return t.__name__ if t is not frozenset else "set"
    if isinstance(value, types.FunctionType):
        return "function"
    if isinstance(value, types.ModuleType):
        return "module"
    if isinstance(value, types.GeneratorType):
        return "generator"
    if isinstance(value, io.IOBase):
        return "file"
    if _is_user_class(value):
        return "class"
    if _is_user_class(t) and not isinstance(value, BaseException):
        return "object"
    return None


def describe(value):
    """A value as v1 knew it: repr and type name. Kept for old callers."""
    return {"repr": safe_repr(value), "type": type(value).__name__}


class Heap:
    """Gives every container/object a small stable id ("o1", "o2"...) for the
    whole run, and keeps the objects alive so Python cannot reuse their id()."""

    def __init__(self, plain_ids=False):
        self.ids = {}
        self.keep = []
        self.plain_ids = plain_ids  # also give str/int/float... values an "id"

    def ref(self, obj):
        key = id(obj)
        if key not in self.ids:
            self.ids[key] = f"o{len(self.ids) + 1}"
            self.keep.append(obj)
        return self.ids[key]

    def value(self, v, todo=None):
        out = {"repr": safe_repr(v), "type": type(v).__name__}
        if isinstance(v, str):
            out["text"] = v[:MAX_TEXT]
            if len(v) > MAX_TEXT:
                out["more"] = len(v) - MAX_TEXT
        elif _heap_kind(v):
            out["ref"] = self.ref(v)
            if todo is not None:
                todo.append(v)
        if self.plain_ids and "ref" not in out:
            out["id"] = self.ref(v)
        return out

    def names(self, mapping, todo):
        out = {}
        for name, v in list(mapping.items()):
            if name.startswith("__"):
                continue
            out[name] = self.value(v, todo)
        return out

    def obj(self, v, todo):
        kind = _heap_kind(v)
        o = {"kind": kind, "type": type(v).__name__}
        if kind in ("list", "tuple", "set"):
            items = list(v)
            if kind == "set":
                items.sort(key=safe_repr)  # set order is not stable between runs
            o["items"] = [self.value(x, todo) for x in items[:MAX_ITEMS]]
            if len(items) > MAX_ITEMS:
                o["more"] = len(items) - MAX_ITEMS
        elif kind == "dict":
            items = list(v.items())
            o["items"] = [[self.value(k, todo), self.value(x, todo)] for k, x in items[:MAX_ITEMS]]
            if len(items) > MAX_ITEMS:
                o["more"] = len(items) - MAX_ITEMS
        elif kind == "range":
            o.update(start=v.start, stop=v.stop, step=v.step, len=len(v))
        elif kind == "function":
            code = v.__code__
            n = code.co_argcount + code.co_kwonlyargcount
            n += bool(code.co_flags & 0x04) + bool(code.co_flags & 0x08)
            o.update(name=v.__name__, params=list(code.co_varnames[:n]))
        elif kind == "module":
            o["name"] = v.__name__
        elif kind == "generator":
            frame = v.gi_frame
            o.update(name=v.__name__, state=_gen_state(v), line=frame.f_lineno if frame else None)
        elif kind == "file":
            o.update(name=str(getattr(v, "name", "")), mode=getattr(v, "mode", ""), closed=v.closed)
            if not v.closed:
                try:
                    o["pos"] = v.tell()
                except Exception:  # noqa: BLE001
                    pass
        elif kind == "class":
            o["name"] = v.__qualname__
            o["bases"] = [b.__qualname__ for b in v.__bases__ if b is not object]
            attrs, methods = {}, []
            for k, x in v.__dict__.items():
                if isinstance(x, (types.FunctionType, staticmethod, classmethod, property)):
                    methods.append(k)
                elif not k.startswith("__"):
                    attrs[k] = self.value(x, todo)
            o["attrs"], o["methods"] = attrs, methods
        elif kind == "object":
            o["cls"] = type(v).__qualname__
            o["classRef"] = self.value(type(v), todo)["ref"]
            attrs = getattr(v, "__dict__", None)
            if attrs is None:
                attrs = {s: getattr(v, s) for s in getattr(type(v), "__slots__", ()) if hasattr(v, s)}
            o["attrs"] = {k: self.value(x, todo) for k, x in list(attrs.items())[:MAX_ITEMS]}
        return o

    def snapshot(self, todo):
        heap = {}
        while todo and len(heap) < MAX_HEAP:
            v = todo.pop(0)
            key = self.ref(v)
            if key in heap:
                continue
            heap[key] = self.obj(v, todo)
        return heap


def _gen_state(g):
    if g.gi_running:
        return "running"
    if g.gi_frame is None:
        return "done"
    return "paused" if g.gi_frame.f_lasti > 0 else "new"


def snapshot(namespace):
    """Module-level names as {name: {repr, type}} (used by run and tests)."""
    out = {}
    for name, value in list(namespace.items()):
        if name.startswith("__"):
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
    message = _ADDRESS.sub("", message)
    return {"type": type(exc).__name__, "message": message, "line": line}


# ---------------------------------------------------------------- sandbox


class Sandbox:
    """Fresh namespace, fake stdin and a private temp folder for one run."""

    def __init__(self, options):
        options = options or {}
        self.stdin = [str(s) for s in options.get("stdin") or []]
        self.used = 0
        self.record_files = "files" in options and options["files"] is not None
        self.seed = options.get("files") or {}
        self.on_input = None
        self.buffer = io.StringIO()
        self.dir = None
        self.old_cwd = None

    def namespace(self):
        b = dict(builtins.__dict__)
        b["input"] = self.input
        return {"__name__": "__main__", "__builtins__": b}

    def input(self, prompt=""):
        prompt = str(prompt)
        self.buffer.write(prompt)
        if self.used >= len(self.stdin):
            raise EOFError("EOF when reading a line")
        value = self.stdin[self.used]
        self.used += 1
        # Echo the answer like a terminal does, so output reads naturally.
        self.buffer.write(value + "\n")
        if self.on_input:
            self.on_input(prompt, value, self.used - 1)
        return value

    def __enter__(self):
        self.old_cwd = os.getcwd()
        self.dir = tempfile.mkdtemp(prefix="tt_")
        for name, text in self.seed.items():
            path = os.path.join(self.dir, name)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)
        os.chdir(self.dir)
        self._warn = warnings.catch_warnings()
        self._warn.__enter__()
        warnings.simplefilter("ignore", ResourceWarning)
        return self

    def __exit__(self, *exc):
        self._warn.__exit__(None, None, None)
        os.chdir(self.old_cwd)
        shutil.rmtree(self.dir, ignore_errors=True)
        return False

    def files(self, keep=()):
        if not self.record_files:
            return None
        for obj in keep:  # the heap keeps file objects alive: flush what they wrote
            if isinstance(obj, io.IOBase) and not obj.closed:
                try:
                    obj.flush()
                except Exception:  # noqa: BLE001
                    pass
        out = {}
        for root, _dirs, names in os.walk(self.dir):
            for n in sorted(names):
                full = os.path.join(root, n)
                rel = os.path.relpath(full, self.dir).replace(os.sep, "/")
                try:
                    with open(full, encoding="utf-8") as f:
                        text = f.read(MAX_FILE + 1)
                except (UnicodeDecodeError, OSError):
                    text = "<binary file>"
                out[rel] = text[:MAX_FILE]
                if len(out) >= MAX_FILES:
                    return out
        return dict(sorted(out.items()))


# ---------------------------------------------------------------- static analysis


def _span(body):
    return (body[0].lineno, max(getattr(s, "end_lineno", s.lineno) for s in body))


class Shape:
    """Facts about the code that never change while it runs."""

    def __init__(self, tree, lines):
        self.tests = {}  # line -> {"stmt", "body": (a, b)}
        self.jumps = {}  # line -> ("break" | "continue", loop line)
        self.handlers = set()
        self.finally_lines = set()
        self.for_lines = set()
        self._walk(tree, lines, None)

    def _walk(self, node, lines, loop):
        for child in ast.iter_child_nodes(node):
            if isinstance(child, ast.If):
                text = lines[child.lineno - 1].lstrip() if child.lineno <= len(lines) else ""
                stmt = "elif" if text.startswith("elif") else "if"
                self.tests[child.lineno] = {"stmt": stmt, "body": _span(child.body)}
            elif isinstance(child, ast.While):
                self.tests[child.lineno] = {"stmt": "while", "body": _span(child.body)}
            elif isinstance(child, (ast.For, ast.AsyncFor)):
                self.tests[child.lineno] = {"stmt": "for", "body": _span(child.body)}
                self.for_lines.add(child.lineno)
            elif isinstance(child, ast.match_case):
                self.tests[child.pattern.lineno] = {"stmt": "case", "body": _span(child.body)}
            elif isinstance(child, (ast.Break, ast.Continue)) and loop is not None:
                self.jumps[child.lineno] = ("break" if isinstance(child, ast.Break) else "continue", loop)
            elif isinstance(child, ast.ExceptHandler):
                self.handlers.update(range(child.lineno, (child.end_lineno or child.lineno) + 1))
            elif isinstance(child, (ast.Try, ast.TryStar)) and child.finalbody:
                a, b = _span(child.finalbody)
                self.finally_lines.update(range(a, b + 1))
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)):
                self._walk(child, lines, None)
            elif isinstance(child, (ast.For, ast.AsyncFor, ast.While)):
                self._walk(child, lines, child.lineno)
            else:
                self._walk(child, lines, loop)


# ---------------------------------------------------------------- expression steps

_LEAVES = (ast.Lambda, ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)
_NO_EXPR = (ast.Yield, ast.YieldFrom, ast.Await)


def _expr_root(stmt):
    """The expression to show reducing for a statement, and whether the root
    itself should be recorded (a bare print(...) call should not)."""
    if isinstance(stmt, (ast.Assign, ast.AugAssign, ast.AnnAssign, ast.Return)) and stmt.value is not None:
        return stmt.value, True
    if isinstance(stmt, ast.Expr):
        return stmt.value, not isinstance(stmt.value, ast.Call)
    if isinstance(stmt, (ast.If, ast.While, ast.Assert)):
        return stmt.test, True
    if isinstance(stmt, ast.Match):
        return stmt.subject, True
    if isinstance(stmt, ast.For):
        return stmt.iter, True
    return None, False


class _Number(ast.NodeVisitor):
    """Gives each expression node that will be recorded an id (attribute _tt)."""

    def __init__(self, counter):
        self.counter = counter

    def mark(self, node):
        node._tt = self.counter[0]
        self.counter[0] += 1

    def visit(self, node):
        if isinstance(node, ast.Constant):
            return
        if isinstance(node, _LEAVES):
            self.mark(node)
            return
        if isinstance(node, ast.Call):
            # The function itself (print, len, obj.method) is not a value step,
            # but in a chain like s.strip().title() the inner call is.
            if isinstance(node.func, ast.Attribute) and not isinstance(node.func.value, ast.Name):
                self.visit(node.func.value)
            for a in node.args:
                self.visit(a)
            for k in node.keywords:
                self.visit(k.value)
            self.mark(node)
            return
        if isinstance(node, ast.NamedExpr):
            self.visit(node.value)
            self.mark(node)
            return
        if isinstance(node, ast.FormattedValue):
            self.visit(node.value)  # the format spec stays as written
            return
        if isinstance(node, (ast.Starred, ast.Slice, ast.keyword)) or not isinstance(node, ast.expr):
            self.generic_visit(node)
            return
        if getattr(node, "ctx", None) is not None and not isinstance(node.ctx, ast.Load):
            return
        self.generic_visit(node)
        self.mark(node)


class _Wrap(ast.NodeTransformer):
    """Replaces each numbered node with __tt_v(id, node) so its real value is
    recorded at the moment Python computes it (short-circuit included)."""

    def visit(self, node):
        node = self.generic_visit(node)
        hole = getattr(node, "_ttf", None)
        if hole is not None and isinstance(node, ast.FormattedValue):
            args = [ast.Constant(hole[0]), ast.Constant(hole[1]), node.value]
            node.value = ast.copy_location(ast.Call(func=ast.Name(id=FMT_HELPER, ctx=ast.Load()), args=args, keywords=[]), node.value)
            return node
        nid = getattr(node, "_tt", None)
        if nid is None or not isinstance(node, ast.expr):
            return node
        if isinstance(node, ast.Subscript) and isinstance(node.ctx, ast.Load):
            # __tt_s(id, seq, is_slice, a, b, c): records which positions were used.
            sl = node.slice
            if isinstance(sl, ast.Slice):
                parts = [sl.lower, sl.upper, sl.step]
                args = [ast.Constant(nid), node.value, ast.Constant(True)] + [x if x is not None else ast.Constant(None) for x in parts]
            else:
                args = [ast.Constant(nid), node.value, ast.Constant(False), sl, ast.Constant(None), ast.Constant(None)]
            call = ast.Call(func=ast.Name(id=SUB_HELPER, ctx=ast.Load()), args=args, keywords=[])
            return ast.copy_location(call, node)
        call = ast.Call(func=ast.Name(id=HELPER, ctx=ast.Load()), args=[ast.Constant(nid), node], keywords=[])
        return ast.copy_location(call, node)


class _Sub(ast.NodeTransformer):
    def __init__(self, vals):
        self.vals = vals

    def visit(self, node):
        nid = getattr(node, "_tt", None)
        if nid is not None and nid in self.vals:
            return ast.Name(id=self.vals[nid], ctx=ast.Load())
        return self.generic_visit(node)


def _render(root, vals, prefix, suffix):
    text = ast.unparse(_Sub(vals).visit(copy.deepcopy(root)))
    return prefix + text + suffix


def _ids_under(node):
    return {n._tt for n in ast.walk(node) if hasattr(n, "_tt")}


class ExprPlan:
    """Which lines get expression steps, and how to draw them."""

    def __init__(self, tree, lines, wanted):
        self.lines = {}  # line -> (root copy, prefix, suffix, record_root)
        self.nodes = {}  # id -> node in the root copy
        self.subs = {}  # subscript id -> (sequence code, key code)
        self.formats = {}  # f-string id -> {"template", "holes"}
        self.joined = {}  # expression id of an f-string -> f-string id
        if not wanted:
            return
        source = "\n".join(lines)
        counter = [0]
        for stmt in ast.walk(tree):
            if not isinstance(stmt, ast.stmt) or stmt.lineno not in wanted or stmt.lineno in self.lines:
                continue
            root, record_root = _expr_root(stmt)
            if root is None or any(isinstance(n, _NO_EXPR) for n in ast.walk(root)):
                continue
            _Number(counter).visit(root)
            if not record_root and hasattr(root, "_tt"):
                del root._tt
            for n in ast.walk(root):
                if isinstance(n, ast.Subscript) and hasattr(n, "_tt"):
                    self.subs[n._tt] = (ast.unparse(n.value), ast.unparse(n.slice))
                elif isinstance(n, ast.JoinedStr) and hasattr(n, "_tt"):
                    self._plan_fstring(n, source)
            src = lines[root.lineno - 1] if root.lineno <= len(lines) else ""
            prefix = src[: root.col_offset].strip() + " " if root.col_offset else ""
            prefix = prefix.lstrip()
            suffix = ":" if isinstance(stmt, (ast.If, ast.While, ast.For)) else ""
            if isinstance(stmt, ast.For):
                prefix = "for " + ast.unparse(stmt.target) + " in "
            elif isinstance(stmt, ast.AugAssign):
                prefix = ast.unparse(stmt.target) + " " + _AUG.get(type(stmt.op), "?") + "= "
            elif isinstance(stmt, ast.Assign):
                prefix = " = ".join(ast.unparse(t) for t in stmt.targets) + " = "
            elif isinstance(stmt, ast.If):
                prefix = "elif " if src.lstrip().startswith("elif") else "if "
            elif isinstance(stmt, ast.While):
                prefix = "while "
            elif isinstance(stmt, ast.Return):
                prefix = "return "
            elif isinstance(stmt, ast.Assert):
                prefix = "assert "
            elif isinstance(stmt, ast.Match):
                prefix, suffix = "match ", ":"
            display = copy.deepcopy(root)
            self.lines[stmt.lineno] = (display, prefix, suffix)
            for n in ast.walk(display):
                if hasattr(n, "_tt"):
                    self.nodes[n._tt] = n

    def _plan_fstring(self, node, source):
        jid = len(self.formats)
        holes = []
        for v in node.values:
            if not isinstance(v, ast.FormattedValue):
                continue
            spec = None
            fs = v.format_spec
            if fs is None:
                spec = ""
            elif all(isinstance(x, ast.Constant) for x in fs.values):
                spec = "".join(x.value for x in fs.values)
            conv = chr(v.conversion) if v.conversion != -1 else None
            v._ttf = (jid, len(holes))
            holes.append({"code": ast.unparse(v.value), "spec": spec, "conv": conv})
        template = ast.get_source_segment(source, node) or ast.unparse(node)
        self.formats[jid] = {"template": template, "holes": holes}
        self.joined[node._tt] = jid

    def steps(self, line, records):
        """records: [(id, repr text)] in the order Python computed them."""
        root, prefix, suffix = self.lines[line]
        vals = {}
        out = [{"text": _render(root, vals, prefix, suffix)}]
        leaves = False
        for nid, text in records:
            node = self.nodes.get(nid)
            if node is None:
                continue
            skipped = []
            if isinstance(node, (ast.BoolOp, ast.IfExp)):
                for part in (node.values if isinstance(node, ast.BoolOp) else [node.body, node.orelse]):
                    ids = _ids_under(part)
                    if ids and not (ids & vals.keys()):
                        skipped.append(_render(part, vals, "", ""))
            if isinstance(node, (ast.Name, ast.Attribute)) and not skipped:
                if text.startswith("-"):
                    text = f"({text})"
                vals[nid] = text
                leaves = True
                continue
            if leaves:
                out.append({"text": _render(root, vals, prefix, suffix)})
                leaves = False
            part = _render(node, vals, "", "")
            value = text
            if text.startswith("-") and node is not root:
                text = f"({text})"
            vals[nid] = text
            step = {"text": _render(root, vals, prefix, suffix), "part": part, "value": value}
            if skipped:
                step["skipped"] = skipped
            out.append(step)
        if leaves:
            out.append({"text": _render(root, vals, prefix, suffix)})
        # Drop repeats (a step that changed nothing visible).
        clean = []
        for s in out:
            if not clean or clean[-1]["text"] != s["text"] or s.get("skipped"):
                clean.append(s)
        return clean[:MAX_EXPR_STEPS]


_AUG = {
    ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/", ast.FloorDiv: "//", ast.Mod: "%",
    ast.Pow: "**", ast.LShift: "<<", ast.RShift: ">>", ast.BitOr: "|", ast.BitXor: "^", ast.BitAnd: "&",
    ast.MatMult: "@",
}


# ---------------------------------------------------------------- tracing


def _is_yield(frame):
    try:
        return dis.opname[frame.f_code.co_code[frame.f_lasti]] == "YIELD_VALUE"
    except Exception:  # noqa: BLE001
        return False


def run_trace(source, options=None):
    """Run code and record one step per finished line (format v2, see top)."""
    options = options or {}
    box = Sandbox(options)
    heap = Heap(bool(options.get("ids")))
    steps = []
    events = []  # waiting for the next step
    state = {"printed": 0, "files": None}
    pending = {}  # frame id -> line that is running
    raised = set()  # frames whose running line raised
    inflight = {}  # frame id -> exception type name not handled yet
    last_line = {}  # frame id -> last finished line
    rounds = {}  # (frame id, loop line) -> round number
    seen_exc = {}
    gen_frames = set()
    records = {}  # frame id -> [(expr node id, repr)]
    lines = source.split("\n")

    try:
        tree = ast.parse(source, FILENAME)
    except SyntaxError as exc:
        return {"version": TRACE_VERSION, "steps": [], "stdout": "", "vars": {}, "error": error_info(exc)}
    shape = Shape(tree, lines)
    plan = ExprPlan(tree, lines, set(options.get("expr") or []))
    if plan.lines:
        tree = ast.fix_missing_locations(_Wrap().visit(tree))
    code = compile(tree, FILENAME, "exec")
    namespace = box.namespace()

    holes_done = {}  # (frame id, f-string id) -> [hole info]

    def tt_v(nid, value, frame=None):
        frame = frame or sys._getframe(1)
        records.setdefault(id(frame), []).append((nid, safe_repr(value)))
        jid = plan.joined.get(nid)
        if jid is not None:
            info = plan.formats[jid]
            done = holes_done.pop((id(frame), jid), [])
            emit({"kind": "format", "line": frame.f_lineno, "template": info["template"], "holes": done, "text": value[:MAX_TEXT]})
        return value

    def tt_s(nid, seq, is_slice, a, b, c):
        frame = sys._getframe(1)
        key = slice(a, b, c) if is_slice else a
        target, code_key = plan.subs[nid]
        ev = None
        if isinstance(seq, (str, list, tuple, range)):
            n = len(seq)
            ev = {"kind": "index", "line": frame.f_lineno, "target": target, "key": code_key, "len": n}
            if is_slice:
                try:
                    ev["picked"] = list(range(*key.indices(n)))[:MAX_ITEMS]
                    ev["slice"] = True
                except Exception:  # noqa: BLE001 - a bad slice raises below
                    pass
            elif isinstance(key, int):
                i = key + n if key < 0 else key
                ev["at"] = key
                ev["picked"] = [i] if 0 <= i < n else []
        try:
            res = seq[key]
        except BaseException:
            if ev is not None:
                ev["error"] = True
                emit_last(ev)  # this line never finishes, so show it on the step before
            raise
        if ev is not None:
            ev["value"] = safe_repr(res)
            emit(ev)
        return tt_v(nid, res, frame)

    def tt_f(jid, k, value):
        frame = sys._getframe(1)
        hole = dict(plan.formats[jid]["holes"][k])
        conv = hole["conv"]
        shown = repr(value) if conv == "r" else str(value) if conv == "s" else ascii(value) if conv == "a" else value
        hole["value"] = safe_repr(value)
        if hole["spec"] is not None:
            try:
                hole["result"] = format(shown, hole["spec"])[:MAX_TEXT]
            except Exception as exc:  # noqa: BLE001 - the real f-string raises the same error next
                hole["error"] = f"{type(exc).__name__}: {exc}"
                info = plan.formats[jid]
                done = holes_done.pop((id(frame), jid), [])
                emit_last({"kind": "format", "line": frame.f_lineno, "template": info["template"], "holes": done + [hole], "text": None})
                return value
        holes_done.setdefault((id(frame), jid), []).append(hole)
        return value

    namespace[HELPER] = tt_v
    namespace[SUB_HELPER] = tt_s
    namespace[FMT_HELPER] = tt_f

    def emit(ev):
        events.append(ev)

    def emit_last(ev):
        # Keep order: if something is already waiting, this comes after it.
        if steps and not events:
            steps[-1].setdefault("events", []).append(ev)
        else:
            events.append(ev)

    box.on_input = lambda prompt, value, i: emit({"kind": "input", "prompt": prompt, "value": value, "index": i})

    def user_frames(frame):
        out = []
        f = frame
        while f is not None:
            if f.f_code.co_filename == FILENAME and f.f_code.co_name != "<module>":
                out.append(f)
            f = f.f_back
        out.reverse()
        return out

    def record(frame, line, nxt):
        text = box.buffer.getvalue()
        todo = []
        step = {"line": line, "stdout": text[state["printed"] :], "vars": heap.names(namespace, todo)}
        state["printed"] = len(text)
        frames = user_frames(frame)
        if frames:
            stack = []
            for f in frames:
                stack.append({
                    "func": f.f_code.co_name,
                    "line": line if f is frame else f.f_lineno,
                    "locals": heap.names(dict(f.f_locals), todo),
                })
            step["stack"] = stack
            if frames[-1] is frame:
                step["func"] = stack[-1]["func"]
                step["locals"] = stack[-1]["locals"]
        h = heap.snapshot(todo)
        if h:
            step["heap"] = h
        key = id(frame)
        evs = list(events)
        events.clear()
        info = shape.tests.get(line)
        if info:
            a, b = info["body"]
            entered = nxt is not None and a <= nxt <= b
            if info["stmt"] in ("if", "elif", "while", "case"):
                evs.append({"kind": "test", "line": line, "stmt": info["stmt"], "result": entered})
            if info["stmt"] in ("for", "while"):
                prev = last_line.get(key)
                fresh = prev is None or not (a <= prev <= b)
                n = 0 if fresh else rounds.get((key, line), 0)
                if entered:
                    n += 1
                rounds[(key, line)] = n
                ev = {"kind": "loop", "line": line, "stmt": info["stmt"], "round": n}
                if not entered:
                    ev["done"] = True
                evs.append(ev)
        if line in shape.jumps:
            kind, loop = shape.jumps[line]
            evs.append({"kind": kind, "line": line, "loop": loop})
        recs = records.pop(key, None)
        if recs is not None and line in plan.lines:
            try:
                evs.append({"kind": "expr", "line": line, "steps": plan.steps(line, recs)})
            except Exception:  # noqa: BLE001 - a drawing problem must never break the run
                pass
        if evs:
            step["events"] = evs
        files = box.files(heap.keep)
        if files is not None and files != state["files"]:
            step["files"] = files
            state["files"] = files
        last_line[key] = line
        steps.append(step)
        if len(steps) > MAX_STEPS:
            raise StepLimit(f"stopped after {MAX_STEPS} steps")

    def local_tracer(frame, event, arg):
        key = id(frame)
        if event == "line":
            ln = frame.f_lineno
            if key in inflight:
                tname = inflight.pop(key)
                if ln in shape.finally_lines:
                    inflight[key] = tname
                    if pending.get(key) not in shape.finally_lines:
                        emit({"kind": "finally", "line": ln})
                else:
                    emit({"kind": "caught", "type": tname, "line": ln})
            if key in pending and pending[key] == ln and ln not in shape.tests:
                return local_tracer  # same line again (a comprehension): one step
            raised.discard(key)
            if key in pending:
                record(frame, pending[key], ln)
            pending[key] = ln
        elif event == "exception":
            exc_type, exc, _tb = arg
            if exc_type in (StopIteration, StopAsyncIteration, GeneratorExit) and (
                frame.f_lineno in shape.for_lines or frame.f_code.co_name.startswith("<")
            ):
                return local_tracer  # how loops end, not an error
            raised.add(key)
            inflight[key] = exc_type.__name__
            func = frame.f_code.co_name
            if id(exc) not in seen_exc:
                seen_exc[id(exc)] = exc
                emit({
                    "kind": "raise",
                    "type": exc_type.__name__,
                    "message": error_info(exc)["message"],
                    "line": frame.f_lineno,
                    "func": func,
                })
            else:
                emit({"kind": "unwind", "func": func, "line": frame.f_lineno})
        elif event == "return":
            failed = key in raised
            if key in pending:
                line = pending.pop(key)
                if not failed:
                    record(frame, line, None)
            func = frame.f_code.co_name
            if func != "<module>" and not failed:
                if _is_yield(frame):
                    emit_last({"kind": "yield", "func": func, "value": heap.value(arg)})
                else:
                    emit_last({"kind": "return", "func": func, "value": heap.value(arg)})
            raised.discard(key)
            inflight.pop(key, None)
            records.pop(key, None)
            if not _is_yield(frame):
                last_line.pop(key, None)
        return local_tracer

    def global_tracer(frame, event, arg):
        c = frame.f_code
        if c.co_filename != FILENAME:
            return None
        if c.co_name != "<module>":
            if not c.co_flags & CO_OPTIMIZED:
                return None  # a class body: its step is the class line itself
            key = id(frame)
            if key in gen_frames:
                emit({"kind": "resume", "func": c.co_name})
            else:
                if c.co_flags & 0x20:  # generator
                    gen_frames.add(key)
                todo = []
                emit({"kind": "call", "func": c.co_name, "args": heap.names(dict(frame.f_locals), todo)})
        return local_tracer

    error_holder = []
    with box:
        old = sys.gettrace()
        sys.settrace(global_tracer)
        try:
            with redirect_stdout(box.buffer):
                try:
                    exec(code, namespace)
                except BaseException as exc:  # noqa: BLE001 - learner code can raise anything
                    error_holder.append(exc)
        finally:
            sys.settrace(old)
        final_files = box.files(heap.keep)
        for obj in heap.keep:
            if isinstance(obj, io.IOBase) and not obj.closed:
                try:
                    obj.close()
                except Exception:  # noqa: BLE001
                    pass
    error = None
    if error_holder:
        error = error_info(error_holder[0])
        if isinstance(error_holder[0], StepLimit):
            error = {"type": "Timeout", "message": str(error_holder[0]), "line": None}
    for name in (HELPER, SUB_HELPER, FMT_HELPER):
        namespace.pop(name, None)
    out = {
        "version": TRACE_VERSION,
        "steps": steps,
        "stdout": box.buffer.getvalue(),
        "vars": snapshot(namespace),
        "error": error,
    }
    if events:
        out["events"] = events
    if final_files is not None:
        out["files"] = final_files
    if box.stdin:
        out["stdin"] = {"given": len(box.stdin), "used": box.used}
    return out


# ---------------------------------------------------------------- running and grading


def run_program(source, pre="", post="", options=None):
    """Run pre + source + post without tracing. Returns stdout, vars and error.
    Lines are numbered as in `source` (pre and post run separately)."""
    box = Sandbox(options)
    namespace = box.namespace()
    error = None
    stage = "pre"
    count = [0]

    def limit(frame, event, arg):
        # Count lines of the learner's code so a runaway loop stops (offline too).
        if frame.f_code.co_filename != FILENAME:
            return None

        def per_line(frame, event, arg):
            if event == "line":
                count[0] += 1
                if count[0] > MAX_RUN_LINES:
                    raise StepLimit(f"stopped after {MAX_RUN_LINES} lines")
            return per_line

        return per_line

    with box:
        old = sys.gettrace()
        sys.settrace(limit)
        try:
            with redirect_stdout(box.buffer):
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
            if isinstance(exc, StepLimit):
                error = {"type": "Timeout", "message": f"Timeout: {exc}", "line": None, "stage": stage}
        finally:
            sys.settrace(old)
        files = box.files()
    out = {"stdout": box.buffer.getvalue(), "vars": snapshot(namespace), "error": error}
    if files is not None:
        out["files"] = files
    return out


def normalize_output(text):
    lines = [l.rstrip() for l in text.replace("\r\n", "\n").split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def _test_options(t):
    opts = {}
    if "stdin" in t:
        opts["stdin"] = t["stdin"]
    if "files" in t:
        opts["files"] = t["files"]
    return opts


def run_tests(source, tests):
    """Hidden tests for Fix, Modify, Make and projects.

    Each test: {"name": str, "pre"?: code run first, "post"?: code with asserts
    run after, "stdout"?: exact expected output, "stdin"?: typed answers,
    "files"?: seeded files}. Returns one result per test:
    {"name", "ok", "message", "got"?, "expected"?}.
    """
    results = []
    for t in tests:
        r = run_program(source, t.get("pre", ""), t.get("post", ""), _test_options(t))
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
