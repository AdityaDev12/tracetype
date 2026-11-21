import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentLess } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { EditorSelection, EditorState, type Extension } from '@codemirror/state'
import {
  Decoration,
  drawSelection,
  EditorView,
  keymap,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { useEffect, useRef, type RefObject } from 'react'
import { charKinds } from '../engine/tokens.ts'
import type { LanguagePack } from '../languages/index.ts'
import { useLanguagePack } from '../languages/LanguageContext.tsx'
import { compareLine, INDENT, tabSpaces } from '../engine/typing.ts'

// A one-line CodeMirror editor for the line being typed in Trace and Recall.
// CodeMirror gives real editor behavior (cursor keys, Home/End, mouse, select,
// undo, auto-closing brackets, phone keyboards). This file only adds the
// TraceType parts: ghost text, red wrong characters and Enter to check.

export type EditorVariant = 'trace' | 'recall'

interface Props {
  initial: string
  target: string
  variant: EditorVariant
  onEnter: (text: string, cursor: number) => void
  onChange: (text: string, cursor: number, docChanged: boolean) => void
  onFocusChange: (focused: boolean) => void
  viewRef?: RefObject<EditorView | null>
  ariaLabel: string
}

class GhostWidget extends WidgetType {
  readonly text: string
  constructor(text: string) {
    super()
    this.text = text
  }
  eq(other: GhostWidget) {
    return other.text === this.text
  }
  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-ghost'
    span.textContent = this.text
    return span
  }
  ignoreEvent() {
    return false
  }
}

function decorate(state: EditorState, target: string, variant: EditorVariant, pack: LanguagePack): DecorationSet {
  const text = state.doc.toString()
  const kinds = charKinds(pack.tokenize(text), text.length)
  const ranges = []
  if (variant === 'recall') {
    // No hints in Recall: just syntax colors for what was typed.
    for (let i = 0; i < text.length; i++) {
      ranges.push(Decoration.mark({ class: `tok-${kinds[i]}` }).range(i, i + 1))
    }
    return Decoration.set(ranges, true)
  }
  const cmp = compareLine(text, state.selection.main.head, target)
  for (let i = 0; i < text.length; i++) {
    const cls = cmp.ok[i] ? `tok-${kinds[i]}` : 'cm-wrong'
    ranges.push(Decoration.mark({ class: cls }).range(i, i + 1))
  }
  for (const g of cmp.ghosts) {
    ranges.push(Decoration.widget({ widget: new GhostWidget(g.text), side: 1 }).range(g.at))
  }
  return Decoration.set(ranges, true)
}

function lineDecorations(target: string, variant: EditorVariant, pack: LanguagePack): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) {
        this.decorations = decorate(view.state, target, variant, pack)
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.selectionSet) this.decorations = decorate(u.state, target, variant, pack)
      }
    },
    { decorations: (v) => v.decorations },
  )
}

const theme = EditorView.theme({
  '&': { backgroundColor: 'transparent', fontSize: 'inherit', color: 'var(--text)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'inherit', lineHeight: 'inherit', overflow: 'visible' },
  '.cm-content': { padding: '0', caretColor: 'var(--accent)', minWidth: '4ch' },
  '.cm-line': { padding: '0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'rgba(138, 180, 255, 0.3) !important',
  },
})

export function LineEditor({ initial, target, variant, onEnter, onChange, onFocusChange, viewRef, ariaLabel }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const pack = useLanguagePack()
  // Callbacks live in a ref so the editor is created once per line.
  const cb = useRef({ onEnter, onChange, onFocusChange })
  useEffect(() => {
    cb.current = { onEnter, onChange, onFocusChange }
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const state = EditorState.create({
      doc: initial,
      selection: EditorSelection.cursor(initial.length),
      extensions: [
        history(),
        closeBrackets(),
        drawSelection(),
        indentUnit.of(INDENT),
        EditorState.tabSize.of(4),
        keymap.of([
          {
            key: 'Enter',
            run: (v) => {
              cb.current.onEnter(v.state.doc.toString(), v.state.selection.main.head)
              return true
            },
          },
          {
            key: 'Tab',
            run: (v) => {
              v.dispatch(
                v.state.changeByRange((range) => {
                  const col = range.from - v.state.doc.lineAt(range.from).from
                  const spaces = tabSpaces(col)
                  return {
                    changes: { from: range.from, to: range.to, insert: spaces },
                    range: EditorSelection.cursor(range.from + spaces.length),
                  }
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
        // One line only: refuse anything that would add a line break.
        EditorState.transactionFilter.of((tr) => (tr.docChanged && tr.newDoc.lines > 1 ? [] : tr)),
        EditorView.domEventHandlers({
          paste(e, view) {
            const t = e.clipboardData?.getData('text/plain')
            if (t && /[\r\n\t]/.test(t)) {
              e.preventDefault()
              view.dispatch(view.state.replaceSelection(t.replace(/[\r\n]+/g, ' ').replace(/\t/g, INDENT)))
              return true
            }
            return false
          },
        }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged || u.selectionSet) {
            cb.current.onChange(u.state.doc.toString(), u.state.selection.main.head, u.docChanged)
          }
          if (u.focusChanged) cb.current.onFocusChange(u.view.hasFocus)
        }),
        EditorView.contentAttributes.of({
          autocapitalize: 'off',
          autocorrect: 'off',
          spellcheck: 'false',
          'aria-label': ariaLabel,
        }),
        lineDecorations(target, variant, pack),
        theme,
      ],
    })
    const view = new EditorView({ state, parent: host })
    if (viewRef) viewRef.current = view
    view.focus()
    cb.current.onFocusChange(view.hasFocus)
    return () => {
      if (viewRef && viewRef.current === view) viewRef.current = null
      view.destroy()
    }
    // The editor is rebuilt only when the line itself changes.
  }, [initial, target, variant, viewRef, ariaLabel, pack])

  return <div ref={hostRef} className="line-editor" />
}
