import { describe, expect, it } from 'vitest'
import {
  buildReplayFrames,
  frameCount,
  isMonotonicReveal,
  totalDurationMs,
} from '../src/render/replay'
import type { Project } from '../src/model/project'

function sampleProject(): Project {
  return {
    version: 1,
    canvas: { worldWidth: 1920, worldHeight: 1080, background: 'transparent' },
    createdAt: '2026-01-01T00:00:00Z',
    strokes: [
      {
        id: 's1',
        tool: 'pen',
        color: '#fff',
        width: 4,
        startTime: 0,
        points: [
          { x: 0, y: 0, t: 0, pressure: 0.5 },
          { x: 100, y: 0, t: 500, pressure: 0.5 },
        ],
      },
      {
        id: 's2',
        tool: 'pen',
        color: '#fff',
        width: 4,
        startTime: 5000,
        points: [
          { x: 200, y: 0, t: 0, pressure: 0.5 },
          { x: 300, y: 0, t: 300, pressure: 0.5 },
        ],
      },
    ],
  }
}

describe('replay', () => {
  it('computes frame count from duration and fps', () => {
    expect(frameCount(2000, 30)).toBe(60)
    expect(frameCount(0, 30)).toBe(1)
  })

  it('clamps idle gap between strokes', () => {
    const project = sampleProject()
    const duration = totalDurationMs(project.strokes, 500)
    expect(duration).toBeLessThan(6000)
  })

  it('produces monotonic reveal', () => {
    const frames = buildReplayFrames(sampleProject(), {
      fps: 10,
      maxIdleGapMs: 500,
    })
    expect(frames.length).toBeGreaterThan(1)
    expect(isMonotonicReveal(frames)).toBe(true)
  })

  it('final frame shows all points', () => {
    const project = sampleProject()
    const frames = buildReplayFrames(project, { fps: 10, maxIdleGapMs: 500 })
    const last = frames[frames.length - 1]
    const totalPoints = project.strokes.reduce(
      (n, s) => n + s.points.length,
      0,
    )
    const visiblePoints = last.strokes.reduce((n, s) => n + s.points.length, 0)
    expect(visiblePoints).toBeGreaterThanOrEqual(totalPoints)
  })
})
