import { describe, expect, it } from 'vitest'
import {
  normalizePressure,
  shouldIgnorePointer,
} from '../src/input/pointer'

describe('pointer input', () => {
  it('normalizes valid pressure to 0..1', () => {
    expect(normalizePressure(0.8, 'pen')).toBe(0.8)
    expect(normalizePressure(1.5, 'pen')).toBe(1)
    expect(normalizePressure(-0.1, 'pen')).toBe(0.5)
  })

  it('uses default pressure when missing or zero', () => {
    expect(normalizePressure(0, 'pen')).toBe(0.5)
    expect(normalizePressure(undefined, 'pen')).toBe(0.5)
    expect(normalizePressure(undefined, 'mouse')).toBe(0.5)
  })

  it('ignores touch when stylus-only is enabled', () => {
    expect(shouldIgnorePointer({ pointerType: 'touch' } as PointerEvent, true)).toBe(
      true,
    )
    expect(shouldIgnorePointer({ pointerType: 'pen' } as PointerEvent, true)).toBe(
      false,
    )
    expect(shouldIgnorePointer({ pointerType: 'touch' } as PointerEvent, false)).toBe(
      false,
    )
  })
})
