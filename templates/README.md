# Chemistry templates (optional)

Generate a faint SVG background to trace over in Molapse Recorder. **Your strokes are still the recording** — the template is not part of the stroke export unless you draw over it.

## SMILES → SVG

```bash
pip install rdkit
python templates/smiles_to_svg.py "CC(=O)OC1=CC=CC=C1C(=O)O" -o aspirin_template.svg
```

In the app: **Load SVG template** (sidebar), then draw on top.

RDKit owns depiction; Molapse owns capture and export. For publication-grade layout, use ChemDraw and export SVG instead.
