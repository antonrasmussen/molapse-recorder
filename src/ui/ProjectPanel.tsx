import type { Project } from '../model/project'
import {
  documentToProject,
  downloadProjectJson,
  loadDocumentFromProject,
  openProjectFile,
} from '../persistence/projectIO'
import { DEFAULT_CANVAS, type CanvasConfig } from '../model/project'
import type { Document } from '../model/document'

export interface ProjectPanelProps {
  document: Document
  canvasSize: CanvasConfig
  templateSvg?: string
  templateOpacity?: number
  onLoaded: (project: Project) => void
  onSave?: () => void
}

export function ProjectPanel({
  document,
  canvasSize,
  templateSvg,
  templateOpacity,
  onLoaded,
  onSave,
}: ProjectPanelProps) {
  const save = () => {
    const project = documentToProject(document, canvasSize, {
      templateSvg,
      templateOpacity,
    })
    downloadProjectJson(project, 'project.json')
    onSave?.()
  }

  const load = async () => {
    try {
      const project = await openProjectFile()
      loadDocumentFromProject(document, project)
      onLoaded(project)
    } catch (e) {
      if (e instanceof Error && e.message === 'No file selected') {
        return
      }
      alert(e instanceof Error ? e.message : 'Failed to load project')
    }
  }

  return (
    <section className="project-panel" aria-label="Project">
      <button type="button" onClick={save} disabled={document.strokeCount === 0}>
        Save project.json
      </button>
      <button type="button" onClick={load}>
        Load project.json
      </button>
    </section>
  )
}

export { DEFAULT_CANVAS }
