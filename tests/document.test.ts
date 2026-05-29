import { describe, expect, it } from 'vitest'
import { Document } from '../src/model/document'

describe('Document', () => {
  it('starts empty', () => {
    const doc = new Document()
    expect(doc.strokeCount).toBe(0)
    expect(doc.strokes).toEqual([])
  })

  it('adds strokes in order', () => {
    const doc = new Document()
    const a = doc.addStroke({
      tool: 'pen',
      color: '#fff',
      width: 4,
      points: [{ x: 0, y: 0, t: 0, pressure: 0.5 }],
    })
    const b = doc.addStroke({
      tool: 'pen',
      color: '#f00',
      width: 2,
      points: [{ x: 1, y: 1, t: 0, pressure: 0.5 }],
    })
    expect(doc.strokeCount).toBe(2)
    expect(doc.strokes[0].id).toBe(a.id)
    expect(doc.strokes[1].id).toBe(b.id)
    expect(doc.strokes[1].color).toBe('#f00')
  })

  it('assigns unique ids when omitted', () => {
    const doc = new Document()
    const a = doc.addStroke({
      tool: 'pen',
      color: '#fff',
      width: 4,
      points: [],
    })
    const b = doc.addStroke({
      tool: 'pen',
      color: '#fff',
      width: 4,
      points: [],
    })
    expect(a.id).not.toBe(b.id)
  })

  it('undo removes the last stroke only', () => {
    const doc = new Document()
    doc.addStroke({
      tool: 'pen',
      color: '#fff',
      width: 4,
      points: [{ x: 0, y: 0, t: 0, pressure: 0.5 }],
    })
    const second = doc.addStroke({
      tool: 'pen',
      color: '#000',
      width: 2,
      points: [{ x: 1, y: 1, t: 0, pressure: 0.5 }],
    })
    const removed = doc.undo()
    expect(removed?.id).toBe(second.id)
    expect(doc.strokeCount).toBe(1)
    expect(doc.strokes[0].color).toBe('#fff')
    expect(doc.undo()).toBeDefined()
    expect(doc.strokeCount).toBe(0)
    expect(doc.undo()).toBeUndefined()
  })

  it('clear removes all strokes', () => {
    const doc = new Document()
    doc.addStroke({
      tool: 'pen',
      color: '#fff',
      width: 4,
      points: [{ x: 0, y: 0, t: 0, pressure: 0.5 }],
    })
    doc.clear()
    expect(doc.strokeCount).toBe(0)
  })

  it('snapshot returns a deep copy', () => {
    const doc = new Document()
    doc.addStroke({
      tool: 'pen',
      color: '#fff',
      width: 4,
      points: [{ x: 10, y: 20, t: 0, pressure: 0.5 }],
    })
    const snap = doc.snapshot()
    snap[0].points[0].x = 999
    expect(doc.strokes[0].points[0].x).toBe(10)
  })
})
