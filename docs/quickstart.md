# Quickstart

## Install and run

```bash
git clone https://github.com/antonrasmussen/molapse-recorder.git
cd molapse-recorder
npm install
npm run dev
```

Open the local URL in **Chrome** (best folder export) or any modern browser (zip fallback).

## Workflow

1. Draw on the transparent canvas (stylus or mouse).
2. Enable **Stylus only** on iPad to ignore palm touches.
3. **Save project.json** — portable stroke data for re-export on desktop.
4. **Play / scrub** replay to preview the timelapse.
5. **Export PNG sequence** at 1080p or 4K (canonical output for editors).
6. Optionally run **MP4 preview** in-browser or use the [local encoder](../encoder/README.md) for ProRes/WebM.

## Pan and zoom

- **Alt + drag** or **middle-click drag** to pan (display only; strokes stay in world space).
- **Scroll** to zoom.

## Capture on iPad, export on desktop

Safari may zip 1080p frames instead of writing a folder. For heavy 4K batches, save `project.json` on iPad and export on a desktop browser or encode with FFmpeg locally.
