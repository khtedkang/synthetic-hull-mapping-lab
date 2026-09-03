# Synthetic Hull Mapping Learning Lab

A polished, dependency-free browser lab for exploring a deterministic fictional hull-surface point cloud. It makes an intentional coverage gap visible, measures straight-line distance between two synthetic samples, and exports the dataset as CSV, JSON, or ASCII PLY.

> Educational software demonstration only. No vehicle connection, route planning, field-accuracy claim, inspection, certification, or operational recommendation is provided.

## Why it exists

This portfolio artifact shows how an ambiguous spatial-data concept can become a transparent, testable interface with clear evidence boundaries. The emphasis is not on operational capability; it is on deterministic generation, readable interaction design, open outputs, and honest limits.

## Try it locally

Requires Node.js 20 or newer. No packages need to be installed.

```shell
npm run serve
```

Open the local address printed in the terminal. You can also open `index.html` through any static file server that supports JavaScript modules.

## Verify it

```shell
npm run generate:samples
npm run verify
```

The verification suite checks reproducibility, the declared coverage gap, unique IDs, synthetic flags, the distance function, export metadata, byte-identical committed samples, and repository boundary rules.

## Project structure

```text
data/                 deterministic sample outputs, schema, manifest, checksums
docs/                 method and scope boundaries
scripts/              sample generator, local server, boundary scan
src/                  generator, serializers, browser interaction
tests/                built-in Node test suite
index.html             accessible application shell
styles.css             responsive visual system
```

## Data notes

- Seed: `41729`
- Unit: `fictional_unit` (`f.u.` in the interface)
- Surface: simplified mathematical form, not a vessel model
- Gap: declared in JSON metadata and highlighted in the interface
- Processing: entirely local in the browser

See [Method](docs/METHOD.md) for the generation logic and [Demonstration boundaries](docs/BOUNDARIES.md) for explicit exclusions.

## Clean-room statement

No employer source code, data, documents, screenshots, branding, or private materials were used. The project was created from a fresh abstract brief using original synthetic geometry and clean-room code.

## License and disclosure

Code and documentation are available under the MIT License. The bundled dataset is synthetic and is marked as such in every format. See [AI assistance](AI_ASSISTANCE.md) for the development disclosure.
