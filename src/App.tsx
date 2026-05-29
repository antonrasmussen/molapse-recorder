import { useCallback, useMemo, useState } from 'react'
import { Document } from './model/document'
import { DEFAULT_CANVAS, type CanvasConfig, type Project } from './model/project'
import { documentToProject } from './persistence/projectIO'
import { buildReplayFrames } from './render/replay'
import { CanvasStage } from './ui/CanvasStage'
import { ExportPanel } from './ui/ExportPanel'
import { ProjectPanel } from './ui/ProjectPanel'
import { ReplayControls } from './ui/ReplayControls'
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
  const [canvasSize, setCanvasSize] = useState<CanvasConfig>({ ...DEFAULT_CANVAS })
  const [templateSvg, setTemplateSvg] = useState<string | undefined>()
  const [templateOpacity, setTemplateOpacity] = useState(0.25)
  const [replayFrameIndex, setReplayFrameIndex] = useState<number | null>(null)

  const bumpDocument = useCallback(() => {
    setRevision((r) => r + 1)
  }, [])

  const project: Project = useMemo(
    () =>
      documentToProject(document, canvasSize, {
        templateSvg,
        templateOpacity,
      }),
    [document, canvasSize, templateSvg, templateOpacity, revision],
  )

  const replayStrokes = useMemo(() => {
    if (replayFrameIndex === null || project.strokes.length === 0) {
      return null
    }
    const frames = buildReplayFrames(project)
    const idx = Math.min(replayFrameIndex, frames.length - 1)
    return frames[idx]?.strokes ?? null
  }, [replayFrameIndex, project])

  const handleUndo = useCallback(() => {
    document.undo()
    setReplayFrameIndex(null)
    bumpDocument()
  }, [document, bumpDocument])

  const handleClear = useCallback(() => {
    document.clear()
    setReplayFrameIndex(null)
    bumpDocument()
  }, [document, bumpDocument])

  const handleProjectLoaded = useCallback((loaded: Project) => {
    setCanvasSize(loaded.canvas)
    setTemplateSvg(loaded.templateSvg)
    setTemplateOpacity(loaded.templateOpacity ?? 0.25)
    setReplayFrameIndex(null)
    bumpDocument()
  }, [bumpDocument])

  const handleDrawStart = useCallback(() => {
    setReplayFrameIndex(null)
  }, [])

  const loadTemplateSvg = useCallback(async () => {
    const input = window.document.createElement('input')
    input.type = 'file'
    input.accept = 'image/svg+xml,.svg'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setTemplateSvg(await file.text())
    }
    input.click()
  }, [])

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
      <div className="app__body">
        <aside className="app__sidebar">
          <ProjectPanel
            document={document}
            canvasSize={canvasSize}
            templateSvg={templateSvg}
            templateOpacity={templateOpacity}
            onLoaded={handleProjectLoaded}
          />
          <ReplayControls
            project={project.strokes.length > 0 ? project : null}
            onFrameChange={(idx) => setReplayFrameIndex(idx)}
          />
          <ExportPanel project={project.strokes.length > 0 ? project : null} />
          <section className="template-panel">
            <h2 className="export-panel__title">Template (optional)</h2>
            <button type="button" onClick={loadTemplateSvg}>
              Load SVG template
            </button>
            {templateSvg && (
              <button type="button" onClick={() => setTemplateSvg(undefined)}>
                Clear template
              </button>
            )}
          </section>
        </aside>
        <CanvasStage
          color={color}
          width={width}
          stylusOnly={stylusOnly}
          document={document}
          revision={revision}
          onDocumentChange={bumpDocument}
          replayStrokes={replayStrokes}
          templateSvg={templateSvg}
          templateOpacity={templateOpacity}
          onDrawStart={handleDrawStart}
        />
      </div>
    </div>
  )
}
