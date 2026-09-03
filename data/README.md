# Synthetic dataset

This directory contains reproducible outputs from `src/point-cloud.mjs`.

- `synthetic-surface.csv` — flat point records
- `synthetic-surface.json` — metadata and point records
- `synthetic-surface.ply` — ASCII vertices with display colors
- `dataset-manifest.json` — compact provenance and limitations
- `point-cloud.schema.json` — JSON Schema for the full JSON export
- `checksums.sha256` — hashes for the four generated artifacts

Regenerate the outputs with `npm run generate:samples`, then run `npm run verify`. All coordinates use fictional units, and every record is marked synthetic.
