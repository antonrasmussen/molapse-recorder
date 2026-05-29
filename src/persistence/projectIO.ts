import { Document } from '../model/document'
import {
  createEmptyProject,
  DEFAULT_CANVAS,
  PROJECT_VERSION,
  type CanvasConfig,
  type Project,
} from '../model/project'
import type { Stroke } from '../model/stroke'

export class ProjectIOError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectIOError'
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function parsePoint(raw: unknown): Stroke['points'][0] {
  if (!isRecord(raw)) {
    throw new ProjectIOError('Invalid point')
  }
  const { x, y, t, pressure } = raw
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof t !== 'number' ||
    typeof pressure !== 'number'
  ) {
    throw new ProjectIOError('Point must have numeric x, y, t, pressure')
  }
  return { x, y, t, pressure }
}

function parseStroke(raw: unknown, index: number): Stroke {
  if (!isRecord(raw)) {
    throw new ProjectIOError(`Invalid stroke at index ${index}`)
  }
  const { id, tool, color, width, points, startTime } = raw
  if (typeof id !== 'string' || tool !== 'pen' || typeof color !== 'string') {
    throw new ProjectIOError(`Invalid stroke metadata at index ${index}`)
  }
  if (typeof width !== 'number' || !Array.isArray(points)) {
    throw new ProjectIOError(`Invalid stroke at index ${index}`)
  }
  const parsedPoints = points.map(parsePoint)
  const st =
    typeof startTime === 'number'
      ? startTime
      : inferStartTime(parsedPoints, index)
  return {
    id,
    tool: 'pen',
    color,
    width,
    startTime: st,
    points: parsedPoints,
  }
}

/** Legacy projects without startTime: stack strokes with 100ms gaps. */
function inferStartTime(
  points: Stroke['points'],
  strokeIndex: number,
): number {
  if (points.length === 0) {
    return strokeIndex * 100
  }
  return strokeIndex * 500
}

function parseCanvas(raw: unknown): CanvasConfig {
  if (!isRecord(raw)) {
    return { ...DEFAULT_CANVAS }
  }
  const w = raw.worldWidth
  const h = raw.worldHeight
  return {
    worldWidth: typeof w === 'number' && w > 0 ? w : DEFAULT_CANVAS.worldWidth,
    worldHeight:
      typeof h === 'number' && h > 0 ? h : DEFAULT_CANVAS.worldHeight,
    background: 'transparent',
  }
}

export function parseProject(json: string): Project {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new ProjectIOError('Invalid JSON')
  }
  if (!isRecord(data)) {
    throw new ProjectIOError('Project must be an object')
  }
  const version = data.version
  if (version !== PROJECT_VERSION) {
    throw new ProjectIOError(
      `Unsupported project version: ${String(version)} (expected ${PROJECT_VERSION})`,
    )
  }
  if (!Array.isArray(data.strokes)) {
    throw new ProjectIOError('Project must include strokes array')
  }
  const strokes = data.strokes.map(parseStroke)
  const project: Project = {
    version: PROJECT_VERSION,
    canvas: parseCanvas(data.canvas),
    strokes,
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : new Date().toISOString(),
  }
  if (typeof data.templateSvg === 'string') {
    project.templateSvg = data.templateSvg
  }
  if (typeof data.templateOpacity === 'number') {
    project.templateOpacity = data.templateOpacity
  }
  return project
}

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function documentToProject(
  document: Document,
  canvas: CanvasConfig,
  extras?: Pick<Project, 'templateSvg' | 'templateOpacity'>,
): Project {
  return {
    version: PROJECT_VERSION,
    canvas,
    strokes: document.snapshot(),
    createdAt: new Date().toISOString(),
    ...extras,
  }
}

export function loadDocumentFromProject(
  document: Document,
  project: Project,
): void {
  document.clear()
  for (const stroke of project.strokes) {
    document.addStroke(stroke)
  }
}

export function downloadProjectJson(project: Project, filename: string): void {
  const blob = new Blob([serializeProject(project)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function openProjectFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = window.document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new ProjectIOError('No file selected'))
        return
      }
      try {
        const text = await file.text()
        resolve(parseProject(text))
      } catch (e) {
        reject(e)
      }
    }
    input.click()
  })
}

export { createEmptyProject }
