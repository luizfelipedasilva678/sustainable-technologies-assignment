import { readFile } from "node:fs/promises";

export default async function getFileContent(path: string) {
  return readFile(path, "utf8");
}
