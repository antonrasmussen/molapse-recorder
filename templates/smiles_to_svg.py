#!/usr/bin/env python3
"""Optional Phase 6: SMILES -> faint SVG template for trace-over drawing.

Requires: pip install rdkit

Example:
  python templates/smiles_to_svg.py "CC(=O)OC1=CC=CC=C1C(=O)O" -o aspirin_template.svg
"""
from __future__ import annotations

import argparse
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Render SMILES to SVG for Molapse template import")
    parser.add_argument("smiles", help="SMILES string")
    parser.add_argument("-o", "--output", required=True, help="Output .svg path")
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    args = parser.parse_args()

    try:
        from rdkit import Chem
        from rdkit.Chem.Draw import rdMolDraw2D
    except ImportError:
        print("Install RDKit: pip install rdkit", file=sys.stderr)
        return 1

    mol = Chem.MolFromSmiles(args.smiles)
    if mol is None:
        print(f"Invalid SMILES: {args.smiles}", file=sys.stderr)
        return 1

    Chem.rdDepictor.Compute2DCoords(mol)
    drawer = rdMolDraw2D.MolDraw2DSVG(args.width, args.height)
    drawer.drawOptions().clearBackground = True
    drawer.DrawMolecule(mol)
    drawer.FinishDrawing()
    svg = drawer.GetDrawingText()
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
