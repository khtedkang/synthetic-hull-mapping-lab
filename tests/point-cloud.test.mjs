import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_SEED,
  GAP_BOUNDS,
  createManifest,
  distance3D,
  generateHullSurface,
  isInsideIntentionalGap,
  toCSV,
  toJSON,
  toPLY,
} from "../src/point-cloud.mjs";

test("generation is deterministic for the same seed", () => {
  assert.deepEqual(generateHullSurface({ seed: DEFAULT_SEED }), generateHullSurface({ seed: DEFAULT_SEED }));
});

test("different seeds change coordinate jitter but preserve topology", () => {
  const first = generateHullSurface({ seed: 1 });
  const second = generateHullSurface({ seed: 2 });
  assert.equal(first.points.length, second.points.length);
  assert.notDeepEqual(first.points[25], second.points[25]);
});

test("the declared gap has no included points and reports omissions", () => {
  const dataset = generateHullSurface();
  assert.ok(dataset.metadata.omittedPositions > 0);
  assert.deepEqual(dataset.metadata.intentionalGap, GAP_BOUNDS);
  assert.equal(dataset.points.filter(isInsideIntentionalGap).length, 0);
  assert.ok(dataset.points.some((point) => point.classification === "gap-edge"));
});

test("every generated point is explicitly synthetic and has a unique ID", () => {
  const dataset = generateHullSurface();
  assert.ok(dataset.points.every((point) => point.synthetic === true));
  assert.equal(new Set(dataset.points.map((point) => point.id)).size, dataset.points.length);
});

test("distance3D computes an ordinary Euclidean distance", () => {
  assert.equal(distance3D({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 12 }), 13);
});

test("step counts smaller than three are rejected", () => {
  assert.throws(() => generateHullSurface({ longitudinalSteps: 2 }), RangeError);
  assert.throws(() => generateHullSurface({ verticalSteps: 1 }), RangeError);
});

test("CSV, JSON, PLY, and manifest preserve point-count metadata", () => {
  const dataset = generateHullSurface();
  const csv = toCSV(dataset);
  const json = JSON.parse(toJSON(dataset));
  const ply = toPLY(dataset);
  const manifest = createManifest(dataset);

  assert.equal(csv.trimEnd().split("\n").length, dataset.points.length + 1);
  assert.equal(json.metadata.pointCount, dataset.points.length);
  assert.match(ply, new RegExp(`element vertex ${dataset.points.length}\\n`));
  assert.equal(manifest.pointCount, dataset.points.length);
  assert.equal(manifest.synthetic, true);
});

test("committed sample files match the deterministic generator", async () => {
  const dataset = generateHullSurface();
  const [csv, json, ply] = await Promise.all([
    readFile(new URL("../data/synthetic-surface.csv", import.meta.url), "utf8"),
    readFile(new URL("../data/synthetic-surface.json", import.meta.url), "utf8"),
    readFile(new URL("../data/synthetic-surface.ply", import.meta.url), "utf8"),
  ]);
  assert.equal(csv, toCSV(dataset));
  assert.equal(json, toJSON(dataset));
  assert.equal(ply, toPLY(dataset));
});

test("the checksum ledger matches every generated data artifact", async () => {
  const dataDirectory = new URL("../data/", import.meta.url);
  const ledger = await readFile(new URL("checksums.sha256", dataDirectory), "utf8");
  const records = ledger.trim().split("\n").map((line) => {
    const [hash, filename] = line.split(/\s{2}/);
    return { hash, filename };
  });
  assert.equal(records.length, 4);
  for (const record of records) {
    const contents = await readFile(new URL(record.filename, dataDirectory));
    assert.equal(createHash("sha256").update(contents).digest("hex"), record.hash);
  }
});
