import type { Stroke } from './stroke'

export const PROJECT_VERSION = 1

export interface CanvasConfig {
  worldWidth: number
  worldHeight: number
  background: 'transparent'
}

export interface Project {
  version: number
  canvas: CanvasConfig
  strokes: Stroke[]
  createdAt: string
  /** Optional faint SVG template (Phase 6), not recorded in strokes. */
  templateSvg?: string
  templateOpacity?: number
}

export const DEFAULT_CANVAS: CanvasConfig = {
  worldWidth: 1920,
  worldHeight: 1080,
  background: 'transparent',
}

export function createEmptyProject(
  canvas: CanvasConfig = DEFAULT_CANVAS,
): Project {
  return {
    version: PROJECT_VERSION,
    canvas,
    strokes: [],
    createdAt: new Date().toISOString(),
  }
}
