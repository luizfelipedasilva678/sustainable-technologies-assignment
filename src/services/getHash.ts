import { createHash } from "node:crypto";

export default function getHash(str: string) {
  return createHash("sha256").update(str).digest("hex");
}
