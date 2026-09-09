import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { materializeProject } from "./materializer.js";

const root = await mkdtemp(join(tmpdir(), "veyro-materializer-"));
try {
  const result = await materializeProject({
    files: [
      { path: "settings.gradle", content: "rootProject.name='demo'\n" },
      { path: "app/src/main/AndroidManifest.xml", content: "<manifest/>" }
    ]
  }, root);
  assert.equal(result.files, 2);
  assert.equal(await readFile(join(root, "settings.gradle"), "utf8"), "rootProject.name='demo'\n");

  await assert.rejects(
    () => materializeProject({ files: [{ path: "../escape.txt", content: "x" }] }, root),
    /path_traversal/
  );

  console.log("VEYRO Project Materializer tests: PASS");
} finally {
  await rm(root, { recursive: true, force: true });
}
