# Molapse Recorder

Local-first **vector stroke recorder** for scientific drawings. Record stylus strokes as structured data (not pixels), then replay and export high-resolution transparent timelapses for video editors.

## Quick start

```bash
npm install
npm run dev
```

See [docs/quickstart.md](docs/quickstart.md) for the full workflow.

## Features

- Pointer Events with **stylus-only / palm rejection**
- World-space strokes with pressure and timestamps
- **Save/load** `project.json`
- **Replay** with scrub and play
- **Export** transparent PNG sequences (1080p / 4K)
- Optional **MP4 preview** (WebCodecs or FFmpeg)
- Optional local **[encoder](encoder/README.md)** for ProRes 4444 / WebM alpha
- Optional **[SMILES → SVG template](templates/README.md)** for trace-over drawing

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run encode -- --frames ./path/frames --name demo` | FFmpeg encoder CLI |

## Prior art

See [docs/prior-art.md](docs/prior-art.md) for the Krita go/no-go decision.

## License

MIT — see [LICENSE](LICENSE).
