import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const engineUrl = process.env.BUILD_ENGINE_URL || "http://127.0.0.1:8080";
const workspaceRoot = resolve(process.env.WORKSPACE_ROOT || "/tmp/veyro-workspaces");
const workerToken = process.env.WORKER_TOKEN || "";
const pollMs = Number(process.env.POLL_MS || 2000);

function headers() {
  return workerToken
    ? { authorization: `Bearer ${workerToken}`, "content-type": "application/json" }
    : { "content-type": "application/json" };
}

async function claimJob() {
  const res = await fetch(`${engineUrl}/build/claim`, { method: "POST", headers: headers() });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`claim_failed:${res.status}`);
  return (await res.json()).job;
}

function runGradle(workspace, output) {
  const task = output === "aab" ? "bundleRelease" : "assembleDebug";
  const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  return new Promise((resolveRun, reject) => {
    const child = spawn(gradle, [task, "--no-daemon", "--stacktrace"], {
      cwd: workspace,
      env: { ...process.env, CI: "true" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", d => { stdout += d.toString(); });
    child.stderr.on("data", d => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", code => resolveRun({ code, stdout, stderr }));
  });
}

function findArtifact(workspace, output) {
  const dir = output === "aab"
    ? join(workspace, "app/build/outputs/bundle")
    : join(workspace, "app/build/outputs/apk");
  return existsSync(dir) ? dir : null;
}

async function report(id, payload) {
  await fetch(`${engineUrl}/build/${id}/result`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });
}

export async function processJob(job) {
  const workspace = join(workspaceRoot, job.projectId);
  mkdirSync(workspace, { recursive: true });

  // The trusted project service must materialize the project into this workspace
  // before a job is claimed. The worker never executes arbitrary remote URLs.
  if (!existsSync(join(workspace, "gradlew"))) {
    await report(job.id, {
      status: "failed",
      error: "android_project_not_materialized"
    });
    return;
  }

  const result = await runGradle(workspace, job.output);
  const artifactPath = result.code === 0 ? findArtifact(workspace, job.output) : null;

  if (result.code === 0 && artifactPath) {
    await report(job.id, {
      status: "success",
      artifact: { directory: artifactPath, output: job.output }
    });
  } else {
    await report(job.id, {
      status: "failed",
      error: result.stderr.slice(-4000) || `gradle_exit_${result.code}`
    });
  }
}

export async function startWorker() {
  mkdirSync(workspaceRoot, { recursive: true });
  console.log("VEYRO Build Worker started");
  while (true) {
    try {
      const job = await claimJob();
      if (job) await processJob(job);
    } catch (error) {
      console.error(error.message);
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
}

if (process.env.NODE_ENV !== "test") startWorker();
