/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");

const files = process.argv.slice(2);
if (files.length < 2) {
  console.error("Usage: node scripts/mergeWorkouts.js warmup.json main.json cooldown.json > merged.json");
  process.exit(1);
}

let merged = JSON.parse(fs.readFileSync(files[0], "utf8"));
let nextStepOrder = merged.segments[0].steps.length + 1;

for (let i = 1; i < files.length; i++) {
  const part = JSON.parse(fs.readFileSync(files[i], "utf8"));
  const newSteps = part.segments[0].steps.map((s) => ({
    ...s,
    stepOrder: nextStepOrder++,
  }));
  merged.segments[0].steps.push(...newSteps);
}

merged.estimatedDurationInSecs = merged.segments[0].steps.reduce((sum, s) => sum + (s.durationValue || 0), 0);

console.log(JSON.stringify(merged, null, 2));
