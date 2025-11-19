#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const ALLOWED_PACKAGES = new Set([
  "cookie",
  "esbuild",
  "@stackframe/stack",
  "drizzle-kit",
  "@esbuild-kit/core-utils",
  "@esbuild-kit/esm-loader",
  "glob",
]);

const runAudit = () => {
  const result = spawnSync("npm", ["audit", "--json", "--audit-level=moderate"], {
    encoding: "utf-8",
  });

  const output = result.stdout || result.stderr;
  if (!output) {
    console.error("npm audit did not return any output");
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(output);
  } catch (error) {
    console.error("Unable to parse npm audit JSON output:", error);
    process.exit(1);
  }

  const vulnerabilities = Object.values(report.vulnerabilities ?? {});
  const allowed = [];
  const blocking = [];

  for (const vuln of vulnerabilities) {
    if (ALLOWED_PACKAGES.has(vuln.name)) {
      allowed.push(vuln);
    } else if ((vuln.severity ?? "info") !== "info") {
      blocking.push(vuln);
    }
  }

  if (blocking.length > 0) {
    const list = blocking
      .map((vuln) => {
        const via = Array.isArray(vuln.via) ? vuln.via.map((entry) => entry.source || entry).join(", ") : vuln.via;
        return `- ${vuln.name} (${vuln.severity}) via ${via}`;
      })
      .join("\n");
    throw new Error(`Blocking vulnerabilities detected by npm audit:\n${list}`);
  }

  if (allowed.length > 0) {
    console.warn(
      `npm audit reported ${allowed.length} known issue(s) that are temporarily allow-listed: ${allowed
        .map((v) => v.name)
        .join(", ")}`,
    );
  } else {
    console.log("npm audit passed with no reported vulnerabilities.");
  }
};

runAudit();
