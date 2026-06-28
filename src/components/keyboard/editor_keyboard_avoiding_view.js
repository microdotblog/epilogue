import * as React from 'react'

export const EditorKeyboardFrameContext = React.createContext({
  height: 0,
  keyboard_height: 0,
  window_y: 0,
  window_bottom: 0
})

export default function EditorKeyboardAvoidingView({ children }) {
  return children
}
