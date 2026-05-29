# Video editor validation checklist

Manual QA after exporting a PNG sequence or encoded alpha video.

## PNG image sequence (canonical)

1. Export at 1920×1080 from the app.
2. In **DaVinci Resolve**: Media → import numbered PNGs → enable alpha / interpret as image sequence.
3. In **Premiere Pro**: File → Import → select first frame → check Image Sequence.
4. In **Final Cut Pro**: Import as image sequence or via compound clip workflow.
5. Confirm transparency over a colored background layer.

## ProRes 4444 / WebM (optional encoder)

```bash
node encoder/cli.mjs --frames ./exports/demo/frames --name demo --fps 30 --out ./exports/demo
```

1. `ffprobe -show_streams demo_prores4444.mov` — expect `yuva444p10le` or similar alpha pix_fmt.
2. Import `.mov` or `.webm` over footage; verify edges are not pre-multiplied incorrectly.

## Pass criteria

- No black matte where transparency is expected.
- Final frame matches the completed drawing.
- Deleting a stroke and re-exporting does not require redrawing other strokes.
