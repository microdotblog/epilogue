import React from 'react'
import { PixelRatio, Platform, StyleSheet, TextInput, View } from 'react-native'
import { WebView } from 'react-native-webview'
import editorHtml from './editor_html'

export default class HighlightingText extends React.Component {
  constructor(props) {
    super(props)
    this.state = { height: 0, androidFocusProxy: Platform.OS === 'android' && !!props.autoFocus }
    this.webview = React.createRef()
    this.isReady = false
    this.hasFocus = false
    this.lastWebViewText = props.value || ''
    this.lastSelection = null
    this.lastConfig = null
    this.pendingFocus = null
    this.textRequests = new Map()
    this.nextRequestID = 0

    // Match the native colors before the HTML's first paint. Keep this source
    // stable: subsequent changes use the bridge to preserve focus and selection.
    const config = this.editorConfig()
    const theme = `--editor-background: ${config.backgroundColor}; --editor-text: ${config.textColor}; --editor-caret: ${config.textColor}; color-scheme: ${config.colorScheme};`
    this.source = {
      html: editorHtml
        .replace('<html>', `<html style="${theme}">`)
        .replace('<body>', `<body class="${config.colorScheme === 'dark' ? 'dark' : ''}" style="${theme}">`),
      baseUrl: 'https://micro.blog'
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.isReady) return
    const valueChanged = this.props.value !== prevProps.value && this.props.value !== this.lastWebViewText
    const selectionChanged = this.props.selection !== prevProps.selection &&
      this.props.selection != null && JSON.stringify(this.selection()) !== this.lastSelection
    const configChanged = JSON.stringify(this.editorConfig()) !== this.lastConfig
    const shouldFocus = !!(this.props.autoFocus && this.props.editable !== false &&
      (!prevProps.autoFocus || prevProps.editable === false))

    if (valueChanged || selectionChanged || configChanged || shouldFocus) {
      this.syncEditor({
        includeValue: valueChanged,
        includeSelection: selectionChanged,
        focus: shouldFocus || (selectionChanged && !!this.props.autoFocus),
        scrollSelectionIntoView: shouldFocus || (this.hasFocus && this.state.height !== prevState.height)
      })
    }
  }

  componentWillUnmount() {
    if (this.proxyFrame) cancelAnimationFrame(this.proxyFrame)
    this.textRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout)
      reject(new Error('Editor closed'))
    })
  }

  editorConfig() {
    const style = StyleSheet.flatten(this.props.style) || {}
    const padding = style.padding ?? 0
    const isDark = this.props.colorScheme === 'dark'
    const fontScale = this.props.allowFontScaling === false ? 1 : (this.props.fontScale || PixelRatio.getFontScale())
    const multiplier = this.props.maxFontSizeMultiplier > 0 ? Math.min(fontScale, this.props.maxFontSizeMultiplier) : fontScale
    return {
      editable: this.props.editable !== false,
      colorScheme: isDark ? 'dark' : 'light',
      backgroundColor: style.backgroundColor || (isDark ? '#212936' : '#EFEFEF'),
      textColor: style.color || (isDark ? '#E5E7EB' : '#000000'),
      fontSize: (style.fontSize || 17) * multiplier,
      lineHeight: style.lineHeight ? style.lineHeight * multiplier : undefined,
      paddingTop: style.paddingTop ?? padding,
      paddingRight: style.paddingRight ?? padding,
      paddingBottom: style.paddingBottom ?? padding,
      paddingLeft: style.paddingLeft ?? padding,
      viewportHeight: this.state.height
    }
  }

  selection() {
    const value = this.props.selection
    if (typeof value === 'string') {
      const [start, end] = value.trim().split(/\s+/).map(Number)
      return { start: start || 0, end: end ?? start ?? 0 }
    }
    return value || { start: 0, end: 0 }
  }

  injectJavaScript(script) {
    this.webview.current?.injectJavaScript(`${script}\ntrue;`)
  }

  syncEditor(options = {}) {
    const config = this.editorConfig()
    const payload = { ...config, ...options }
    delete payload.includeValue
    delete payload.includeSelection
    if (options.includeValue) {
      payload.value = this.props.value || ''
      this.lastWebViewText = payload.value
    }
    if (options.includeSelection) {
      payload.selection = this.selection()
      this.lastSelection = JSON.stringify(payload.selection)
    }
    this.lastConfig = JSON.stringify(config)
    if (payload.focus && config.editable) this.webview.current?.requestFocus?.()
    this.injectJavaScript(`window.MicroBlogReactEditor.updateFromReact(${JSON.stringify(payload)})`)
  }

  focus(options = {}) {
    const focusOptions = {
      focus: true,
      cursorToEnd: options.cursorToEnd === true,
      scrollSelectionIntoView: options.scrollSelectionIntoView !== false
    }
    if (!this.isReady) this.pendingFocus = focusOptions
    else this.syncEditor(focusOptions)
  }

  undo() {
    if (this.isReady && this.props.editable !== false) this.injectJavaScript('window.MicroBlogReactEditor.undo()')
  }

  redo() {
    if (this.isReady && this.props.editable !== false) this.injectJavaScript('window.MicroBlogReactEditor.redo()')
  }

  // Typing notifications are batched. Read the WebView before submitting instead
  // of relying on the last notification or an asynchronous draft-storage write.
  getText() {
    if (!this.isReady) return Promise.reject(new Error('Editor is not ready'))
    const requestID = ++this.nextRequestID
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.textRequests.delete(requestID)
        reject(new Error('Could not read editor text'))
      }, 2000)
      this.textRequests.set(requestID, { resolve, reject, timeout })
      this.injectJavaScript(`window.ReactNativeWebView.postMessage(JSON.stringify({type:"snapshot",payload:{requestID:${requestID},text:window.MicroBlogReactEditor.getMarkdown()}}))`)
    })
  }

  handleLayout = (event) => {
    const height = event.nativeEvent.layout.height
    if (height !== this.state.height) this.setState({ height })
  }

  handleMessage = (event) => {
    let message
    try { message = JSON.parse(event.nativeEvent.data) }
    catch { return }

    if (message.type === 'ready') {
      this.isReady = true
      this.syncEditor({
        includeValue: true,
        includeSelection: this.props.selection != null,
        focus: !!this.props.autoFocus,
        cursorToEnd: !!this.props.autoFocus && this.props.selection == null,
        scrollSelectionIntoView: !!this.props.autoFocus
      })
      if (this.pendingFocus) {
        this.syncEditor(this.pendingFocus)
        this.pendingFocus = null
      }
      if (this.state.androidFocusProxy) {
        this.proxyFrame = requestAnimationFrame(() => this.setState({ androidFocusProxy: false }))
      }
    }
    else if (message.type === 'change') {
      this.lastWebViewText = message.payload.text
      this.lastSelection = JSON.stringify(message.payload.selection)
      this.props.onChangeText?.(message.payload.text)
    }
    else if (message.type === 'selection') {
      this.lastSelection = JSON.stringify(message.payload)
      this.props.onSelectionChange?.({ nativeEvent: { selection: message.payload } })
    }
    else if (message.type === 'focus' || message.type === 'blur') {
      this.hasFocus = message.type === 'focus'
    }
    else if (message.type === 'snapshot') {
      const request = this.textRequests.get(message.payload.requestID)
      if (request) {
        clearTimeout(request.timeout)
        this.textRequests.delete(message.payload.requestID)
        request.resolve(message.payload.text)
      }
    }
  }

  shouldStartLoad = ({ url }) => {
    return url === 'about:blank' || url === 'https://micro.blog' || url === 'https://micro.blog/'
  }

  render() {
    const config = this.editorConfig()
    const containerStyle = {
      ...(StyleSheet.flatten(this.props.style) || {}),
      padding: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
      backgroundColor: config.backgroundColor
    }
    for (const key of ['fontSize', 'lineHeight', 'color', 'textAlignVertical', 'justifyContent', 'alignItems']) {
      delete containerStyle[key]
    }
    return (
      <View onLayout={this.handleLayout} style={containerStyle}>
        {this.state.androidFocusProxy && this.props.autoFocus && (
          <TextInput
            style={styles.focusProxy}
            autoFocus={true}
            caretHidden={true}
            importantForAutofill="no"
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
          />
        )}
        <WebView
          ref={this.webview}
          source={this.source}
          originWhitelist={['https://micro.blog', 'about:blank']}
          javaScriptEnabled={true}
          domStorageEnabled={false}
          hideKeyboardAccessoryView={true}
          keyboardDisplayRequiresUserAction={false}
          setSupportMultipleWindows={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          onMessage={this.handleMessage}
          onShouldStartLoadWithRequest={this.shouldStartLoad}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          bounces={false}
          scrollEnabled={this.props.scrollEnabled !== false}
          allowsLinkPreview={false}
          style={[styles.webview, { backgroundColor: config.backgroundColor }]}
          containerStyle={{ backgroundColor: config.backgroundColor }}
          overScrollMode="never"
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
  focusProxy: { position: 'absolute', width: 1, height: 1, opacity: 0 }
})
