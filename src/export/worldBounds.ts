import type { Stroke } from '../model/stroke'

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const PADDING = 40

export function computeStrokeBounds(strokes: readonly Pick<Stroke, 'points'>[]): Bounds | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const stroke of strokes) {
    for (const p of stroke.points) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
  }
  if (!Number.isFinite(minX)) {
    return null
  }
  return { minX, minY, maxX, maxY }
}

export interface FitTransform {
  scale: number
  offsetX: number
  offsetY: number
}

/** Fit stroke bounds into export width/height with padding. */
export function fitBoundsToCanvas(
  bounds: Bounds,
  width: number,
  height: number,
  padding = PADDING,
): FitTransform {
  const bw = bounds.maxX - bounds.minX || 1
  const bh = bounds.maxY - bounds.minY || 1
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const scale = Math.min(innerW / bw, innerH / bh)
  const offsetX =
    padding + (innerW - bw * scale) / 2 - bounds.minX * scale
  const offsetY =
    padding + (innerH - bh * scale) / 2 - bounds.minY * scale
  return { scale, offsetX, offsetY }
}

export function transformPoint(
  p: { x: number; y: number },
  fit: FitTransform,
): { x: number; y: number } {
  return {
    x: p.x * fit.scale + fit.offsetX,
    y: p.y * fit.scale + fit.offsetY,
  }
}

export function transformStroke<T extends { points: { x: number; y: number }[] }>(
  stroke: T,
  fit: FitTransform,
): T {
  return {
    ...stroke,
    points: stroke.points.map((p) => ({
      ...p,
      ...transformPoint(p, fit),
    })),
  }
}
