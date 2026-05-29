# Prior art: Krita vs Molapse Recorder

**Decision: BUILD** (proceed with Molapse Recorder unless explicitly overridden.)

## Question

Does Krita already solve Hamilton's workflow well enough that we should publish a workflow guide instead of building a new tool?

Hamilton needs: stylus drawing → high-resolution transparent timelapse → usable in Premiere/FCP/DaVinci, without screen-recording fragility, palm bumps ruining takes, or low-res Procreate/Fresco exports.

## Krita workflow (evaluated)

Krita supports:

- Pressure-sensitive brush input from tablets and many styluses.
- **Recorder** docker: records canvas changes over time (not a generic screen capture).
- Export via **File → Render Animation** or FFmpeg scripts; transparency is possible with the right layer setup and codec (e.g. PNG sequence, or FFmpeg with alpha-capable pix formats where supported).

Gaps for Hamilton's exact pain:

| Need | Krita | Gap |
|------|-------|-----|
| Palm/touch rejection while drawing | OS/tablet driver dependent; not a first-class "stylus-only" mode in-app | Accidental touch can still register depending on device |
| Stroke-level undo of a bad bump without redoing the take | Full undo stack, not stroke-timeline export | Export is time-based frames, not structured stroke replay |
| Arbitrary re-export at 4K from same take | Re-render animation at new size if source is vector/raster layers | Recorder captures pixels on canvas; rescaling is not the same as vector stroke replay |
| Dead-simple "draw → transparent PNG sequence" for editors | Powerful but multi-step (layers, recorder, render settings, codecs) | High cognitive load for a non-engineer |
| iPad / Apple Pencil | Krita is desktop-first; iPad Krita exists but is a different product surface | Hamilton's Fresco/Procreate context is tablet-native |

## Conclusion

Krita is the **closest general-purpose open-source workaround** and worth mentioning in docs as an alternative. It does **not** fully match the product thesis:

> Record **vector stroke events**, replay at any resolution on transparent background, delete one bad stroke and re-export without redrawing.

That stroke-native, resolution-independent, panic-free loop is what Molapse Recorder targets. **Proceed with build.**

## If we had chosen "don't build"

Ship instead: `docs/krita-transparent-timelapse.md` (preset brush, transparent layer, Recorder docker, PNG sequence + FFmpeg alpha one-liners).
