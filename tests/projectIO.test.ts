import { describe, expect, it } from 'vitest'
import { Document } from '../src/model/document'
import {
  documentToProject,
  loadDocumentFromProject,
  parseProject,
  serializeProject,
} from '../src/persistence/projectIO'

describe('projectIO', () => {
  const sampleJson = `{
    "version": 1,
    "canvas": { "worldWidth": 800, "worldHeight": 600, "background": "transparent" },
    "strokes": [{
      "id": "a",
      "tool": "pen",
      "color": "#ffffff",
      "width": 4,
      "startTime": 0,
      "points": [{ "x": 1, "y": 2, "t": 0, "pressure": 0.5 }]
    }],
    "createdAt": "2026-05-28T12:00:00Z"
  }`

  it('round-trips JSON', () => {
    const parsed = parseProject(sampleJson)
    const again = parseProject(serializeProject(parsed))
    expect(again.strokes[0].points[0].x).toBe(1)
    expect(again.canvas.worldWidth).toBe(800)
  })

  it('loads into document', () => {
    const project = parseProject(sampleJson)
    const doc = new Document()
    loadDocumentFromProject(doc, project)
    expect(doc.strokeCount).toBe(1)
    expect(doc.strokes[0].id).toBe('a')
  })

  it('documentToProject preserves strokes', () => {
    const doc = new Document()
    doc.addStroke({
      tool: 'pen',
      color: '#fff',
      width: 2,
      startTime: 10,
      points: [{ x: 5, y: 5, t: 0, pressure: 0.5 }],
    })
    const project = documentToProject(doc, {
      worldWidth: 1920,
      worldHeight: 1080,
      background: 'transparent',
    })
    expect(project.strokes).toHaveLength(1)
    expect(project.version).toBe(1)
  })

  it('rejects unsupported version', () => {
    expect(() => parseProject('{"version":99,"strokes":[]}')).toThrow()
  })
})
