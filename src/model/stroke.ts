/** A single sampled point on a stroke in world-space coordinates. */
export interface Point {
  x: number
  y: number
  /** Milliseconds since the stroke started. */
  t: number
  pressure: number
}

export type StrokeTool = 'pen'

/** A completed stroke stored in world space. */
export interface Stroke {
  id: string
  tool: StrokeTool
  color: string
  width: number
  /** Ms from session start when this stroke began (for replay timeline). */
  startTime: number
  points: Point[]
}

export function createStrokeId(): string {
  return crypto.randomUUID()
}
