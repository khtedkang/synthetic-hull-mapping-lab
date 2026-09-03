import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  createManifest,
  generateHullSurface,
  toCSV,
  toJSON,
  toPLY,
} from "../src/point-cloud.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(projectRoot, "data");
await mkdir(dataDirectory, { recursive: true });

const dataset = generateHullSurface();
const outputs = new Map([
  ["synthetic-surface.csv", toCSV(dataset)],
  ["synthetic-surface.json", toJSON(dataset)],
  ["synthetic-surface.ply", toPLY(dataset)],
  ["dataset-manifest.json", `${JSON.stringify(createManifest(dataset), null, 2)}\n`],
]);

for (const [filename, contents] of outputs) {
  await writeFile(path.join(dataDirectory, filename), contents, "utf8");
}

const checksums = [...outputs.entries()]
  .map(([filename, contents]) => `${createHash("sha256").update(contents).digest("hex")}  ${filename}`)
  .join("\n") + "\n";
await writeFile(path.join(dataDirectory, "checksums.sha256"), checksums, "utf8");

console.log(`Generated ${outputs.size} deterministic files and checksums for ${dataset.points.length} points.`);
