import vm from 'node:vm'
import editorHtml from '../src/components/text/editor_html'

// Run the actual WebView script with just enough DOM to measure its scroll area.
function openEditor(visualHeight = 370) {
  const properties = {}
  const windowEvents = {}
  const viewportEvents = {}
  const frames = []
  const root = {
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    style: {},
    scrollTop: 0,
    focus: jest.fn(),
    blur: jest.fn(),
    contains: node => node === root,
    getBoundingClientRect: () => ({ top: 0, bottom: parseFloat(properties['--editor-viewport-height']) })
  }
  const document = {
    activeElement: root,
    getElementById: () => root,
    addEventListener: jest.fn(),
    documentElement: { scrollTop: 0, style: { setProperty: (name, value) => { properties[name] = value } } },
    body: { scrollTop: 0, style: { setProperty: jest.fn() }, classList: { toggle: jest.fn() } }
  }
  const range = {
    endContainer: root,
    cloneRange: () => range,
    collapse: jest.fn(),
    getBoundingClientRect: () => ({ width: 1, height: 24, top: 380 - root.scrollTop, bottom: 404 - root.scrollTop })
  }
  const window = {
    innerHeight: 420,
    scrollX: 0,
    scrollY: 0,
    getSelection: () => ({ rangeCount: 1, getRangeAt: () => range }),
    addEventListener: (name, callback) => { windowEvents[name] = callback },
    visualViewport: visualHeight == null ? undefined : {
      height: visualHeight,
      addEventListener: (name, callback) => { viewportEvents[name] = callback }
    }
  }
  const script = editorHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
  vm.runInNewContext(script, { window, document, requestAnimationFrame: callback => frames.push(callback), setTimeout, clearTimeout })
  const resize = () => { (window.visualViewport ? viewportEvents : windowEvents).resize(); while (frames.length) frames.shift()() }
  return { root, document, window, properties, resize, update: window.MicroBlogReactEditor.updateFromReact }
}

test('caps the scroll area to the visible iOS viewport, not the obscured WebView frame', () => {
  const { update, properties } = openEditor()
  update({ viewportHeight: 420 })
  expect(properties['--editor-viewport-height']).toBe('370px')
  // Native keyboard avoidance may already provide a smaller frame: do not subtract twice.
  update({ viewportHeight: 240 })
  expect(properties['--editor-viewport-height']).toBe('240px')
})

test('updates for keyboard/suggestions-bar changes and scrolls the caret above them', () => {
  const { update, root, window, properties, resize } = openEditor()
  update({ viewportHeight: 420 })
  window.visualViewport.height = 330
  resize()
  expect(properties['--editor-viewport-height']).toBe('330px')
  expect(root.scrollTop).toBe(86)
  expect(root.focus).not.toHaveBeenCalled()
  // Hiding the keyboard restores the height without reloading or resetting the text.
  window.visualViewport.height = 700
  resize()
  update({ viewportHeight: 700 })
  expect(properties['--editor-viewport-height']).toBe('700px')
})

test('falls back to window resize and leaves an unfocused selection alone', () => {
  const { update, document, root, window, properties, resize } = openEditor(null)
  update({ viewportHeight: 0 })
  expect(properties['--editor-viewport-height']).toBe('420px')
  document.activeElement = document.body
  window.innerHeight = 260
  resize()
  expect(properties['--editor-viewport-height']).toBe('260px')
  expect(root.scrollTop).toBe(0)
})

test('updates the initial HTML and body colors when the theme changes', () => {
  const { update, document, properties } = openEditor()
  for (const [colorScheme, backgroundColor, textColor] of [['dark', '#212936', '#E5E7EB'], ['light', '#EFEFEF', '#000000']]) {
    update({ colorScheme, backgroundColor, textColor })
    expect(properties['--editor-background']).toBe(backgroundColor)
    expect(properties['--editor-text']).toBe(textColor)
    expect(document.body.style.setProperty).toHaveBeenCalledWith('--editor-background', backgroundColor)
    expect(document.body.style.setProperty).toHaveBeenCalledWith('--editor-text', textColor)
    expect(document.documentElement.style.colorScheme).toBe(colorScheme)
    expect(document.body.style.colorScheme).toBe(colorScheme)
    expect(document.body.classList.toggle).toHaveBeenCalledWith('dark', colorScheme === 'dark')
  }
})
