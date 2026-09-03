import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const textExtensions = new Set([".css", ".csv", ".html", ".js", ".json", ".md", ".mjs", ".ply", ".svg", ".txt", ".webmanifest", ".cff"]);
const ignoredDirectories = new Set([".git", "node_modules"]);

const forbidden = [
  { label: "company name", pattern: /\buam\s+korea\s+tech\b/iu },
  { label: "company abbreviation", pattern: /\buamkt\b/iu },
  { label: "company domain", pattern: new RegExp(["uam", "korea"].join(""), "iu") },
  { label: "absolute Windows user path", pattern: /[a-z]:\\users\\/iu },
  { label: "private workspace URL", pattern: /https?:\/\/[^\s"']*(?:notion|linkedin|drive\.google)/iu },
  { label: "credential marker", pattern: /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]/iu },
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(absolutePath));
    else if (textExtensions.has(path.extname(entry.name).toLowerCase()) || entry.name === "LICENSE") files.push(absolutePath);
  }
  return files;
}

const files = await listFiles(projectRoot);
const findings = [];
for (const file of files) {
  const contents = await readFile(file, "utf8");
  for (const rule of forbidden) {
    if (rule.pattern.test(contents)) findings.push(`${path.relative(projectRoot, file)}: ${rule.label}`);
  }
}

if (findings.length) {
  console.error("Boundary scan failed:\n" + findings.map((finding) => `- ${finding}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Boundary scan passed across ${files.length} text files.`);
}
