import vm from 'node:vm'
import editorHtml from '../src/components/text/editor_html'

// Exercise the real history functions and event listeners with a plain-text DOM.
function openEditor(text = 'draft', start = text.length, end = start, userAgent = 'iPhone') {
  let selection = { start, end }
  const events = {}
  const root = {
    scrollTop: 37, contains: node => node === root,
    addEventListener: (name, listener) => { events[name] = listener },
    setAttribute: jest.fn(), style: {}, blur: jest.fn()
  }
  for (const property of ['textContent', 'innerHTML']) {
    Object.defineProperty(root, property, {
      get: () => text,
      set: value => { text = value; selection = { start: 0, end: 0 } }
    })
  }
  const document = {
    activeElement: root, addEventListener: jest.fn(),
    documentElement: { style: { setProperty: jest.fn() } },
    body: { style: { setProperty: jest.fn() }, classList: { toggle: jest.fn() } }
  }
  root.focus = jest.fn(() => { document.activeElement = root })
  const context = {
    isIgnoringInput: false, isApplyingStyles: false, isComposing: false, isEditable: true,
    undoStack: [], redoStack: [], undoTimer: null, undoDelay: 1000, undoMaxSize: 50,
    historyText: '', historySelection: null, pendingHistoryCheckpoint: false, caretTimer: null,
    changeTimer: null, selectionTimer: null, lastText: '', didApplyInitialValue: false,
    editor: () => root, editorPlainText: () => text, currentSelection: () => selection,
    setSelectionRange: jest.fn((start, end) => { selection = { start, end } }),
    highlightHtml: jest.fn(text => text), hasTrailingMarker: () => false,
    markdownCharacters: [' ', '*', '_'],
    scrollSelectionIntoView: jest.fn(), scheduleClampScrollOffsets: jest.fn(),
    clampScrollOffsets: jest.fn(), handleViewportResize: jest.fn(), updateViewportHeight: jest.fn(),
    moveCursorToEnd: () => { selection = { start: text.length, end: text.length } },
    postMessage: jest.fn(), document, navigator: { userAgent },
    window: { addEventListener: jest.fn() },
    requestAnimationFrame: callback => callback(), setTimeout, clearTimeout
  }
  const script = editorHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
  vm.runInNewContext(script.slice(script.indexOf('function shouldSkipHighlighting('), script.indexOf('window.MicroBlogReactEditor =')), context)
  context.resetHistory()
  context.didApplyInitialValue = true
  context.setup()
  function event(name, properties = {}) {
    const value = { preventDefault: jest.fn(), ...properties }
    events[name](value)
    return value
  }
  function type(value, inputType = 'insertText') {
    const before = event('beforeinput', { inputType, data: value })
    if (!before.preventDefault.mock.calls.length) {
      const position = selection.start + value.length
      root.textContent = text.slice(0, selection.start) + value + text.slice(selection.end)
      selection = { start: position, end: position }
      event('input', { inputType, data: value })
    }
  }
  return {
    context, root, document, event, type,
    text: () => text, selection: () => selection,
    select: (start, end = start) => { selection = { start, end } }
  }
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

test('undoes highlighted typing before the delayed snapshot and restores it with Redo', () => {
  const editor = openEditor()
  editor.type(' **bold**')
  expect(editor.context.highlightHtml).toHaveBeenCalled()
  editor.context.undo()
  expect(editor.text()).toBe('draft')
  expect(editor.selection()).toEqual({ start: 5, end: 5 })
  editor.context.redo()
  expect(editor.text()).toBe('draft **bold**')
  expect(editor.selection()).toEqual({ start: 14, end: 14 })
  expect(editor.context.postMessage).toHaveBeenCalledWith('change', {
    text: 'draft **bold**', selection: { start: 14, end: 14 }
  })
  expect(editor.context.scrollSelectionIntoView).toHaveBeenCalled()
  expect(editor.root.scrollTop).toBe(37)
})

test('groups continuous typing but separates pauses and sentence checkpoints', () => {
  const editor = openEditor('')
  editor.type('One')
  jest.advanceTimersByTime(400)
  editor.type(' word')
  jest.advanceTimersByTime(1000)
  editor.type('.')
  editor.type(' Two')
  editor.context.undo()
  expect(editor.text()).toBe('One word.')
  editor.context.undo()
  expect(editor.text()).toBe('One word')
  editor.context.undo()
  expect(editor.text()).toBe('')
  editor.context.undo()
  expect(editor.text()).toBe('')
})

test('clears Redo immediately on a new edit, before the typing timer fires', () => {
  const editor = openEditor()
  editor.type(' old')
  jest.advanceTimersByTime(1000)
  editor.context.undo()
  editor.type(' new')
  editor.context.redo()
  expect(editor.text()).toBe('draft new')
  jest.advanceTimersByTime(1000)
  editor.context.undo()
  expect(editor.text()).toBe('draft')
  editor.context.redo()
  expect(editor.text()).toBe('draft new')
})

test('preserves the replaced selection and keeps a multiline paste as one edit', () => {
  const editor = openEditor('before after', 7, 12)
  editor.event('paste', { clipboardData: { getData: () => '**pasted**\r\nsecond line\n' } })
  expect(editor.text()).toBe('before **pasted**\nsecond line\n')
  editor.context.undo()
  jest.runOnlyPendingTimers()
  expect(editor.text()).toBe('before after')
  expect(editor.selection()).toEqual({ start: 7, end: 12 })
  editor.context.redo()
  expect(editor.text()).toBe('before **pasted**\nsecond line\n')
  expect(editor.selection()).toEqual({ start: editor.text().length, end: editor.text().length })
})

test('keeps iOS Return separate from typing and cancels its deferred caret move on Undo', () => {
  const editor = openEditor()
  editor.type(' words')
  editor.type('\n', 'insertParagraph')
  editor.context.undo()
  jest.runOnlyPendingTimers()
  expect(editor.text()).toBe('draft words')
  expect(editor.selection()).toEqual({ start: 11, end: 11 })
  editor.context.undo()
  expect(editor.text()).toBe('draft')
})

test('records Android Return even when the fallback insertion emits no input event', () => {
  const editor = openEditor('draft', 5, 5, 'Android')
  editor.context.insertLineBreakInPlace = () => {
    editor.root.textContent = 'draft\n'
    editor.select(6)
    return true
  }
  editor.context.document.execCommand = () => false
  editor.type('\n', 'insertLineBreak')
  editor.context.undo()
  expect(editor.text()).toBe('draft')
  editor.context.redo()
  expect(editor.text()).toBe('draft\n')
})

test.each(['insertReplacementText', 'deleteByCut', 'deleteContentBackward'])(
  'restores a selection replacement through %s', inputType => {
    const editor = openEditor('before after', 7, 12)
    editor.type(inputType === 'insertReplacementText' ? 'fixed' : '', inputType)
    editor.context.undo()
    expect(editor.text()).toBe('before after')
    expect(editor.selection()).toEqual({ start: 7, end: 12 })
  }
)

test('records a whole IME composition, not intermediate candidates', () => {
  const editor = openEditor('')
  editor.event('compositionstart')
  editor.type('日', 'insertCompositionText')
  jest.advanceTimersByTime(2000)
  editor.context.undo()
  expect(editor.text()).toBe('日')
  editor.select(0, 1)
  editor.type('日本', 'insertCompositionText')
  editor.event('compositionend')
  editor.context.undo()
  expect(editor.text()).toBe('')
  editor.context.redo()
  expect(editor.text()).toBe('日本')
})

test('starts a new typing group after the caret moves', () => {
  const editor = openEditor()
  editor.type(' end')
  editor.select(0)
  editor.type('start ')
  editor.context.undo()
  expect(editor.text()).toBe('draft end')
  expect(editor.selection()).toEqual({ start: 0, end: 0 })
  editor.context.undo()
  expect(editor.text()).toBe('draft')
})

test('loading another draft resets history, but React text echoes and themes do not', () => {
  const editor = openEditor()
  editor.type(' typed')
  editor.context.updateFromReact({ value: 'draft typed', colorScheme: 'dark' })
  editor.context.undo()
  expect(editor.text()).toBe('draft')
  editor.context.updateFromReact({ value: 'Another draft', cursorToEnd: true })
  jest.runOnlyPendingTimers()
  editor.context.undo()
  editor.context.redo()
  expect(editor.text()).toBe('Another draft')
  editor.type(' edited')
  editor.context.undo()
  expect(editor.text()).toBe('Another draft')
})

test('works above the highlighting cutoff without taking focus', () => {
  const editor = openEditor('x'.repeat(5001), 10, 20)
  editor.document.activeElement = editor.document.body
  editor.context.replaceSelectionWithText('paste')
  editor.context.undo()
  expect(editor.text()).toBe('x'.repeat(5001))
  expect(editor.selection()).toEqual({ start: 10, end: 20 })
  expect(editor.root.focus).not.toHaveBeenCalled()
})

test('bounds history to 50 snapshots', () => {
  const editor = openEditor('')
  for (let i = 0; i < 70; i++) editor.context.replaceSelectionWithText('x')
  expect(editor.context.undoStack).toHaveLength(50)
  for (let i = 0; i < 70; i++) editor.context.undo()
  expect(editor.text()).toBe('x'.repeat(21))
  for (let i = 0; i < 70; i++) editor.context.redo()
  expect(editor.text()).toBe('x'.repeat(70))
  expect(editor.context.undoStack.length).toBeLessThanOrEqual(50)
})

test.each([
  { key: 'z', metaKey: true },
  { key: 'z', ctrlKey: true }
])('handles the keyboard Undo shortcut %j', shortcut => {
  const editor = openEditor()
  editor.type(' typed')
  expect(editor.event('keydown', shortcut).preventDefault).toHaveBeenCalled()
  expect(editor.text()).toBe('draft')
  editor.event('keydown', { ...shortcut, key: 'Z', shiftKey: true })
  expect(editor.text()).toBe('draft typed')
})

test('handles Ctrl-Y and native history input events without double recording', () => {
  const editor = openEditor()
  editor.type(' typed')
  expect(editor.event('beforeinput', { inputType: 'historyUndo' }).preventDefault).toHaveBeenCalled()
  expect(editor.text()).toBe('draft')
  editor.event('keydown', { key: 'y', ctrlKey: true })
  expect(editor.text()).toBe('draft typed')
  editor.event('beforeinput', { inputType: 'historyUndo' })
  editor.event('beforeinput', { inputType: 'historyRedo' })
  expect(editor.text()).toBe('draft typed')
  editor.context.undo()
  expect(editor.text()).toBe('draft')
})

test('does not alter a read-only editor', () => {
  const editor = openEditor()
  editor.type(' typed')
  editor.context.undo()
  editor.context.setEditable(false)
  editor.context.redo()
  editor.context.replaceSelectionWithText('paste')
  expect(editor.text()).toBe('draft')
})
