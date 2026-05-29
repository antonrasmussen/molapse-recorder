export interface ToolbarProps {
  color: string
  width: number
  stylusOnly: boolean
  canUndo: boolean
  onColorChange: (color: string) => void
  onWidthChange: (width: number) => void
  onStylusOnlyChange: (enabled: boolean) => void
  onUndo: () => void
  onClear: () => void
}

export function Toolbar({
  color,
  width,
  stylusOnly,
  canUndo,
  onColorChange,
  onWidthChange,
  onStylusOnlyChange,
  onUndo,
  onClear,
}: ToolbarProps) {
  return (
    <header className="toolbar" role="toolbar" aria-label="Drawing tools">
      <label className="toolbar__field">
        Color
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          aria-label="Stroke color"
        />
      </label>
      <label className="toolbar__field">
        Width
        <input
          type="range"
          min={1}
          max={24}
          step={1}
          value={width}
          onChange={(e) => onWidthChange(Number(e.target.value))}
          aria-label="Stroke width"
        />
        <span className="toolbar__value">{width}px</span>
      </label>
      <label className="toolbar__field toolbar__checkbox">
        <input
          type="checkbox"
          checked={stylusOnly}
          onChange={(e) => onStylusOnlyChange(e.target.checked)}
        />
        Stylus only (ignore touch)
      </label>
      <button type="button" onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button type="button" onClick={onClear}>
        Clear
      </button>
    </header>
  )
}
