import { createServer } from "node:http";

const port = Number(process.env.PORT || 8080);

const server = createServer((req, res) => {
  res.setHeader("content-type", "application/json");

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    return res.end(JSON.stringify({
      service: "veyro-build-engine",
      status: "ok",
      version: "0.1.0"
    }));
  }

  if (req.method === "POST" && req.url === "/build") {
    res.writeHead(202);
    return res.end(JSON.stringify({
      accepted: true,
      status: "queued",
      message: "Build job accepted by VEYRO Build Engine."
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`VEYRO Build Engine listening on :${port}`);
});
