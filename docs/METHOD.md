# Method

Synthetic Hull Mapping Learning Lab demonstrates a small, traceable geometry workflow with deliberately fictional data.

## Deterministic surface

The generator samples 31 longitudinal stations and 17 vertical bands across two sides of a simplified hull-like mathematical surface. A fixed integer seed adds slight coordinate jitter without changing the topology. Running the generator again with the same inputs yields byte-identical CSV, JSON, and PLY outputs.

The coordinate unit is `fictional_unit` (`f.u.` in the interface). It has no conversion to a physical measurement system.

## Intentional coverage gap

Before IDs are assigned, positions within a declared starboard-side x/z region are omitted. The browser view labels that region and colors neighboring samples as `gap-edge`. The absence is part of the dataset design, not evidence of real sensing performance.

## Measurement

The interface accepts two explicit point IDs and calculates straight-line distance:

`sqrt((x₂ − x₁)² + (y₂ − y₁)² + (z₂ − z₁)²)`

This is a software demonstration in fictional coordinate units.

## Export

- CSV offers flat coordinates and explicit synthetic markers.
- JSON packages metadata, constraints, and points together.
- ASCII PLY provides vertices with display colors for general 3D tooling.
- `checksums.sha256` records the deterministic sample files.

## Clean-room boundary

The geometry, interaction logic, copy, examples, tests, and exports were created from a fresh abstract brief without third-party or proprietary materials.
