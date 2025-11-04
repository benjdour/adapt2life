/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");

function clean(value) {
  if (Array.isArray(value)) {
    return value.map(clean).filter((item) => item !== null && item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([key, v]) => [key, clean(v)]),
    );
  }

  return value;
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/compressWorkout.js full.json > full_clean.json");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));
const cleaned = clean(data);
console.log(JSON.stringify(cleaned, null, 2));
