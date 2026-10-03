import vm from 'node:vm'
import editorHtml from '../src/components/text/editor_html'

// Exercise the actual insertion/highlighting functions without loading a WebView.
function openEditor(text, start = text.length, end = start) {
  let selection = { start, end }
  const root = { scrollTop: 37, focus: jest.fn() }
  Object.defineProperty(root, 'textContent', {
    get: () => text,
    set: value => { text = value; selection = { start: 0, end: 0 } }
  })
  const context = {
    isIgnoringInput: false, isApplyingStyles: false, isComposing: false,
    editor: () => root, editorPlainText: () => text,
    document: { activeElement: root },
    currentSelection: () => selection,
    setSelectionRange: jest.fn((start, end) => { selection = { start, end } }),
    highlightHtml: jest.fn(text => text),
    scheduleClampScrollOffsets: jest.fn(), postMessage: jest.fn(),
    setTimeout, clearTimeout
  }
  const script = editorHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
  vm.runInNewContext(script.slice(script.indexOf('function shouldSkipHighlighting('), script.indexOf('function setEditable(')), context)
  return { context, root, selection: () => selection, text: () => text }
}

test('restores the caret after a single-line paste crosses the highlighting cutoff', () => {
  const { context, root, selection, text } = openEditor('before after', 7)
  context.replaceSelectionWithText('x'.repeat(5000))
  expect(text()).toBe('before ' + 'x'.repeat(5000) + 'after')
  expect(selection()).toEqual({ start: 5007, end: 5007 })
  expect(context.highlightHtml).not.toHaveBeenCalled()
  expect(root.scrollTop).toBe(37)

  context.replaceSelectionWithText('!')
  expect(text()).toBe('before ' + 'x'.repeat(5000) + '!after')
  expect(selection()).toEqual({ start: 5008, end: 5008 })
})

test('restores an explicit selection in large text without rewriting HTML or taking focus', () => {
  const { context, root, selection } = openEditor('x'.repeat(5001))
  context.document.activeElement = null
  context.applyStyles({ start: 10, end: 20 }, { force: true })
  expect(selection()).toEqual({ start: 10, end: 20 })
  expect(context.highlightHtml).not.toHaveBeenCalled()
  expect(root.focus).not.toHaveBeenCalled()
  expect(root.scrollTop).toBe(37)
})

test('leaves the existing selection alone when no explicit selection is supplied', () => {
  const { context, selection } = openEditor('x'.repeat(5001), 100)
  context.applyStyles()
  expect(selection()).toEqual({ start: 100, end: 100 })
  expect(context.setSelectionRange).not.toHaveBeenCalled()
})

test('keeps highlighting and selection restoration at the existing 5000-character limit', () => {
  const { context, selection } = openEditor('x'.repeat(5000))
  context.applyStyles({ start: 10, end: 20 }, { force: true })
  expect(context.highlightHtml).toHaveBeenCalledTimes(1)
  expect(selection()).toEqual({ start: 10, end: 20 })
})
