# Contributing

Contributions should keep the lab dependency-light, deterministic, accessible, and unmistakably synthetic.

1. Create a focused branch.
2. Preserve the `synthetic: true` marker in every output format.
3. Update tests when generation, measurement, metadata, or exports change.
4. Run `npm run generate:samples` after an intentional data change.
5. Run `npm run verify` before proposing the change.
6. Explain any visual or accessibility impact in the change description.

Do not add real asset data, customer material, private locations, credentials, operational integrations, or performance claims. Do not weaken the limitations stated in `docs/BOUNDARIES.md`.
