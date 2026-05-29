import type { Point } from '../model/stroke'

const DEFAULT_PRESSURE = 0.5

/** Normalize pointer pressure; use a sensible default when missing or zero. */
export function normalizePressure(
  raw: number | undefined,
  pointerType: string,
): number {
  if (raw !== undefined && Number.isFinite(raw) && raw > 0) {
    return Math.min(1, raw)
  }
  if (pointerType === 'pen') {
    return DEFAULT_PRESSURE
  }
  return DEFAULT_PRESSURE
}

/** Coalesced pointer events when supported (Safari may lack this). */
export function getCoalescedPointerEvents(event: PointerEvent): PointerEvent[] {
  if (typeof event.getCoalescedEvents === 'function') {
    const coalesced = event.getCoalescedEvents()
    if (coalesced.length > 0) {
      return coalesced
    }
  }
  return [event]
}

export function shouldIgnorePointer(
  event: PointerEvent,
  stylusOnly: boolean,
): boolean {
  if (!stylusOnly) {
    return false
  }
  return event.pointerType === 'touch'
}

export interface PointerSample {
  clientX: number
  clientY: number
  pressure: number
  pointerType: string
}

export function samplesFromPointerEvent(
  event: PointerEvent,
  stylusOnly: boolean,
): PointerSample[] | null {
  if (shouldIgnorePointer(event, stylusOnly)) {
    return null
  }
  return getCoalescedPointerEvents(event).map((e) => ({
    clientX: e.clientX,
    clientY: e.clientY,
    pressure: normalizePressure(e.pressure, e.pointerType),
    pointerType: e.pointerType,
  }))
}

export function clientToCanvasPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

export function buildPoint(
  worldX: number,
  worldY: number,
  pressure: number,
  strokeStartMs: number,
  nowMs: number,
): Point {
  return {
    x: worldX,
    y: worldY,
    t: Math.max(0, nowMs - strokeStartMs),
    pressure,
  }
}
