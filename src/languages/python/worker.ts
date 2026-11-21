/// <reference lib="webworker" />
// Runs Python (Pyodide) off the main thread. Loaded only when a learner first
// needs to run code. The main thread kills this worker if a run takes too long,
// so an infinite loop can never freeze the page.

import runtimeSource from './runtime.py?raw'

export const PYODIDE_VERSION = '314.0.8'
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

interface PyodideLike {
  FS: { writeFile: (path: string, data: string) => void }
  runPython: (code: string) => unknown
  setStdin: (opts: { error: boolean }) => void
  pyimport: (name: string) => { call: (op: string, args: string) => string }
}

let runtime: { call: (op: string, args: string) => string } | null = null

async function boot() {
  const mod = (await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)) as {
    loadPyodide: (opts: { indexURL: string }) => Promise<PyodideLike>
  }
  const py = await mod.loadPyodide({ indexURL: INDEX_URL })
  // input() has no keyboard in a worker: make it raise instead of hanging.
  py.setStdin({ error: true })
  py.FS.writeFile('/home/pyodide/tt_runtime.py', runtimeSource)
  py.runPython('import sys\nif "/home/pyodide" not in sys.path: sys.path.insert(0, "/home/pyodide")')
  runtime = py.pyimport('tt_runtime')
}

const ready = boot()
ready.then(
  () => postMessage({ type: 'ready' }),
  (e: unknown) => postMessage({ type: 'failed', message: e instanceof Error ? e.message : String(e) }),
)

self.onmessage = async (ev: MessageEvent<{ id: number; op: string; args: unknown[] }>) => {
  const { id, op, args } = ev.data
  try {
    await ready
    const out = runtime!.call(op, JSON.stringify(args))
    postMessage({ type: 'result', id, result: JSON.parse(out) })
  } catch (e) {
    postMessage({ type: 'error', id, message: e instanceof Error ? e.message : String(e) })
  }
}
