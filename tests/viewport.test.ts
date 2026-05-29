import { describe, expect, it, vi } from 'vitest'
import {
  applyViewportToContext,
  DEFAULT_VIEWPORT,
  screenToWorld,
  worldToScreen,
  zoomAtScreen,
} from '../src/view/viewport'

describe('viewport coordinate transforms', () => {
  it('round-trips screen and world at identity', () => {
    const vp = { ...DEFAULT_VIEWPORT }
    const world = { x: 100, y: 200 }
    const screen = worldToScreen(world.x, world.y, vp)
    const back = screenToWorld(screen.x, screen.y, vp)
    expect(back.x).toBeCloseTo(world.x)
    expect(back.y).toBeCloseTo(world.y)
  })

  it('round-trips under pan and zoom', () => {
    const vp = { panX: 50, panY: -30, scale: 2.5 }
    const world = { x: 120, y: 80 }
    const screen = worldToScreen(world.x, world.y, vp)
    const back = screenToWorld(screen.x, screen.y, vp)
    expect(back.x).toBeCloseTo(world.x)
    expect(back.y).toBeCloseTo(world.y)
  })

  it('zoomAtScreen keeps the world point under the cursor fixed', () => {
    const vp = { panX: 0, panY: 0, scale: 1 }
    const screenX = 400
    const screenY = 300
    const worldBefore = screenToWorld(screenX, screenY, vp)
    const next = zoomAtScreen(vp, screenX, screenY, 2)
    const worldAfter = screenToWorld(screenX, screenY, next)
    expect(worldAfter.x).toBeCloseTo(worldBefore.x)
    expect(worldAfter.y).toBeCloseTo(worldBefore.y)
  })
})

describe('stroke world coordinates invariant under viewport changes', () => {
  /** Simulates storing a stroke point in world space at draw time. */
  function recordPointAtScreen(
    screenX: number,
    screenY: number,
    viewport: { panX: number; panY: number; scale: number },
  ) {
    return screenToWorld(screenX, screenY, viewport)
  }

  it('does not change stored world coords when viewport pans and zooms later', () => {
    const vpAtDraw = { panX: 0, panY: 0, scale: 1 }
    const stored = recordPointAtScreen(150, 250, vpAtDraw)

    const vpAfterPanZoom = { panX: 120, panY: -80, scale: 2.2 }
    const screenAfter = worldToScreen(stored.x, stored.y, vpAfterPanZoom)
    const reread = screenToWorld(screenAfter.x, screenAfter.y, vpAfterPanZoom)

    expect(reread.x).toBeCloseTo(stored.x)
    expect(reread.y).toBeCloseTo(stored.y)
    expect(stored.x).toBeCloseTo(150)
    expect(stored.y).toBeCloseTo(250)
  })

  it('new strokes after pan use the same world space as earlier strokes', () => {
    const vp1 = { panX: 0, panY: 0, scale: 1 }
    const firstStrokePoint = recordPointAtScreen(100, 100, vp1)

    const vp2 = { panX: 200, panY: 100, scale: 1.5 }
    const secondStrokePoint = recordPointAtScreen(
      worldToScreen(200, 150, vp2).x,
      worldToScreen(200, 150, vp2).y,
      vp2,
    )

    expect(firstStrokePoint.x).toBeCloseTo(100)
    expect(secondStrokePoint.x).toBeCloseTo(200)
    expect(secondStrokePoint.y).toBeCloseTo(150)
  })
})

describe('applyViewportToContext', () => {
  it('sets canvas transform from viewport pan and scale', () => {
    const setTransform = vi.fn()
    const ctx = { setTransform } as unknown as CanvasRenderingContext2D
    applyViewportToContext(ctx, { panX: 40, panY: 60, scale: 2 })
    expect(setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 40, 60)
  })
})
