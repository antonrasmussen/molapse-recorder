# Molapse Recorder

Local-first vector stroke recorder for scientific drawings. Record stylus strokes as structured data (not pixels), then replay and export high-resolution transparent timelapses for video editors.

**Status:** Phase 0–1 (capture core). Persistence, replay export, and alpha video encoders are not implemented yet.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal. Draw with mouse or stylus; enable **Stylus only** to ignore touch/palm input.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |

## Prior art

See [docs/prior-art.md](docs/prior-art.md) for the Krita go/no-go decision.

## License

MIT — see [LICENSE](LICENSE).
