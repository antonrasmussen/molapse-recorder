import { useCallback, useMemo, useState } from 'react'
import { Document } from './model/document'
import { CanvasStage } from './ui/CanvasStage'
import { Toolbar } from './ui/Toolbar'
import './App.css'

const DEFAULT_COLOR = '#ffffff'
const DEFAULT_WIDTH = 4

function penCapable(): boolean {
  return typeof window !== 'undefined' && 'PointerEvent' in window
}

export default function App() {
  const document = useMemo(() => new Document(), [])
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [stylusOnly, setStylusOnly] = useState(() => penCapable())
  const [revision, setRevision] = useState(0)

  const bumpDocument = useCallback(() => {
    setRevision((r) => r + 1)
  }, [])

  const handleUndo = useCallback(() => {
    document.undo()
    bumpDocument()
  }, [document, bumpDocument])

  const handleClear = useCallback(() => {
    document.clear()
    bumpDocument()
  }, [document, bumpDocument])

  return (
    <div className="app">
      <Toolbar
        color={color}
        width={width}
        stylusOnly={stylusOnly}
        canUndo={document.strokeCount > 0}
        onColorChange={setColor}
        onWidthChange={setWidth}
        onStylusOnlyChange={setStylusOnly}
        onUndo={handleUndo}
        onClear={handleClear}
      />
      <CanvasStage
        color={color}
        width={width}
        stylusOnly={stylusOnly}
        document={document}
        revision={revision}
        onDocumentChange={bumpDocument}
      />
    </div>
  )
}
