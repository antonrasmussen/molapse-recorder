# Molapse local encoder

Optional CLI to turn a **PNG frame sequence** (canonical export from the web app) into video files using system FFmpeg.

## Requirements

- [FFmpeg](https://ffmpeg.org/) with encoders as available on your build:
  - `prores_ks` for ProRes 4444 + alpha (`.mov`)
  - `libvpx-vp9` for WebM alpha (`.webm`)
  - `libx264` for MP4 preview (`.mp4`)

Missing encoders are **warned and skipped**; the PNG sequence is always the source of truth.

## Usage

```bash
# After exporting frames to ./exports/aspirin/frames/
node encoder/cli.mjs \
  --frames ./exports/aspirin/frames \
  --name aspirin \
  --fps 30 \
  --out ./exports/aspirin \
  --formats prores,webm,mp4
```

Outputs (when encoders exist):

- `aspirin_prores4444.mov`
- `aspirin_alpha.webm`
- `aspirin_preview.mp4`

Set `FFMPEG=/path/to/ffmpeg` if needed.
