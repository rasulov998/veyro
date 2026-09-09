import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 8099;
const child = spawn(process.execPath, ["src/index.js"], {
  cwd: new URL(".", import.meta.url).pathname.replace(/\/test\.js$/, ""),
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore"
});

const base = `http://127.0.0.1:${port}`;
try {
  await new Promise(r => setTimeout(r, 150));
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  const healthJson = await health.json();
  assert.equal(healthJson.status, "ok");

  const bad = await fetch(`${base}/build`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(bad.status, 400);

  const created = await fetch(`${base}/build`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId: "test-project", output: "apk" })
  });
  assert.equal(created.status, 202);
  const createdJson = await created.json();
  assert.equal(createdJson.job.status, "queued");

  const job = await fetch(`${base}/build/${createdJson.job.id}`);
  assert.equal(job.status, 200);

  console.log("VEYRO Build Engine tests: PASS");
} finally {
  child.kill();
}
