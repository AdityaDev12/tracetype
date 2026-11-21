import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentLess } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { EditorSelection, EditorState, type Extension } from '@codemirror/state'
import { Decoration, drawSelection, EditorView, keymap, lineNumbers, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view'
import { useEffect, useRef } from 'react'
import { charKinds } from '../engine/tokens.ts'
import { INDENT, tabSpaces } from '../engine/typing.ts'
import type { LanguagePack } from '../languages/index.ts'
import { useLanguagePack } from '../languages/LanguageContext.tsx'

// Multi-line code editor for Fix, Modify, Make and Recall. Same editing feel as
// the Trace line editor: auto-closing brackets, undo, Tab = 4 spaces, and Enter
// keeps the indentation (one more level after a line ending in a colon).

interface Props {
  value: string
  onChange: (value: string) => void
  /** Ctrl/Cmd+Enter runs the check. */
  onSubmit?: () => void
  readOnly?: boolean
  ariaLabel: string
  /** Replace the text from outside (e.g. Show answer) by changing this key. */
  resetKey?: string | number
}

function colors(pack: LanguagePack): Extension {
  const build = (state: EditorState): DecorationSet => {
    const ranges = []
    for (let n = 1; n <= state.doc.lines; n++) {
      const line = state.doc.line(n)
      const kinds = charKinds(pack.tokenize(line.text), line.text.length)
      let start = 0
      for (let i = 1; i <= line.text.length; i++) {
        if (i === line.text.length || kinds[i] !== kinds[start]) {
          if (kinds[start] !== 'space') ranges.push(Decoration.mark({ class: `tok-${kinds[start]}` }).range(line.from + start, line.from + i))
          start = i
        }
      }
    }
    return Decoration.set(ranges, true)
  }
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(v: EditorView) {
        this.decorations = build(v.state)
      }
      update(u: ViewUpdate) {
        if (u.docChanged) this.decorations = build(u.state)
      }
    },
    { decorations: (v) => v.decorations },
  )
}

const newlineKeepIndent = (v: EditorView) => {
  v.dispatch(
    v.state.changeByRange((range) => {
      const line = v.state.doc.lineAt(range.from)
      const before = line.text.slice(0, range.from - line.from)
      let indent = /^ */.exec(line.text)![0]
      if (before.trimEnd().endsWith(':')) indent += INDENT
      const insert = '\n' + indent
      return { changes: { from: range.from, to: range.to, insert }, range: EditorSelection.cursor(range.from + insert.length) }
    }),
  )
  return true
}

const theme = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--chalk)', fontSize: '15px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.85' },
  '.cm-content': { caretColor: 'var(--phosphor)', padding: '10px 0' },
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: 'var(--ghost)' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 14px 0 10px', minWidth: '34px' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-cursor': { borderLeftColor: 'var(--phosphor)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(255, 181, 71, 0.22) !important',
  },
})

export function CodeEditor({ value, onChange, onSubmit, readOnly = false, ariaLabel, resetKey }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const pack = useLanguagePack()
  const cb = useRef({ onChange, onSubmit })
  useEffect(() => {
    cb.current = { onChange, onSubmit }
  })
  // Read when the editor is (re)created; later edits flow out through onChange.
  const initial = useRef(value)
  useEffect(() => {
    initial.current = value
  })

  useEffect(() => {
    if (!host.current) return
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.current,
        extensions: [
          lineNumbers(),
          history(),
          closeBrackets(),
          drawSelection(),
          indentUnit.of(INDENT),
          EditorState.tabSize.of(4),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          keymap.of([
            { key: 'Mod-Enter', run: () => (cb.current.onSubmit?.(), true) },
            { key: 'Enter', run: newlineKeepIndent },
            {
              key: 'Tab',
              run: (ev) => {
                ev.dispatch(
                  ev.state.changeByRange((r) => {
                    const sp = tabSpaces(r.from - ev.state.doc.lineAt(r.from).from)
                    return { changes: { from: r.from, to: r.to, insert: sp }, range: EditorSelection.cursor(r.from + sp.length) }
                  }),
                )
                return true
              },
            },
            { key: 'Shift-Tab', run: indentLess },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cb.current.onChange(u.state.doc.toString())
          }),
          EditorView.contentAttributes.of({ autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': ariaLabel }),
          colors(pack),
          theme,
        ],
      }),
    })
    view.current = v
    return () => {
      v.destroy()
      view.current = null
    }
  }, [pack, readOnly, ariaLabel, resetKey])

  return <div ref={host} className="code-editor" />
}
