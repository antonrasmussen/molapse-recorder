import { useCallback, useEffect, useRef, useState } from 'react'
import { Document } from '../model/document'
import type { Point, Stroke } from '../model/stroke'
import {
  buildPoint,
  clientToCanvasPoint,
  samplesFromPointerEvent,
} from '../input/pointer'
import { renderStrokes } from '../render/strokeRenderer'
import {
  applyViewportToContext,
  clampScale,
  DEFAULT_VIEWPORT,
  screenToWorld,
  zoomAtScreen,
  type ViewportState,
} from '../view/viewport'

export interface CanvasStageProps {
  color: string
  width: number
  stylusOnly: boolean
  document: Document
  /** Bumped when strokes are added, undone, or cleared. */
  revision: number
  onDocumentChange: () => void
}

type ActiveStroke = Pick<Stroke, 'color' | 'width' | 'points'>

function resizeCanvasToDisplay(canvas: HTMLCanvasElement): void {
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const w = Math.max(1, Math.floor(rect.width * dpr))
  const h = Math.max(1, Math.floor(rect.height * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
}

export function CanvasStage({
  color,
  width,
  stylusOnly,
  document,
  revision,
  onDocumentChange,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<ViewportState>({ ...DEFAULT_VIEWPORT })
  const activeStrokeRef = useRef<ActiveStroke | null>(null)
  const strokeStartMsRef = useRef(0)
  const activePointerIdRef = useRef<number | null>(null)
  const panningRef = useRef<{
    pointerId: number
    lastX: number
    lastY: number
  } | null>(null)
  const [, setFrame] = useState(0)
  const bump = useCallback(() => setFrame((n) => n + 1), [])

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    applyViewportToContext(ctx, viewportRef.current)
    const strokes = document.strokes
    renderStrokes(ctx, strokes)
    const active = activeStrokeRef.current
    if (active && active.points.length > 0) {
      renderStrokes(ctx, [active])
    }
    ctx.restore()
  }, [document])

  useEffect(() => {
    paint()
  }, [paint, revision])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ro = new ResizeObserver(() => {
      resizeCanvasToDisplay(canvas)
      paint()
    })
    ro.observe(canvas)
    resizeCanvasToDisplay(canvas)
    paint()
    return () => ro.disconnect()
  }, [paint])

  const screenToWorldOnCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current!
      const screen = clientToCanvasPoint(clientX, clientY, canvas)
      return screenToWorld(screen.x, screen.y, viewportRef.current)
    },
    [],
  )

  const appendSamples = useCallback(
    (samples: { clientX: number; clientY: number; pressure: number }[]) => {
      const active = activeStrokeRef.current
      if (!active) {
        return
      }
      const now = performance.now()
      for (const s of samples) {
        const world = screenToWorldOnCanvas(s.clientX, s.clientY)
        active.points.push(
          buildPoint(
            world.x,
            world.y,
            s.pressure,
            strokeStartMsRef.current,
            now,
          ),
        )
      }
      paint()
    },
    [paint, screenToWorldOnCanvas],
  )

  const finishStroke = useCallback(() => {
    const active = activeStrokeRef.current
    activeStrokeRef.current = null
    activePointerIdRef.current = null
    if (active && active.points.length > 0) {
      document.addStroke({
        tool: 'pen',
        color: active.color,
        width: active.width,
        points: active.points as Point[],
      })
      onDocumentChange()
    }
    paint()
  }, [document, onDocumentChange, paint])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      // Middle button or Space+primary: pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault()
        panningRef.current = {
          pointerId: e.pointerId,
          lastX: e.clientX,
          lastY: e.clientY,
        }
        canvas.setPointerCapture(e.pointerId)
        return
      }

      if (e.button !== 0) {
        return
      }

      const samples = samplesFromPointerEvent(e.nativeEvent, stylusOnly)
      if (!samples) {
        e.preventDefault()
        return
      }

      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      activePointerIdRef.current = e.pointerId
      strokeStartMsRef.current = performance.now()
      activeStrokeRef.current = {
        color,
        width,
        points: [],
      }
      appendSamples(samples)
    },
    [appendSamples, color, stylusOnly, width],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const pan = panningRef.current
      if (pan && pan.pointerId === e.pointerId) {
        const dx = e.clientX - pan.lastX
        const dy = e.clientY - pan.lastY
        pan.lastX = e.clientX
        pan.lastY = e.clientY
        viewportRef.current = {
          ...viewportRef.current,
          panX: viewportRef.current.panX + dx,
          panY: viewportRef.current.panY + dy,
        }
        paint()
        return
      }

      if (activePointerIdRef.current !== e.pointerId) {
        return
      }

      const samples = samplesFromPointerEvent(e.nativeEvent, stylusOnly)
      if (!samples) {
        return
      }
      e.preventDefault()
      appendSamples(samples)
    },
    [appendSamples, paint, stylusOnly],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (panningRef.current?.pointerId === e.pointerId) {
        panningRef.current = null
        canvas?.releasePointerCapture(e.pointerId)
        return
      }
      if (activePointerIdRef.current !== e.pointerId) {
        return
      }
      canvas?.releasePointerCapture(e.pointerId)
      finishStroke()
    },
    [finishStroke],
  )

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (panningRef.current?.pointerId === e.pointerId) {
        panningRef.current = null
      }
      if (activePointerIdRef.current === e.pointerId) {
        activeStrokeRef.current = null
        activePointerIdRef.current = null
        paint()
      }
    },
    [paint],
  )

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }
      const screen = clientToCanvasPoint(e.clientX, e.clientY, canvas)
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const nextScale = clampScale(viewportRef.current.scale * factor)
      viewportRef.current = zoomAtScreen(
        viewportRef.current,
        screen.x,
        screen.y,
        nextScale,
      )
      paint()
      bump()
    },
    [bump, paint],
  )

  return (
    <div className="canvas-stage">
      <canvas
        ref={canvasRef}
        className="canvas-stage__canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onWheel={onWheel}
        style={{ touchAction: 'none' }}
        aria-label="Drawing canvas"
      />
      <p className="canvas-stage__hint">
        Draw with pen or mouse. Alt+drag or middle-click to pan. Scroll to zoom.
      </p>
    </div>
  )
}
