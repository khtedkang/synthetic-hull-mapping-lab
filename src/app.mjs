import {
  DEFAULT_SEED,
  distance3D,
  generateHullSurface,
  toCSV,
  toJSON,
  toPLY,
} from "./point-cloud.mjs";

const dataset = generateHullSurface();
const pointsById = new Map(dataset.points.map((point) => [point.id, point]));

const canvas = document.querySelector("#point-cloud");
const context = canvas.getContext("2d");
const pointAInput = document.querySelector("#point-a");
const pointBInput = document.querySelector("#point-b");
const measurementStatus = document.querySelector("#measurement-status");
const distanceValue = document.querySelector("#distance-value");
const coordinateTable = document.querySelector("#coordinate-table");
const exportStatus = document.querySelector("#export-status");

const view = {
  yaw: -0.72,
  pitch: -0.22,
  zoom: 1,
  dragging: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  projected: [],
};

let selected = [dataset.points[108], dataset.points[211]];

document.querySelector("#point-count").textContent = dataset.metadata.pointCount.toLocaleString();
document.querySelector("#omitted-count").textContent = dataset.metadata.omittedPositions.toLocaleString();
document.querySelector("#seed-value").textContent = String(DEFAULT_SEED);
document.querySelector("#canvas-summary").textContent =
  `${dataset.metadata.pointCount} synthetic points form two sides of a simplified hull-like surface. ` +
  `${dataset.metadata.omittedPositions} grid positions are intentionally absent from a bounded starboard region.`;

function resizeCanvas() {
  const rectangle = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rectangle.width * pixelRatio));
  canvas.height = Math.max(1, Math.round(rectangle.height * pixelRatio));
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  draw();
}

function rotatePoint(point) {
  const cosYaw = Math.cos(view.yaw);
  const sinYaw = Math.sin(view.yaw);
  const cosPitch = Math.cos(view.pitch);
  const sinPitch = Math.sin(view.pitch);
  const horizontal = point.x * cosYaw - point.y * sinYaw;
  const depth = point.x * sinYaw + point.y * cosYaw;
  return {
    horizontal,
    vertical: point.z * cosPitch - depth * sinPitch,
    depth: point.z * sinPitch + depth * cosPitch,
  };
}

function projectPoint(point, width, height) {
  const rotated = rotatePoint(point);
  const baseScale = Math.min(width / 15.5, height / 8.8) * view.zoom;
  const perspective = 1 + rotated.depth * 0.018;
  return {
    ...point,
    screenX: width * 0.5 + rotated.horizontal * baseScale * perspective,
    screenY: height * 0.5 - rotated.vertical * baseScale * perspective,
    depth: rotated.depth,
    radius: Math.max(1.1, 2.05 * view.zoom * perspective),
  };
}

function drawBackdrop(width, height) {
  context.clearRect(0, 0, width, height);
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.07)";
  context.lineWidth = 1;
  const spacing = 42;
  for (let x = (width % spacing) / 2; x < width; x += spacing) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
  }
  for (let y = (height % spacing) / 2; y < height; y += spacing) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }
  context.restore();
}

function drawGapAnnotation(width, height) {
  const centerPoint = { x: 1.42, y: 2.05, z: 0.17 };
  const projectedCenter = projectPoint(centerPoint, width, height);
  const radiusX = 48 * view.zoom;
  const radiusY = 34 * view.zoom;

  context.save();
  context.strokeStyle = "rgba(227, 108, 53, 0.96)";
  context.fillStyle = "rgba(227, 108, 53, 0.08)";
  context.lineWidth = 1.5;
  context.setLineDash([6, 5]);
  context.beginPath();
  context.ellipse(projectedCenter.screenX, projectedCenter.screenY, radiusX, radiusY, -view.pitch, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.setLineDash([]);
  context.font = "700 10px SFMono-Regular, Consolas, monospace";
  context.fillStyle = "#ffb18c";
  context.fillText("INTENTIONAL GAP", projectedCenter.screenX + radiusX + 8, projectedCenter.screenY - radiusY + 4);
  context.restore();
}

function draw() {
  const rectangle = canvas.getBoundingClientRect();
  const width = rectangle.width;
  const height = rectangle.height;
  drawBackdrop(width, height);

  view.projected = dataset.points
    .map((point) => projectPoint(point, width, height))
    .sort((a, b) => a.depth - b.depth);

  for (const point of view.projected) {
    const isSelected = selected.some((item) => item?.id === point.id);
    context.beginPath();
    context.arc(point.screenX, point.screenY, isSelected ? point.radius + 3 : point.radius, 0, Math.PI * 2);
    context.fillStyle = isSelected
      ? "#ffffff"
      : point.classification === "gap-edge"
        ? "rgba(227, 108, 53, 0.93)"
        : `rgba(114, 213, 207, ${Math.min(0.92, 0.48 + (point.depth + 4) * 0.045)})`;
    context.fill();
    if (isSelected) {
      context.strokeStyle = "#e36c35";
      context.lineWidth = 2;
      context.stroke();
    }
  }

  drawGapAnnotation(width, height);
}

function normalizedPointId(value) {
  return value.trim().toUpperCase();
}

function tableRow(point, label) {
  if (!point) return `<tr><td>${label}</td><td colspan="3">—</td></tr>`;
  return `<tr><td>${label} · ${point.id}</td><td>${point.x.toFixed(3)}</td><td>${point.y.toFixed(3)}</td><td>${point.z.toFixed(3)}</td></tr>`;
}

function updateMeasurement({ announce = true } = {}) {
  const idA = normalizedPointId(pointAInput.value);
  const idB = normalizedPointId(pointBInput.value);
  const pointA = pointsById.get(idA);
  const pointB = pointsById.get(idB);
  pointAInput.setAttribute("aria-invalid", String(Boolean(idA) && !pointA));
  pointBInput.setAttribute("aria-invalid", String(Boolean(idB) && !pointB));
  selected = [pointA, pointB].filter(Boolean);

  coordinateTable.innerHTML = `${tableRow(pointA, "A")}${tableRow(pointB, "B")}`;
  if (pointA && pointB) {
    const distance = distance3D(pointA, pointB);
    distanceValue.textContent = distance.toFixed(3);
    measurementStatus.textContent = announce
      ? `Measured ${pointA.id} to ${pointB.id} in fictional coordinate units.`
      : "Both point IDs are valid.";
  } else {
    distanceValue.textContent = "—";
    measurementStatus.textContent = idA || idB
      ? "Enter two point IDs present in the synthetic dataset."
      : "Select or enter two points to calculate a distance.";
  }
  draw();
}

function useSelectedPair(point) {
  const pointA = pointsById.get(normalizedPointId(pointAInput.value));
  const pointB = pointsById.get(normalizedPointId(pointBInput.value));
  if (!pointA || (pointA && pointB)) {
    pointAInput.value = point.id;
    pointBInput.value = "";
  } else {
    pointBInput.value = point.id;
  }
  updateMeasurement();
}

function nearestPoint(clientX, clientY) {
  const rectangle = canvas.getBoundingClientRect();
  const x = clientX - rectangle.left;
  const y = clientY - rectangle.top;
  let nearest = null;
  let nearestDistance = 13;
  for (const point of view.projected) {
    const distance = Math.hypot(point.screenX - x, point.screenY - y);
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }
  return nearest;
}

canvas.addEventListener("pointerdown", (event) => {
  view.dragging = true;
  view.startX = event.clientX;
  view.startY = event.clientY;
  view.lastX = event.clientX;
  view.lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!view.dragging) return;
  const deltaX = event.clientX - view.lastX;
  const deltaY = event.clientY - view.lastY;
  if (Math.abs(deltaX) + Math.abs(deltaY) > 1) {
    view.yaw += deltaX * 0.008;
    view.pitch = Math.max(-1.25, Math.min(1.25, view.pitch + deltaY * 0.008));
    view.lastX = event.clientX;
    view.lastY = event.clientY;
    draw();
  }
});

canvas.addEventListener("pointerup", (event) => {
  const moved = Math.hypot(event.clientX - view.startX, event.clientY - view.startY);
  view.dragging = false;
  if (moved < 5) {
    const point = nearestPoint(event.clientX, event.clientY);
    if (point) useSelectedPair(point);
  }
});

canvas.addEventListener("pointercancel", () => {
  view.dragging = false;
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  view.zoom = Math.max(0.55, Math.min(1.75, view.zoom * (event.deltaY > 0 ? 0.92 : 1.08)));
  draw();
}, { passive: false });

canvas.addEventListener("keydown", (event) => {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "_", "0"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  if (event.key === "ArrowLeft") view.yaw -= 0.1;
  if (event.key === "ArrowRight") view.yaw += 0.1;
  if (event.key === "ArrowUp") view.pitch = Math.max(-1.25, view.pitch - 0.1);
  if (event.key === "ArrowDown") view.pitch = Math.min(1.25, view.pitch + 0.1);
  if (["+", "="].includes(event.key)) view.zoom = Math.min(1.75, view.zoom * 1.08);
  if (["-", "_"].includes(event.key)) view.zoom = Math.max(0.55, view.zoom * 0.92);
  if (event.key === "0") Object.assign(view, { yaw: -0.72, pitch: -0.22, zoom: 1 });
  draw();
});

for (const input of [pointAInput, pointBInput]) {
  input.addEventListener("input", () => updateMeasurement({ announce: false }));
  input.addEventListener("change", () => updateMeasurement());
}

document.querySelector("#sample-pair").addEventListener("click", () => {
  pointAInput.value = dataset.points[108].id;
  pointBInput.value = dataset.points[211].id;
  updateMeasurement();
});

document.querySelector("#reset-view").addEventListener("click", () => {
  Object.assign(view, { yaw: -0.72, pitch: -0.22, zoom: 1 });
  draw();
  canvas.focus();
});

document.querySelector("#starboard-view").addEventListener("click", () => {
  Object.assign(view, { yaw: -1.48, pitch: -0.12, zoom: 1.08 });
  draw();
  canvas.focus();
});

function download(format) {
  const serializers = {
    csv: { content: toCSV(dataset), type: "text/csv;charset=utf-8" },
    json: { content: toJSON(dataset), type: "application/json;charset=utf-8" },
    ply: { content: toPLY(dataset), type: "text/plain;charset=utf-8" },
  };
  const selection = serializers[format];
  if (!selection) return;
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([selection.content], { type: selection.type }));
  link.href = url;
  link.download = `synthetic-hull-mapping-lab.${format}`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  exportStatus.textContent = `${format.toUpperCase()} export prepared locally.`;
}

for (const button of document.querySelectorAll("[data-format]")) {
  button.addEventListener("click", () => download(button.dataset.format));
}

pointAInput.value = selected[0].id;
pointBInput.value = selected[1].id;
updateMeasurement({ announce: false });

new ResizeObserver(resizeCanvas).observe(canvas);
window.addEventListener("resize", resizeCanvas);
