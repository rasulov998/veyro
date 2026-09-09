import assert from "node:assert/strict";
import { processJob } from "./src/index.js";

const calls = [];
global.fetch = async (url, options) => {
  calls.push({ url, options });
  return { ok: true, status: 200, json: async () => ({}) };
};

const fs = await import("node:fs");
const path = await import("node:path");
const root = "/tmp/veyro-worker-test";
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(path.join(root, "test-project"), { recursive: true });

process.env.WORKSPACE_ROOT = root;
await processJob({ id: "job-test", projectId: "test-project", output: "apk" });

assert.equal(calls.length, 1);
assert.match(calls[0].url, /\/build\/job-test\/result$/);
const body = JSON.parse(calls[0].options.body);
assert.equal(body.status, "failed");
assert.equal(body.error, "android_project_not_materialized");

console.log("VEYRO Build Worker tests: PASS");
