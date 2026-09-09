import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const port = Number(process.env.PORT || 8080);
const jobs = new Map();
const MAX_BODY_BYTES = 1024 * 1024;
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";
const AI_BASE_URL = process.env.AI_BASE_URL || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "default";
const MAX_PROMPT_CHARS = 4000;

async function generateProject(prompt) {
  if (!AI_BASE_URL || !AI_API_KEY) {
    throw new Error("ai_provider_not_configured");
  }
  if (typeof prompt !== "string" || !prompt.trim()) throw new Error("prompt_required");
  if (prompt.length > MAX_PROMPT_CHARS) throw new Error("prompt_too_long");

  const response = await fetch(AI_BASE_URL.replace(/\/$/, "") + "/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are VEYRO Project Generator. Return ONLY valid JSON: {files:[{path:string,content:string}]}. Generate a minimal Android Gradle project. Paths must be relative, never absolute, and must not contain .. ."
        },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!response.ok) throw new Error(`ai_provider_http_${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("ai_empty_response");
  const project = JSON.parse(content);
  if (!Array.isArray(project.files) || project.files.length === 0) throw new Error("invalid_generated_project");
  return project;
}


function send(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error("request_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    req.on("error", reject);
  });
}

function validateBuild(input) {
  if (!input || typeof input !== "object") return "body must be an object";
  if (!input.projectId || typeof input.projectId !== "string") return "projectId is required";
  if (!["apk", "aab"].includes(input.output ?? "apk")) return "output must be apk or aab";
  if (input.source && typeof input.source !== "string") return "source must be a string";
  if (input.prompt !== undefined && (typeof input.prompt !== "string" || input.prompt.length > MAX_PROMPT_CHARS)) return "prompt must be a string up to 4000 characters";
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  res.setHeader("cache-control", "no-store");

  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, {
      service: "veyro-build-engine",
      status: "ok",
      version: "0.2.0",
      queueDepth: [...jobs.values()].filter(j => j.status === "queued").length
    });
  }

  if (req.method === "GET" && url.pathname === "/build") {
    return send(res, 200, {
      jobs: [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    });
  }

  if (req.method === "POST" && url.pathname === "/ai/generate") {
    try {
      const input = await readJson(req);
      const project = await generateProject(input.prompt);
      return send(res, 200, { ok: true, project });
    } catch (error) {
      const status = error.message === "ai_provider_not_configured" ? 503 : 400;
      return send(res, status, { error: error.message || "generation_failed" });
    }
  }

  if (req.method === "POST" && url.pathname === "/build") {
    try {
      const input = await readJson(req);
      const error = validateBuild(input);
      if (error) return send(res, 400, { error });

      const id = randomUUID();
      const job = {
        id,
        projectId: input.projectId,
        output: input.output ?? "apk",
        source: input.source ?? null,
        project: input.project ?? null,
        status: "queued",
        createdAt: new Date().toISOString()
      };
      jobs.set(id, job);

      return send(res, 202, {
        accepted: true,
        job
      });
    } catch (error) {
      return send(res, error.message === "request_too_large" ? 413 : 400, {
        error: error.message || "invalid_request"
      });
    }
  }

  if (req.method === "POST" && url.pathname === "/build/claim") {
    if (WORKER_TOKEN && req.headers.authorization !== `Bearer ${WORKER_TOKEN}`) {
      return send(res, 401, { error: "unauthorized" });
    }
    const job = [...jobs.values()]
      .filter(j => j.status === "queued")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (!job) return send(res, 204, {});
    job.status = "running";
    job.startedAt = new Date().toISOString();
    return send(res, 200, { job });
  }

  if (req.method === "POST" && url.pathname.startsWith("/build/") && url.pathname.endsWith("/result")) {
    if (WORKER_TOKEN && req.headers.authorization !== `Bearer ${WORKER_TOKEN}`) {
      return send(res, 401, { error: "unauthorized" });
    }
    const id = url.pathname.slice("/build/".length, -"/result".length);
    const job = jobs.get(id);
    if (!job) return send(res, 404, { error: "job_not_found" });
    try {
      const result = await readJson(req);
      if (!["success", "failed"].includes(result.status)) {
        return send(res, 400, { error: "status must be success or failed" });
      }
      job.status = result.status;
      job.finishedAt = new Date().toISOString();
      job.artifact = result.artifact ?? null;
      job.error = result.error ?? null;
      return send(res, 200, { job });
    } catch (error) {
      return send(res, 400, { error: error.message || "invalid_request" });
    }
  }

  if (req.method === "GET" && url.pathname.startsWith("/build/")) {
    const id = url.pathname.slice("/build/".length);
    const job = jobs.get(id);
    if (!job) return send(res, 404, { error: "job_not_found" });
    return send(res, 200, { job });
  }

  return send(res, 404, { error: "not_found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`VEYRO Build Engine listening on :${port}`);
});
