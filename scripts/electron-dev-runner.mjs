import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const concurrentlyBin = path.join(root, "node_modules", ".bin", "concurrently");
const child = spawn(
  concurrentlyBin,
  ["-k", "pnpm run dev", "pnpm run electron:run"],
  { cwd: root, stdio: "inherit", shell: false },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
