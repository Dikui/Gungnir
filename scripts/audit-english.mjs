import fs from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("git ls-files '*.md'", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((file) => file && fs.existsSync(file))
  .filter((file) => file !== "LICENSE.zh-CN.md");

const allowed = [
  "TDD",
  "PRD",
  "ADR",
  "DDD",
  "API",
  "CLI",
  "CI",
  "CD",
  "GitHub",
  "Claude",
  "Codex",
  "Obsidian",
  "Husky",
  "Prettier",
  "lint-staged",
  "red-green-refactor",
  "mock",
  "refactor",
  "README",
  "LICENSE",
  "SKILL",
  "MIT",
  "Matt Pocock",
];

function stripCodeFences(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}

let suspicious = false;
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const text = stripCodeFences(raw);
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (/^---$/.test(trimmed)) return;
    if (/^(name|description):/.test(trimmed)) return;
    if (/https?:\/\//.test(trimmed)) return;
    let scrubbed = trimmed;
    for (const term of allowed) {
      scrubbed = scrubbed.replaceAll(term, "");
    }
    const englishWords = scrubbed.match(/[A-Za-z]{4,}/g) || [];
    if (englishWords.length >= 8) {
      suspicious = true;
      console.log(`${file}:${index + 1}: ${trimmed}`);
    }
  });
}

if (suspicious) {
  console.error("\nPotential English-heavy lines remain. Review manually.");
  process.exit(1);
}
