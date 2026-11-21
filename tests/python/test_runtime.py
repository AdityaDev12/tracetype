"""Tests for the Python runtime (trace format v2).

Run with: npm run test:py  (or python3 -m unittest discover -s tests/python)
The same runtime.py runs in Pyodide, so these tests cover both tracers.
"""

import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src" / "languages" / "python"))

import runtime as rt  # noqa: E402


def trace(src, **opts):
    return rt.run_trace(src, opts)


def events(r, kind):
    out = []
    for s in r["steps"]:
        out += [e for e in s.get("events", []) if e["kind"] == kind]
    return out + [e for e in r.get("events", []) if e["kind"] == kind]


def lines(r):
    return [s["line"] for s in r["steps"]]


class Basics(unittest.TestCase):
    def test_one_step_per_finished_line(self):
        r = trace("a = 1\nb = a + 1\nprint(b)\n")
        self.assertEqual(lines(r), [1, 2, 3])
        self.assertEqual(r["steps"][2]["stdout"], "2\n")
        self.assertEqual(r["version"], 2)
        self.assertIsNone(r["error"])

    def test_strings_carry_their_characters(self):
        r = trace('word = "hi"\n')
        v = r["steps"][0]["vars"]["word"]
        self.assertEqual(v, {"repr": "'hi'", "type": "str", "text": "hi"})

    def test_uncaught_error_stops_and_is_reported(self):
        r = trace("a = 1\nb = c\nd = 2\n")
        self.assertEqual(lines(r), [1])
        self.assertEqual(r["error"]["type"], "NameError")
        self.assertEqual(r["error"]["line"], 2)
        self.assertEqual(events(r, "raise")[0]["line"], 2)

    def test_syntax_error(self):
        r = trace("a = (\n")
        self.assertEqual(r["steps"], [])
        self.assertEqual(r["error"]["type"], "SyntaxError")

    def test_runaway_loop_is_stopped(self):
        r = trace("while True:\n    pass\n")
        self.assertEqual(r["error"]["type"], "Timeout")

    def test_no_memory_addresses(self):
        r = trace("class Box:\n    pass\nb = Box()\nitems = [b]\n")
        vars_ = r["steps"][-1]["vars"]
        self.assertEqual(vars_["b"]["repr"], "<Box object>")
        self.assertEqual(vars_["items"]["repr"], "[<Box object>]")
        self.assertNotIn("0x", str(r))


class Heap(unittest.TestCase):
    def test_two_names_one_list_share_a_ref(self):
        r = trace("a = [1, 2]\nb = a\nb.append(3)\nc = list(a)\n")
        last = r["steps"][-1]
        self.assertEqual(last["vars"]["a"]["ref"], last["vars"]["b"]["ref"])
        self.assertNotEqual(last["vars"]["a"]["ref"], last["vars"]["c"]["ref"])
        items = last["heap"][last["vars"]["a"]["ref"]]["items"]
        self.assertEqual([i["repr"] for i in items], ["1", "2", "3"])

    def test_ids_are_stable_across_steps(self):
        r = trace("a = []\na.append(1)\na.append(2)\n")
        refs = {s["vars"]["a"]["ref"] for s in r["steps"]}
        self.assertEqual(len(refs), 1)

    def test_nested_containers(self):
        r = trace('d = {"k": [1, (2, 3)]}\n')
        s = r["steps"][0]
        d = s["heap"][s["vars"]["d"]["ref"]]
        self.assertEqual(d["kind"], "dict")
        key, val = d["items"][0]
        self.assertEqual(key["text"], "k")
        inner = s["heap"][val["ref"]]
        self.assertEqual(inner["kind"], "list")
        self.assertEqual(s["heap"][inner["items"][1]["ref"]]["kind"], "tuple")

    def test_sets_are_sorted_for_stable_output(self):
        r = trace('s = {"pear", "fig", "apple"}\n')
        st = r["steps"][0]
        items = st["heap"][st["vars"]["s"]["ref"]]["items"]
        self.assertEqual([i["text"] for i in items], ["apple", "fig", "pear"])

    def test_range_is_described_not_expanded(self):
        r = trace("r = range(2, 10, 3)\n")
        st = r["steps"][0]
        self.assertEqual(st["heap"][st["vars"]["r"]["ref"]], {"kind": "range", "type": "range", "start": 2, "stop": 10, "step": 3, "len": 3})

    def test_objects_point_to_their_class(self):
        src = "class Dog:\n    legs = 4\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        return 1\nd = Dog('Rex')\n"
        r = trace(src)
        st = r["steps"][-1]
        obj = st["heap"][st["vars"]["d"]["ref"]]
        self.assertEqual(obj["kind"], "object")
        self.assertEqual(obj["attrs"]["name"]["text"], "Rex")
        cls = st["heap"][obj["classRef"]]
        self.assertEqual(cls["kind"], "class")
        self.assertEqual(cls["methods"], ["__init__", "bark"])
        self.assertEqual(cls["attrs"]["legs"]["repr"], "4")

    def test_class_body_is_not_traced_as_a_function(self):
        r = trace("class A:\n    x = 1\n    y = 2\na = A()\n")
        self.assertFalse(any(s.get("func") == "A" for s in r["steps"]))

    def test_size_caps(self):
        r = trace("big = list(range(500))\ntext = 'x' * 1000\n")
        st = r["steps"][-1]
        obj = st["heap"][st["vars"]["big"]["ref"]]
        self.assertEqual(len(obj["items"]), rt.MAX_ITEMS)
        self.assertEqual(obj["more"], 500 - rt.MAX_ITEMS)
        self.assertEqual(len(st["vars"]["text"]["text"]), rt.MAX_TEXT)
        self.assertLessEqual(len(st["vars"]["text"]["repr"]), rt.MAX_REPR)

    def test_modules_are_values(self):
        r = trace("import math\n")
        st = r["steps"][0]
        self.assertEqual(st["vars"]["math"]["repr"], "<module 'math'>")
        self.assertEqual(st["heap"][st["vars"]["math"]["ref"]]["kind"], "module")


class Stack(unittest.TestCase):
    def test_full_call_stack(self):
        src = "def f(n):\n    if n == 0:\n        return 0\n    return f(n - 1)\nf(2)\n"
        r = trace(src)
        depths = [len(s.get("stack", [])) for s in r["steps"]]
        self.assertEqual(max(depths), 3)
        deepest = next(s for s in r["steps"] if len(s.get("stack", [])) == 3)
        self.assertEqual([fr["locals"]["n"]["repr"] for fr in deepest["stack"]], ["2", "1", "0"])
        self.assertEqual(deepest["stack"][0]["line"], 4)  # waiting on the call

    def test_call_and_return_events(self):
        r = trace("def add(a, b=1):\n    return a + b\nx = add(2)\n")
        call = events(r, "call")[0]
        self.assertEqual(call["func"], "add")
        self.assertEqual({k: v["repr"] for k, v in call["args"].items()}, {"a": "2", "b": "1"})
        self.assertEqual(events(r, "return")[0]["value"]["repr"], "3")

    def test_generators_yield_and_resume(self):
        r = trace("def g():\n    yield 1\n    yield 2\nfor v in g():\n    w = v\n")
        self.assertEqual([e["value"]["repr"] for e in events(r, "yield")], ["1", "2"])
        self.assertEqual(len(events(r, "resume")), 2)
        self.assertEqual(r["error"], None)
        self.assertEqual(events(r, "raise"), [])  # StopIteration is how loops end


class Branches(unittest.TestCase):
    def test_if_elif_else(self):
        src = "x = 5\nif x > 9:\n    a = 1\nelif x > 3:\n    a = 2\nelse:\n    a = 3\n"
        r = trace(src)
        self.assertEqual([(e["stmt"], e["result"]) for e in events(r, "test")], [("if", False), ("elif", True)])

    def test_if_without_else_false(self):
        r = trace("x = 1\nif x > 3:\n    y = 1\nz = 2\n")
        self.assertEqual(events(r, "test")[0]["result"], False)

    def test_match_case(self):
        src = 'c = "go"\nmatch c:\n    case "stop":\n        x = 0\n    case "go" | "run":\n        x = 1\n    case _:\n        x = 2\n'
        r = trace(src)
        self.assertEqual([(e["line"], e["result"]) for e in events(r, "test")], [(3, False), (5, True)])

    def test_for_rounds_and_done(self):
        r = trace("for i in range(3):\n    j = i\nk = 1\n")
        loops = events(r, "loop")
        self.assertEqual([e["round"] for e in loops], [1, 2, 3, 3])
        self.assertTrue(loops[-1].get("done"))

    def test_nested_loop_rounds_restart(self):
        src = "for a in range(2):\n    for b in range(2):\n        c = a + b\n"
        r = trace(src)
        inner = [e["round"] for e in events(r, "loop") if e["line"] == 2 and not e.get("done")]
        self.assertEqual(inner, [1, 2, 1, 2])

    def test_while_break_continue(self):
        src = "n = 0\nwhile n < 9:\n    n += 1\n    if n == 1:\n        continue\n    if n == 2:\n        break\n"
        r = trace(src)
        self.assertEqual([e["kind"] for s in r["steps"] for e in s.get("events", []) if e["kind"] in ("break", "continue")], ["continue", "break"])
        self.assertEqual(events(r, "break")[0]["loop"], 2)
        self.assertEqual([e["result"] for e in events(r, "test") if e["stmt"] == "while"], [True, True])

    def test_while_false_at_start(self):
        r = trace("n = 5\nwhile n < 3:\n    n += 1\n")
        self.assertEqual(events(r, "loop"), [{"kind": "loop", "line": 2, "stmt": "while", "round": 0, "done": True}])


class Exceptions(unittest.TestCase):
    def test_raise_unwind_caught(self):
        src = "def f():\n    raise ValueError('bad')\ntry:\n    f()\nexcept ValueError:\n    ok = 1\n"
        r = trace(src)
        self.assertEqual(events(r, "raise")[0]["func"], "f")
        self.assertEqual(events(r, "raise")[0]["message"], "ValueError: bad")
        self.assertEqual(events(r, "unwind")[0]["line"], 4)
        self.assertEqual(events(r, "caught")[0]["line"], 5)
        self.assertIsNone(r["error"])

    def test_finally_on_the_way_out(self):
        src = "try:\n    try:\n        1 / 0\n    finally:\n        z = 1\nexcept ZeroDivisionError:\n    w = 1\n"
        r = trace(src)
        self.assertEqual(events(r, "finally")[0]["line"], 5)
        self.assertEqual(events(r, "caught")[0]["line"], 6)

    def test_trailing_events_for_uncaught(self):
        r = trace("x = 1 / 0\n")
        self.assertEqual(r["events"][0]["type"], "ZeroDivisionError")


class Expressions(unittest.TestCase):
    def texts(self, r, line):
        ev = [e for e in events(r, "expr") if e["line"] == line]
        return [[s["text"] for s in e["steps"]] for e in ev]

    def test_precedence(self):
        r = trace("a = 2\nb = 3\nc = a + b * 4\n", expr=[3])
        self.assertEqual(self.texts(r, 3)[0], ["c = a + b * 4", "c = 2 + 3 * 4", "c = 2 + 12", "c = 14"])

    def test_parentheses(self):
        r = trace("c = (2 + 3) * 4\n", expr=[1])
        self.assertEqual(self.texts(r, 1)[0], ["c = (2 + 3) * 4", "c = 5 * 4", "c = 20"])

    def test_short_circuit_marks_skipped(self):
        r = trace("x = 0\nok = x > 1 and 10 / x > 2\n", expr=[2])
        steps = events(r, "expr")[0]["steps"]
        self.assertEqual(steps[-1]["text"], "ok = False")
        self.assertEqual(steps[-1]["skipped"], ["10 / x > 2"])

    def test_function_call_value(self):
        r = trace("def sq(n):\n    return n * n\nt = sq(3) + 1\n", expr=[3])
        self.assertEqual(self.texts(r, 3)[0], ["t = sq(3) + 1", "t = 9 + 1", "t = 10"])

    def test_print_args_reduce_but_not_print(self):
        r = trace("a = 2\nprint(a * 5)\n", expr=[2])
        self.assertEqual(self.texts(r, 2)[0], ["print(a * 5)", "print(2 * 5)", "print(10)"])

    def test_if_test_and_loops_repeat(self):
        r = trace("for i in range(2):\n    if i > 0:\n        pass\n", expr=[2])
        self.assertEqual([t[-1] for t in self.texts(r, 2)], ["if False:", "if True:"])

    def test_walrus_and_input(self):
        src = 'while (w := input()) != "q":\n    pass\n'
        r = trace(src, expr=[1], stdin=["a", "q"])
        self.assertEqual(self.texts(r, 1)[0], ["while (w := input()) != 'q':", "while (w := 'a') != 'q':", "while 'a' != 'q':", "while True:"])

    def test_augmented_assignment(self):
        r = trace("x = 3\nx += 2 * 2\n", expr=[2])
        self.assertEqual(self.texts(r, 2)[0], ["x += 2 * 2", "x += 4"])

    def test_negative_values_get_parentheses(self):
        r = trace("x = -3\ny = x ** 2\n", expr=[2])
        self.assertEqual(self.texts(r, 2)[0][1], "y = (-3) ** 2")

    def test_fstring_does_not_break(self):
        r = trace('p = 2.5\ns = f"{p:.2f} {p=}"\n', expr=[2])
        self.assertIsNone(r["error"])
        self.assertEqual(self.texts(r, 2)[0][-1], "s = '2.50 p=2.5'")

    def test_unmarked_lines_have_no_expr(self):
        r = trace("a = 1 + 2\n")
        self.assertEqual(events(r, "expr"), [])


class Stdin(unittest.TestCase):
    def test_answers_are_used_in_order_and_echoed(self):
        r = trace('a = input("A? ")\nb = input("B? ")\n', stdin=["1", "2"])
        self.assertEqual(r["stdout"], "A? 1\nB? 2\n")
        self.assertEqual([e["value"] for e in events(r, "input")], ["1", "2"])
        self.assertEqual(r["stdin"], {"given": 2, "used": 2})

    def test_running_out_of_answers_is_eof(self):
        r = trace("a = input()\nb = input()\n", stdin=["1"])
        self.assertEqual(r["error"]["type"], "EOFError")

    def test_no_stdin_at_all(self):
        r = trace("a = input()\n")
        self.assertEqual(r["error"]["type"], "EOFError")


class Files(unittest.TestCase):
    def test_seeded_and_written_files_are_recorded(self):
        src = 'text = open("in.txt").read()\nwith open("out.txt", "w") as f:\n    f.write(text.upper())\n'
        r = trace(src, files={"in.txt": "hi"})
        self.assertEqual(r["steps"][0]["files"], {"in.txt": "hi"})
        self.assertEqual(r["files"], {"in.txt": "hi", "out.txt": "HI"})
        f = next(o for s in r["steps"] for o in s.get("heap", {}).values() if o["kind"] == "file")
        self.assertEqual(f["mode"], "w")

    def test_files_never_touch_the_real_folder(self):
        before = os.getcwd()
        trace('open("leak.txt", "w").write("x")\n')
        self.assertEqual(os.getcwd(), before)
        self.assertFalse(os.path.exists(os.path.join(before, "leak.txt")))

    def test_each_run_starts_clean(self):
        trace('open("a.txt", "w").write("x")\n', files={})
        r = trace('import os\nn = len(os.listdir("."))\n', files={})
        self.assertEqual(r["steps"][-1]["vars"]["n"]["repr"], "0")

    def test_unclosed_file_is_still_recorded(self):
        r = trace('f = open("a.txt", "w")\nf.write("hey")\nn = 1\n', files={})
        self.assertEqual(r["steps"][1]["files"], {"a.txt": "hey"})
        self.assertEqual(r["files"], {"a.txt": "hey"})

    def test_pathlib(self):
        r = trace('from pathlib import Path\nPath("n.txt").write_text("ok")\nt = Path("n.txt").read_text()\n', files={})
        self.assertEqual(r["steps"][-1]["vars"]["t"]["text"], "ok")


class Grading(unittest.TestCase):
    def test_tests_with_stdin_and_files(self):
        src = 'n = int(input())\nopen("o.txt", "w").write(str(n * 2))\n'
        tests = [
            {"name": "doubles", "stdin": ["4"], "files": {}, "post": 'assert open("o.txt").read() == "8", "wrong file"'},
            {"name": "bad", "stdin": ["5"], "files": {}, "post": 'assert open("o.txt").read() == "8", "wrong file"'},
        ]
        res = rt.run_tests(src, tests)
        self.assertTrue(res[0]["ok"])
        self.assertFalse(res[1]["ok"])
        self.assertEqual(res[1]["message"], "wrong file")

    def test_run_program_vars_are_v1_shape(self):
        r = rt.run_program("a = [1]\n")
        self.assertEqual(r["vars"]["a"], {"repr": "[1]", "type": "list"})

    def test_call_json_entry_point(self):
        import json

        out = json.loads(rt.call("trace", json.dumps(["x = input()\n", {"stdin": ["7"]}])))
        self.assertEqual(out["steps"][0]["vars"]["x"]["text"], "7")


if __name__ == "__main__":
    unittest.main()
