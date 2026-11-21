import type { RunResult, TestResult, TraceResult } from '../../engine/grade.ts'
import type { CodeTest, RunOptions } from '../../engine/types.ts'
import type { LiveRunner, RunnerStatus } from '../index.ts'

// Main-thread side of the Python worker. One shared runner for the whole app.
// Status is observable so the UI can show "loading Python..." and explain if it
// fails. Each run has a time limit: on timeout the worker is killed and a fresh
// one starts loading in the background.

const RUN_TIMEOUT_MS = 5000
const LOAD_TIMEOUT_MS = 90000

export class TimeoutError extends Error {
  constructor() {
    super('Your code took too long and was stopped. Is there a loop that never ends?')
  }
}

export class RunnerUnavailable extends Error {}

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: number }

class PythonWorkerRunner implements LiveRunner {
  status: RunnerStatus = 'idle'
  failure = ''
  private worker: Worker | null = null
  private ready: Promise<void> | null = null
  private pending = new Map<number, Pending>()
  private nextId = 1
  private listeners = new Set<() => void>()

  subscribe = (cb: () => void) => {
    this.listeners.add(cb)
    return () => {
      this.listeners.delete(cb)
    }
  }

  private setStatus(s: RunnerStatus, failure = '') {
    this.status = s
    this.failure = failure
    this.listeners.forEach((l) => l())
  }

  /** Starts loading Python if it has not started yet. */
  load(): Promise<void> {
    if (this.ready) return this.ready
    this.setStatus('loading')
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    this.worker = worker
    this.ready = new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => fail('Python took too long to load.'), LOAD_TIMEOUT_MS)
      const fail = (msg: string) => {
        window.clearTimeout(timer)
        this.setStatus('failed', msg)
        worker.terminate()
        if (this.worker === worker) this.worker = null
        reject(new RunnerUnavailable(msg))
      }
      worker.onerror = (e) => fail(e.message || 'The Python worker could not start.')
      worker.onmessage = (ev: MessageEvent) => {
        const msg = ev.data as { type: string; id?: number; result?: unknown; message?: string }
        if (msg.type === 'ready') {
          window.clearTimeout(timer)
          this.setStatus('ready')
          resolve()
        } else if (msg.type === 'failed') {
          fail(`Python could not load (${msg.message ?? 'unknown error'}). Check your internet connection.`)
        } else if (msg.id !== undefined) {
          const p = this.pending.get(msg.id)
          if (!p) return
          this.pending.delete(msg.id)
          window.clearTimeout(p.timer)
          if (msg.type === 'result') p.resolve(msg.result)
          else p.reject(new Error(msg.message))
        }
      }
    })
    // Avoid an unhandled rejection warning when nobody is waiting yet.
    this.ready.catch(() => {})
    return this.ready
  }

  /** Kill a stuck worker and start a fresh one. */
  private restart() {
    this.worker?.terminate()
    this.worker = null
    this.ready = null
    for (const p of this.pending.values()) {
      window.clearTimeout(p.timer)
      p.reject(new TimeoutError())
    }
    this.pending.clear()
    void this.load()
  }

  /** Try again after a failed load. */
  retry() {
    this.ready = null
    void this.load()
  }

  private async call<T>(op: string, args: unknown[]): Promise<T> {
    await this.load()
    const worker = this.worker
    if (!worker) throw new RunnerUnavailable(this.failure || 'Python is not available.')
    const id = this.nextId++
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => this.restart(), RUN_TIMEOUT_MS)
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer })
      worker.postMessage({ id, op, args })
    })
  }

  trace(src: string, options: RunOptions = {}) {
    return this.call<TraceResult>('trace', [src, options])
  }
  run(src: string, pre = '', post = '', options: RunOptions = {}) {
    return this.call<RunResult>('run', [src, pre, post, options])
  }
  tests(src: string, tests: CodeTest[]) {
    return this.call<TestResult[]>('tests', [src, tests])
  }
  sameAst(a: string, b: string) {
    return this.call<boolean>('same_ast', [a, b])
  }
}

export const pythonRunner = new PythonWorkerRunner()
