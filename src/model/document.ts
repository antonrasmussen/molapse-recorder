import { createStrokeId, type Stroke } from './stroke'

/** In-memory drawing document: ordered stroke list is the history for MVP. */
export class Document {
  private _strokes: Stroke[] = []

  get strokes(): readonly Stroke[] {
    return this._strokes
  }

  get strokeCount(): number {
    return this._strokes.length
  }

  addStroke(stroke: Omit<Stroke, 'id'> & { id?: string }): Stroke {
    const complete: Stroke = {
      id: stroke.id ?? createStrokeId(),
      tool: stroke.tool,
      color: stroke.color,
      width: stroke.width,
      points: [...stroke.points],
    }
    this._strokes.push(complete)
    return complete
  }

  /** Remove and return the last stroke, if any. */
  undo(): Stroke | undefined {
    return this._strokes.pop()
  }

  clear(): void {
    this._strokes = []
  }

  /** Shallow copy of stroke data for tests and future persistence. */
  snapshot(): Stroke[] {
    return this._strokes.map((s) => ({
      ...s,
      points: s.points.map((p) => ({ ...p })),
    }))
  }
}
