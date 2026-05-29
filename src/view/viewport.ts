/** Display-only pan/zoom; recorded strokes stay in world space. */
export interface ViewportState {
  panX: number
  panY: number
  scale: number
}

export const DEFAULT_VIEWPORT: ViewportState = {
  panX: 0,
  panY: 0,
  scale: 1,
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: ViewportState,
): { x: number; y: number } {
  return {
    x: worldX * viewport.scale + viewport.panX,
    y: worldY * viewport.scale + viewport.panY,
  }
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
): { x: number; y: number } {
  const scale = viewport.scale === 0 ? 1 : viewport.scale
  return {
    x: (screenX - viewport.panX) / scale,
    y: (screenY - viewport.panY) / scale,
  }
}

/** Apply viewport transform to a 2D canvas context (world -> screen). */
export function applyViewportToContext(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
): void {
  ctx.setTransform(viewport.scale, 0, 0, viewport.scale, viewport.panX, viewport.panY)
}

/**
 * Pan so the world point under (screenX, screenY) stays fixed after scale change.
 */
export function zoomAtScreen(
  viewport: ViewportState,
  screenX: number,
  screenY: number,
  newScale: number,
): ViewportState {
  const world = screenToWorld(screenX, screenY, viewport)
  return {
    scale: newScale,
    panX: screenX - world.x * newScale,
    panY: screenY - world.y * newScale,
  }
}

export function clampScale(scale: number, min = 0.1, max = 8): number {
  return Math.min(max, Math.max(min, scale))
}
