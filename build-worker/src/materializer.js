import { mkdir, writeFile, chmod } from "node:fs/promises";
import { join, resolve } from "node:path";

const MAX_FILES = 5000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export async function materializeProject(project, workspaceRoot) {
  if (!project || typeof project !== "object" || !Array.isArray(project.files)) {
    throw new Error("invalid_project");
  }
  if (project.files.length > MAX_FILES) throw new Error("too_many_files");

  const root = resolve(workspaceRoot);
  await mkdir(root, { recursive: true });

  for (const file of project.files) {
    if (!file || typeof file.path !== "string" || typeof file.content !== "string") {
      throw new Error("invalid_project_file");
    }
    if (!file.path || file.path.startsWith("/") || file.path.includes("\0")) {
      throw new Error("invalid_project_path");
    }
    const target = resolve(root, file.path);
    if (target !== root && !target.startsWith(root + "/")) {
      throw new Error("path_traversal");
    }
    const bytes = Buffer.byteLength(file.content, "utf8");
    if (bytes > MAX_FILE_BYTES) throw new Error("file_too_large");

    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, file.content, { encoding: "utf8", flag: "wx" });
  }

  const gradlew = join(root, "gradlew");
  try { await chmod(gradlew, 0o755); } catch {}
  return { workspace: root, files: project.files.length };
}
