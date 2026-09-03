import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("the interface exposes core controls and accessibility landmarks", async () => {
  const html = await readFile(new URL("index.html", projectRoot), "utf8");
  assert.match(html, /<main id="main-content">/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<canvas[\s\S]*?tabindex="0"[\s\S]*?aria-label=/);
  assert.match(html, /<label>[\s\S]*?Point A[\s\S]*?<input id="point-a"/);
  assert.match(html, /<label>[\s\S]*?Point B[\s\S]*?<input id="point-b"/);
  assert.equal((html.match(/data-format=/g) || []).length, 3);
  assert.match(html, /role="status" aria-live="polite"/);
});

test("the interface states every non-operational boundary", async () => {
  const html = await readFile(new URL("index.html", projectRoot), "utf8");
  for (const phrase of [
    "no vehicle or sensor connection",
    "no route or mission planning",
    "no field-accuracy claim",
    "no inspection or certification use",
    "no operational recommendation",
  ]) {
    assert.ok(html.includes(phrase), `missing boundary: ${phrase}`);
  }
});

test("browser assets are local and responsive rules include reduced motion", async () => {
  const [html, css, app] = await Promise.all([
    readFile(new URL("index.html", projectRoot), "utf8"),
    readFile(new URL("styles.css", projectRoot), "utf8"),
    readFile(new URL("src/app.mjs", projectRoot), "utf8"),
  ]);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(app, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
