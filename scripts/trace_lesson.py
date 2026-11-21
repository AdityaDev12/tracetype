#!/usr/bin/env python3
"""Run every piece of code in a lesson and write the generated data back.

Usage:
    python3 scripts/trace_lesson.py content/lessons/python/py-01-variables.json [more files...]
    python3 scripts/trace_lesson.py --all

Every value the site shows comes from here (or the same runtime in Pyodide),
never typed by hand. For each code-bearing item it writes a "gen" field:

    predict      gen.trace, gen.output, gen.answer (from the real output)
    examples     gen.trace (one step per finished line, loop bodies repeat)
    faded        gen.expected {stdout, vars} of the filled-in program
    parsons      gen.expected {stdout, vars} of the lines in order
    fix          gen.error (what the buggy code does)
    mistakes     gen.error (the real error message)
    fix, modify, make, projects: tests are run and must make sense
    every item   gen.hash of its authored fields, so stale data is caught

It also checks the exercises make sense, and stops with an error if not:
the buggy Fix code must fail a test and the solution must pass, Modify must
start failing and end passing, mistakes must really raise an error, and
every predict answer is the real output.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src" / "languages" / "python"))

import runtime as rt  # noqa: E402

CONTENT = ROOT / "content"
BLANK = "___"


class LessonError(Exception):
    pass


def authored(item):
    return {k: v for k, v in item.items() if k != "gen"}


def must_run(label, src):
    r = rt.run_trace(src)
    if r["error"]:
        raise LessonError(f"{label}: code raised {r['error']['message']} (line {r['error']['line']})")
    return r


def check_tests(label, src, tests, should_pass):
    results = rt.run_tests(src, tests)
    failed = [r for r in results if not r["ok"]]
    if should_pass and failed:
        f = failed[0]
        raise LessonError(f"{label}: solution fails test '{f['name']}': {f['message']} {f.get('got', '')!r}")
    if not should_pass and not failed:
        raise LessonError(f"{label}: starting code already passes every test, so there is nothing to do")
    return results


def fill_blanks(code_lines, answers, label):
    text = "\n".join(code_lines)
    if text.count(BLANK) != len(answers):
        raise LessonError(f"{label}: {text.count(BLANK)} blanks but {len(answers)} answers")
    for a in answers:
        text = text.replace(BLANK, a, 1)
    return text + "\n"


def gen_lesson(lesson):
    out = dict(lesson)
    for i, p in enumerate(lesson.get("predict", [])):
        label = f"predict[{i}]"
        r = must_run(label, rt.source_of(p["code"]))
        output = rt.normalize_output(r["stdout"])
        gen = {"hash": rt.canonical_hash(authored(p)), "trace": r["steps"], "output": output}
        if p["kind"] == "choice":
            hits = [k for k, o in enumerate(p["options"]) if rt.normalize_output(o) == output]
            if len(hits) != 1:
                raise LessonError(f"{label}: exactly one option must equal the real output {output!r}")
            gen["answer"] = hits[0]
        p["gen"] = gen

    for i, ex in enumerate(lesson.get("examples", [])):
        r = must_run(f"examples[{i}]", rt.source_of([l["code"] for l in ex["lines"]]))
        ex["gen"] = {"hash": rt.canonical_hash(authored(ex)), "trace": r["steps"]}

    for i, f in enumerate(lesson.get("faded", [])):
        label = f"faded[{i}]"
        src = fill_blanks(f["code"], f["answers"], label)
        r = must_run(label, src)
        f["gen"] = {"hash": rt.canonical_hash(authored(f)), "expected": {"stdout": rt.normalize_output(r["stdout"]), "vars": r["vars"]}}

    for i, p in enumerate(lesson.get("parsons", [])):
        r = must_run(f"parsons[{i}]", rt.source_of(p["lines"]))
        p["gen"] = {"hash": rt.canonical_hash(authored(p)), "expected": {"stdout": rt.normalize_output(r["stdout"]), "vars": r["vars"]}}

    for i, x in enumerate(lesson.get("fix", [])):
        label = f"fix[{i}]"
        check_tests(label, rt.source_of(x["code"]), x["tests"], should_pass=False)
        check_tests(label, rt.source_of(x["solution"]), x["tests"], should_pass=True)
        err = rt.run_program(rt.source_of(x["code"]))["error"]
        x["gen"] = {"hash": rt.canonical_hash(authored(x)), "error": err["message"] if err else None}

    for i, m in enumerate(lesson.get("modify", [])):
        label = f"modify[{i}]"
        check_tests(label, rt.source_of(m["code"]), m["tests"], should_pass=False)
        check_tests(label, rt.source_of(m["solution"]), m["tests"], should_pass=True)
        m["gen"] = {"hash": rt.canonical_hash(authored(m))}

    for i, m in enumerate(lesson.get("make", [])):
        label = f"make[{i}]"
        check_tests(label, rt.source_of(m["solution"]), m["tests"], should_pass=True)
        if m.get("starter"):
            check_tests(label, rt.source_of(m["starter"]), m["tests"], should_pass=False)
        m["gen"] = {"hash": rt.canonical_hash(authored(m))}

    for i, m in enumerate(lesson.get("mistakes", [])):
        label = f"mistakes[{i}]"
        err = rt.run_program(rt.source_of(m["code"]))["error"]
        if not err:
            raise LessonError(f"{label}: the mistake code runs without an error")
        must_run(f"{label}.fix", rt.source_of(m["fix"]))
        m["gen"] = {"hash": rt.canonical_hash(authored(m)), "error": err["message"], "line": err["line"]}
    return out


def gen_project(project):
    label = f"project {project['id']}"
    check_tests(label, rt.source_of(project["solution"]), project["tests"], should_pass=True)
    if project.get("starter"):
        check_tests(label, rt.source_of(project["starter"]), project["tests"], should_pass=False)
    project["gen"] = {"hash": rt.canonical_hash(authored(project))}
    return project


def gen_demo(demo):
    """Small demo programs for the landing page and the style page."""
    src = rt.source_of([l["code"] for l in demo["lines"]])
    r = must_run(demo["id"], src)
    demo["trace"] = r["steps"]
    demo["traceHash"] = rt.canonical_hash([l["code"] for l in demo["lines"]])
    return demo


def gen_file(path):
    path = Path(path).resolve()
    data = json.loads(path.read_text(encoding="utf-8"))
    rel = path.relative_to(ROOT)
    if "examples" in data:
        data = gen_lesson(data)
        kind = "lesson"
    elif "tests" in data and "solution" in data:
        data = gen_project(data)
        kind = "project"
    elif "lines" in data:
        data = gen_demo(data)
        kind = "demo"
    else:
        raise LessonError(f"{rel}: not a lesson, project or demo")
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"ok   {rel} ({kind})")


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    if argv == ["--all"]:
        files = sorted(
            [*(CONTENT / "lessons").rglob("*.json"), *(CONTENT / "projects").rglob("*.json"), *(CONTENT / "demos").glob("*.json")]
        )
    else:
        files = argv
    failed = 0
    for f in files:
        try:
            gen_file(f)
        except LessonError as e:
            failed += 1
            print(f"FAIL {e}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
