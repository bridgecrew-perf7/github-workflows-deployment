import { deleteAsync } from "del";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export async function withTmpDir<T>(body: (tmpDir: string) => Promise<T>): Promise<T> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codeql-action-"));
  const realSubdir = path.join(tmpDir, "real");
  fs.mkdirSync(realSubdir);
  const symlinkSubdir = path.join(tmpDir, "symlink");
  fs.symlinkSync(realSubdir, symlinkSubdir, "dir");
  const result = await body(symlinkSubdir);
  await deleteAsync(tmpDir, { force: true });
  return result;
}

export function getOwnerAndRepoFromUrl(url: string): { owner: string; repo: string } {
  const re = new RegExp("(?:git@|https://)github.com[:/](?<owner>.+)/(?<repo>.+)(?:.git)?", "g");
  const match = re.exec(url);
  if (!match) {
    throw new Error(`Invalid URL: ${url}`);
  }
  return match.groups as { owner: string; repo: string };
}
