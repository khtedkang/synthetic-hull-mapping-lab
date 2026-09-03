export const DATASET_VERSION = "1.0.0";
export const DEFAULT_SEED = 41729;

export const GAP_BOUNDS = Object.freeze({
  side: "starboard",
  xMin: 0.4,
  xMax: 2.45,
  zMin: -0.6,
  zMax: 0.95,
});

const round = (value, places = 3) => Number(value.toFixed(places));

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function isInsideIntentionalGap({ x, z, side }) {
  return (
    side === GAP_BOUNDS.side &&
    x >= GAP_BOUNDS.xMin &&
    x <= GAP_BOUNDS.xMax &&
    z >= GAP_BOUNDS.zMin &&
    z <= GAP_BOUNDS.zMax
  );
}

function isNearGap({ x, z, side }) {
  if (side !== GAP_BOUNDS.side) return false;
  const margin = 0.34;
  const withinOuter =
    x >= GAP_BOUNDS.xMin - margin &&
    x <= GAP_BOUNDS.xMax + margin &&
    z >= GAP_BOUNDS.zMin - margin &&
    z <= GAP_BOUNDS.zMax + margin;
  return withinOuter && !isInsideIntentionalGap({ x, z, side });
}

export function generateHullSurface(options = {}) {
  const seed = Number.isInteger(options.seed) ? options.seed : DEFAULT_SEED;
  const longitudinalSteps = options.longitudinalSteps ?? 31;
  const verticalSteps = options.verticalSteps ?? 17;

  if (longitudinalSteps < 3 || verticalSteps < 3) {
    throw new RangeError("longitudinalSteps and verticalSteps must each be at least 3");
  }

  const random = seededRandom(seed);
  const points = [];
  let omittedPositions = 0;

  for (let longitudinalIndex = 0; longitudinalIndex < longitudinalSteps; longitudinalIndex += 1) {
    const rawX = -6 + (12 * longitudinalIndex) / (longitudinalSteps - 1);
    const longitudinalProfile = Math.sqrt(Math.max(0.035, 1 - (rawX / 6.35) ** 2));

    for (let verticalIndex = 0; verticalIndex < verticalSteps; verticalIndex += 1) {
      const rawZ = -2.1 + (4.2 * verticalIndex) / (verticalSteps - 1);
      const verticalProfile = Math.sqrt(Math.max(0.07, 1 - ((rawZ + 0.12) / 2.7) ** 2));
      const halfBeam = 2.52 * longitudinalProfile * verticalProfile;

      for (const sideSign of [-1, 1]) {
        const side = sideSign === 1 ? "starboard" : "port";
        const sourcePosition = { x: rawX, z: rawZ, side };
        if (isInsideIntentionalGap(sourcePosition)) {
          omittedPositions += 1;
          continue;
        }

        const x = round(rawX + (random() - 0.5) * 0.028);
        const y = round(sideSign * halfBeam + (random() - 0.5) * 0.02);
        const z = round(rawZ + (random() - 0.5) * 0.024);

        points.push({
          id: `P${String(points.length + 1).padStart(4, "0")}`,
          x,
          y,
          z,
          side,
          classification: isNearGap(sourcePosition) ? "gap-edge" : "sample",
          synthetic: true,
        });
      }
    }
  }

  return {
    metadata: {
      title: "Synthetic Hull Mapping Learning Lab synthetic surface",
      datasetVersion: DATASET_VERSION,
      seed,
      generatedBy: "deterministic clean-room generator",
      coordinateUnit: "fictional_unit",
      synthetic: true,
      intendedUse: "education_and_software_demonstration_only",
      pointCount: points.length,
      omittedPositions,
      grid: { longitudinalSteps, verticalSteps, sides: 2 },
      intentionalGap: { ...GAP_BOUNDS },
      exclusions: [
        "vehicle_connection",
        "route_planning",
        "field_accuracy",
        "inspection",
        "certification",
        "operational_use",
      ],
    },
    points,
  };
}

export function distance3D(pointA, pointB) {
  if (!pointA || !pointB) throw new TypeError("Two points are required");
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y, pointA.z - pointB.z);
}

function csvCell(value) {
  const stringValue = String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

export function toCSV(dataset) {
  const header = ["id", "x", "y", "z", "side", "classification", "synthetic", "coordinate_unit"];
  const rows = dataset.points.map((point) => [
    point.id,
    point.x,
    point.y,
    point.z,
    point.side,
    point.classification,
    point.synthetic,
    dataset.metadata.coordinateUnit,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function toJSON(dataset) {
  return `${JSON.stringify(dataset, null, 2)}\n`;
}

export function toPLY(dataset) {
  const header = [
    "ply",
    "format ascii 1.0",
    "comment synthetic educational dataset",
    `comment deterministic_seed ${dataset.metadata.seed}`,
    "comment coordinate_unit fictional_unit",
    `element vertex ${dataset.points.length}`,
    "property float x",
    "property float y",
    "property float z",
    "property uchar red",
    "property uchar green",
    "property uchar blue",
    "end_header",
  ];
  const vertices = dataset.points.map((point) => {
    const color = point.classification === "gap-edge" ? [227, 108, 53] : [114, 213, 207];
    return [point.x, point.y, point.z, ...color].join(" ");
  });
  return [...header, ...vertices].join("\n") + "\n";
}

export function createManifest(dataset) {
  return {
    name: "synthetic-hull-mapping-lab-surface",
    version: DATASET_VERSION,
    synthetic: true,
    deterministic: true,
    seed: dataset.metadata.seed,
    coordinateUnit: dataset.metadata.coordinateUnit,
    pointCount: dataset.metadata.pointCount,
    omittedPositions: dataset.metadata.omittedPositions,
    intentionalGap: dataset.metadata.intentionalGap,
    formats: ["csv", "json", "ply"],
    intendedUse: dataset.metadata.intendedUse,
    exclusions: dataset.metadata.exclusions,
  };
}
